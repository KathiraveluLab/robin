var httpProxy = require('http-proxy/lib/node-http-proxy'),
	Robin = require('./robin');

var robin = new Robin();

var server = httpProxy.createServer(function (req, res, proxy) {
    robin.proxyRequests(req, res, proxy);
}).listen(robin.getProxyPort());
