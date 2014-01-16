var _ = require('underscore')._,
    util = require("util"),
    winston = require('winston'),
    strftime = require('strftime');

var RobinWinston = function (robin, winston) {
	this.robin = robin;
	this.winston = winston;
	_.bindAll(this, 'handleEvent');
	this.init();
}

RobinWinston.prototype.init = function () {
	this.robin.on('proxiedRequest', this.handleEvent);
}

RobinWinston.prototype.handleEvent = function (event) {
	this.winston.info(event);
}

var RobinWinstonConsole = winston.transports.RobinWinstonConsole = function (options) {
    this.winston;
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
        this.winston = options.winston;
        return options;
    }
}

RobinWinstonConsole.prototype.log = function (level, msg, meta, callback) { 
    var processedMessage = this.processLogs(meta);

    if (this.mode == 'file') {
        this.winston.add(winston.transports.File, {filename: this.options.filename}). 
            remove(this);
        this.winston.info(processedMessage);
    } else {
        winston.transports.Console.prototype.log(level, msg, processedMessage, callback);
    }
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
    var minimalRequestObject, userID, end = new Date();
    var requestLine = '\"' + proxiedRequest.request.method + ' ' + proxiedRequest.request.url + 
        ' HTTP/' + proxiedRequest.request.httpVersion + '\"';

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

module.exports = RobinWinston;
module.exports.RobinWinstonConsole = RobinWinstonConsole;
