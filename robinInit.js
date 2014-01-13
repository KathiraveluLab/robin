var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    winston = require('winston'),
    RobinLogger = require('./robinLogger'),      
    Robin = require('./robin');

var configObject = etc().argv().env().etc();
var robin = new Robin(configObject.toJSON());
var robinLogger = new RobinLogger(configObject.toJSON());

var server = httpProxy.createServer(function (req, res, proxy) {
    robin.proxyRequests(req, res, proxy);
}).listen(robin.getProxyPort());

robin.on('proxiedRequest', function(proxiedRequest) {
    robinLogger.processLogs(proxiedRequest);
});