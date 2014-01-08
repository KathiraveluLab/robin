var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    Robin = require('./robin');

var configObject = etc().argv().env().etc();
var robin = new Robin(configObject.toJSON());

var server = httpProxy.createServer(function (req, res, proxy) {
    robin.proxyRequests(req, res, proxy);
}).listen(robin.getProxyPort());
