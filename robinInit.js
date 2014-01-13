var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    winston = require('winston'),
    RobinWinston = require('./robinWinston'),      
    Robin = require('./robin');

var configObject = etc().argv().env().etc();
var robin = new Robin(configObject.toJSON());

if (typeof process.argv[2] != 'undefined' && process.argv[2] === '-l') {
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.File, {filename: process.argv[3]});
}

var robinWinston = new RobinWinston(robin, winston);

var server = httpProxy.createServer(function (req, res, proxy) {
    robin.proxyRequests(req, res, proxy);
}).listen(robin.getProxyPort());
