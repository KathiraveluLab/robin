var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    accesslog = require('access-log'),    
    Robin = require('./robin');

var configObject = etc().argv().env().etc();
var robin = new Robin(configObject.toJSON());

var server = httpProxy.createServer(function (req, res, proxy) {
    accesslog(req, res); // logs the accesses.
    robin.proxyRequests(req, res, proxy);
}).listen(robin.getProxyPort());
