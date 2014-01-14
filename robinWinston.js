var _ = require('underscore')._,
    util = require("util"),
    winston = require('winston'),
    LogProcessor = require('./logProcessor');

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

var RobinCustomLogger = winston.transports.RobinCustomerLogger = function (options) {
    this.name = 'robinCustomLogger';
    this.logProcessor = new LogProcessor();
};

util.inherits(RobinCustomLogger, winston.Transport);

RobinCustomLogger.prototype.log = function (level, msg, meta, callback) { 
    msg = this.logProcessor.processLogs(meta);
    process.stdout.write(msg + '\n');
    callback(null, true);
};

module.exports = RobinWinston;
module.exports.RobinCustomLogger = RobinCustomLogger;
