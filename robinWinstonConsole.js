var util = require('util'),
    fs = require('fs'),
    winston = require('winston'),
    strftime = require('strftime'),
    endOfLine = require('os').EOL;

var RobinWinstonConsole = winston.transports.RobinWinstonConsole = function (options) {
    this.name = 'robinWinstonConsole';
    this.level = 'info';
    this.mode = 'console';
    this.options = this.initialize(options);
}

util.inherits(RobinWinstonConsole, winston.Transport);

RobinWinstonConsole.prototype.initialize = function (options) { 
    if (typeof options != 'undefined') {
        this.level = options.level || 'info';
        this.mode = typeof options.filename != 'undefined' ? 'file' : 'console';
        return options;
    }
}

RobinWinstonConsole.prototype.log = function (level, msg, meta, callback) { 
    var processedMessage = this.processLogs(meta);

    if (this.mode == 'file') {
        this.logToFile(level, msg, processedMessage, callback, this.options.filename);    
    } else {
        winston.transports.Console.prototype.log(level, msg, processedMessage, callback);
    }
}

RobinWinstonConsole.prototype.logToFile = function (level, msg, processedMessage, callback, file) { 
    fs.appendFile(file, processedMessage + endOfLine, function(error) {
        if(error) {
            winston.transports.Console.prototype.log(level, msg, processedMessage, callback);
        }
    });
}

RobinWinstonConsole.prototype.processLogs = function(proxiedRequest) {
    var formattedMessage = '';
    var minimalRequestObject = this.getMinimalRequestObject(proxiedRequest);

    for(var property in minimalRequestObject) {
        formattedMessage += minimalRequestObject[property] + ' ';
    }
    return formattedMessage;
}

RobinWinstonConsole.prototype.getMinimalRequestObject = function(proxiedRequest) {
    var minimalRequestObject, userId, timestamp = new Date();
    var requestLine = '\"' + proxiedRequest.request.method + ' ' + proxiedRequest.request.url + 
        ' HTTP/' + proxiedRequest.request.httpVersion + '\"';

    try {
        userId = new Buffer(proxiedRequest.request.headers.authorization.
            split(' ')[1], 'base64').toString().split(':')[0];
    } catch(e) {
        userId = '-';
    } 

    minimalRequestObject = {
        clientIP: proxiedRequest.request.connection.remoteAddress || '-',
        deploymentUrl: proxiedRequest.target.host,
        userId: userId,
        timestamp: '[' + strftime('%d/%b/%Y:%H:%M:%S %z', timestamp) + ']',
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

module.exports = RobinWinstonConsole;
