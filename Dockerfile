FROM openresty/openresty:1.13.6.1-alpine

ARG tag

EXPOSE 5000
ENTRYPOINT ["/usr/local/openresty/bin/openresty"]

RUN LAYER=build \
    && adduser -h /home/blaze -s /sbin/nologin -D -u 498 blaze \
    && mkdir -p /run/nginx \
    && mkdir -p /usr/local/openresty/nginx/client_body_temp \
    && mkdir -p /usr/local/openresty/nginx/proxy_temp \
    && mkdir -p /usr/local/openresty/nginx/fastcgi_temp \
    && mkdir -p /usr/local/openresty/nginx/uwsgi_temp \
    && mkdir -p /usr/local/openresty/nginx/scgi_temp

ADD https://raw.githubusercontent.com/knyar/nginx-lua-prometheus/0.1-20170610/prometheus.lua /usr/local/openresty/lualib/blaze/prometheus.lua

ADD nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

RUN LAYER=fixperms \
    && chown blaze /usr/local/openresty/nginx/client_body_temp \
    && chown blaze /usr/local/openresty/nginx/proxy_temp \
    && chown blaze /usr/local/openresty/nginx/fastcgi_temp \
    && chown blaze /usr/local/openresty/nginx/uwsgi_temp \
    && chown blaze /usr/local/openresty/nginx/scgi_temp \
    && chmod -R 755 /usr/local/openresty/lualib \
    && mkdir -p /etc/nginx \
    && chown blaze:blaze /etc/nginx

USER blaze

LABEL blaze.service.id="lambo" \
      blaze.service.name="blaze-lambo-service" \
      blaze.service.version="${tag}" \
      blaze.service.team="Tooling" \
      blaze.service.description="Moon!" \
      blaze.service.main-language="nginx" \
      blaze.service.features.health-check.enabled="true" \
      blaze.service.features.health-check.endpoint="/status" \
      blaze.service.features.metrics.enabled="true" \
      blaze.service.deployment.cpu="0.1" \
      blaze.service.deployment.memory="50" \
      blaze.service.deployment.minimum-instances="1" \
      blaze.service.deployment.internal-port="5000" \
      blaze.service.deployment.promotion.prod.manual-step="false" \
      blaze.service.deployment.strategy="yolo" \
      blaze.service.routing.trusted.exposed="true" \
      blaze.service.routing.consumer.exposed="false"
