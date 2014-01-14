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
    var requestLine = '\"' + proxiedRequest.request.method + ' ' + proxiedRequest.request.url + 
        ' HTTP' + proxiedRequest.request.httpVersion + '\"';

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
        timestamp: '[' + strftime('%d/%b/%Y:%H:%M:%S %z', end) + ']',
        requestLine: requestLine,     
        statusCode: proxiedRequest.response.statusCode,
        contentLength: proxiedRequest.response.getHeader('content-length') || 
            proxiedRequest.response.contentLength || '-',
        referer: proxiedRequest.request.headers.referer || '-',
        userAgent: proxiedRequest.request.headers['user-agent'] || '-',
        label: proxiedRequest.label
    }
    // Format: IP of the Client, Deployment URL, User ID, Time, Method, Request Line, 
    // HTTP Status Code, Content Length, Referring Page, User Agent, Label.
    return minimalRequestObject;
}

module.exports = LogProcessor;
