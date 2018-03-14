'use strict';

let _ = require('highland');
let vamp = require('vamp-node-client');
let api = new vamp.Api({host: 'http://10.204.106.51:31115'});
let http = new vamp.Http();
let metrics = new vamp.ElasticsearchMetrics(api);
let headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};
var $gateway  = process.env.GATEWAY;
var $service1 = process.env.SERVICE_CURRENT;
var $service2 = process.env.SERVICE_NEXT;
var $deployment_name = process.env.DEPLOYMENT_NAME;
var $period = Number(process.env.PERIOD); // seconds
var $window = Number(process.env.WINDOW); // seconds

var run = function () {
  api.get('gateways/' + $gateway).each(function (gateway) {
	metrics.count({ft: gateway.lookup_name}, {ST: {gte: 500}}, $window).each(function (errorCount) {
	  if (errorCount > 0)
		rollback(gateway);
	  else
		increase(gateway, gateway['routes'][$service1]['weight']);
	});
  });
};

var increase = function (gateway, oldWeight) {
  oldWeight = oldWeight.substring(0, oldWeight.length - 1);
  if (oldWeight > 0) {
	var newWeight = oldWeight - 50;
	gateway['routes'][$service1]['weight'] = newWeight < 0 ? '0%' : newWeight + '%';
	gateway['routes'][$service2]['weight'] = newWeight < 0 ? '100%' : (100 - newWeight) + '%';
	update(gateway);
  } else {
    console.log('Removing previous deployment');

    let deletebreed = {'clusters': {$deployment_name: {'services': {'breed': {'name': $service1 }}}}};
    console.log(deletebreed);

    http.request(api.url + '/deployments/' + $deployment_name, {method: 'DELETE', headers: headers}, JSON.stringify(deletebreed)).then(function () {
      console.log('Done - delete workflow');
    });
    clearInterval(mainloop);
  }
};

var rollback = function (gateway) {
  if ( gateway['routes'][$service1]['weight'] !== '100%') {
	gateway['routes'][$service1]['weight'] = '100%';
	gateway['routes'][$service2]['weight'] = '0%';
	update(gateway);
  }
};

var update = function (gateway) {
  http.request(api.url + '/gateways/' + $gateway, {method: 'PUT', headers: headers}, JSON.stringify(gateway)).then(function () {
	api.event(['workflows:canary', 'updated'],
	  gateway['routes'][$service1]['weight'] + '/' + gateway['routes'][$service2]['weight']);
      console.log('Update gateway weight, new value: ' + gateway['routes'][$service1]['weight']);
  }).catch(function (error) {
	api.event(['workflows:canary', 'error'], error);
  });
};

var mainloop = setInterval(run, $period * 1000);
