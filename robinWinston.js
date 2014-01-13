var httpProxy = require('http-proxy/lib/node-http-proxy'),
    strftime = require('strftime'),
    winston = require('winston'),
    Robin = require('./robin');

var robin = new Robin();

function RobinWinston(robinObject) {
    robin = robinObject;
	this.initialize();
}

RobinWinston.prototype.initialize = function() {
    winston.add(winston.transports.File, {filename: 'robin.log'});
    winston.remove(winston.transports.Console);
}

RobinWinston.prototype.processLogs = function(proxiedRequest) {
    var format = ':ip :deploymentUrl :userID [:clfDate] ":method :url :protocol/:httpVersion" :statusCode :contentLength ":referer" ":userAgent" :label';
    var remoteAddress;
    var requestLog;
    var userID;
    remoteAddress = proxiedRequest.request.connection.remoteAddress || '-';
    try {
      userID = new Buffer(proxiedRequest.request.headers.authorization.
      	split(' ')[1], 'base64').toString().split(':')[0];
    } catch(e) {
    	userID = '-';
    }

    var uriDecoded;
    try {
        uriDecoded = decodeURIComponent(req.url);
    } catch (e) {
    uriDecoded = e.message || 'Error decoding URI';
    }
    var end = new Date();
    var requestLog = {
        ':userID': userID || '-',
        ':deploymentUrl': proxiedRequest.target.host,
        ':ip': remoteAddress || '-',
        ':clfDate': strftime('%d/%b/%Y:%H:%M:%S %z', end),
        ':method': proxiedRequest.request.method,
        ':url': proxiedRequest.request.url,
        ':httpVersion': proxiedRequest.request.httpVersion,     
        ':statusCode': proxiedRequest.response.statusCode,
        ':contentLength': proxiedRequest.response.getHeader('content-length') || 
            proxiedRequest.response.contentLength || '-',
        ':referer': proxiedRequest.request.headers.referer || '-',
        ':userAgent': proxiedRequest.request.headers['user-agent'] || '-',
        ':label': proxiedRequest.label
    };
    
    var log = template(format, requestLog);
    winston.info(log);
}

// replace :variable and :{variable} in `s` with what's in `d`
function template(s, d) {
  s = s.replace(/(:[a-zA-Z]+)/g, function(match, key) {
    return d[key] || '';
  });
  return s.replace(/:{([a-zA-Z]+)}/g, function(match, key) {
    return d[':' + key] || '';
  });
}

module.exports = RobinWinston;
