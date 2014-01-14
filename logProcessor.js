var strftime = require('strftime');

function LogProcessor() {
}

LogProcessor.prototype.processLogs = function(proxiedRequest) {
    var formattedMessage = '';
    var minimalRequestObject = this.getMinimalRequestObject(proxiedRequest);

    for(var property in minimalRequestObject) {
        formattedMessage += minimalRequestObject[property] + ' ';
    }
    return formattedMessage;
}

LogProcessor.prototype.getMinimalRequestObject = function(proxiedRequest) {
    var minimalRequestObject, userID, end = new Date();

    try {
        userID = new Buffer(proxiedRequest.request.headers.authorization.
            split(' ')[1], 'base64').toString().split(':')[0];
    } catch(e) {
        userID = '-';
    } 

    minimalRequestObject = {
        ip: proxiedRequest.request.connection.remoteAddress || '-',
        deploymentUrl: proxiedRequest.target.host,
        userId: userID,
        clfDate: strftime('%d/%b/%Y:%H:%M:%S %z', end),
        method: proxiedRequest.request.method,
        url: proxiedRequest.request.url,
        httpVersion: proxiedRequest.request.httpVersion,     
        statusCode: proxiedRequest.response.statusCode,
        contentLength: proxiedRequest.response.getHeader('content-length') || 
            proxiedRequest.response.contentLength || '-',
        referer: proxiedRequest.request.headers.referer || '-',
        userAgent: proxiedRequest.request.headers['user-agent'] || '-',
        label: proxiedRequest.label
    }
    return minimalRequestObject;
}

module.exports = LogProcessor;
