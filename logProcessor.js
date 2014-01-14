var strftime = require('strftime');

function LogProcessor() {
}

LogProcessor.prototype.processLogs = function(proxiedRequest) {
    var format = ':ip :deploymentUrl :userID [:clfDate] ":method :url :protocol/:httpVersion" :statusCode :contentLength ":referer" ":userAgent" :label';

    var remoteAddress = proxiedRequest.request.connection.remoteAddress || '-';
    var end = new Date();
    var requestLog, userID, uriDecoded;

    try {
        userID = new Buffer(proxiedRequest.request.headers.authorization.
            split(' ')[1], 'base64').toString().split(':')[0];
    } catch(e) {
        userID = '-';
    }

    try {
        uriDecoded = decodeURIComponent(req.url);
    } catch (e) {
        uriDecoded = e.message || 'Error decoding URI';
    }
    
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
    var logMessage = this.template(format, requestLog);
    return logMessage;
}

LogProcessor.prototype.template = function(s, d) {
    s = s.replace(/(:[a-zA-Z]+)/g, function(match, key) {
    return d[key] || '';
  });
    return s.replace(/:{([a-zA-Z]+)}/g, function(match, key) {
    return d[':' + key] || '';
  });
}

module.exports = LogProcessor;
