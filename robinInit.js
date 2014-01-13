var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    winston = require('winston'),
    RobinWinston = require('./robinWinston'),      
    Robin = require('./robin');

var configObject = etc().argv().env().etc();
var robin = new Robin(configObject.toJSON());
var robinWinston = new RobinWinston(robin, winston);

var server = httpProxy.createServer(function (req, res, proxy) {
    robin.proxyRequests(req, res, proxy);
}).listen(robin.getProxyPort());
