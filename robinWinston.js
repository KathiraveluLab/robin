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

var RobinWinstonConsole = winston.transports.RobinWinstonConsole = function (options) {
    this.name = 'robinWinstonConsole';
    this.logProcessor = new LogProcessor();
};

util.inherits(RobinWinstonConsole, winston.Transport);

RobinWinstonConsole.prototype.log = function (level, msg, meta, callback) { 
    msg = this.logProcessor.processLogs(meta);
    process.stdout.write(msg + '\n');
    callback(null, true);
};

module.exports = RobinWinston;
module.exports.RobinWinstonConsole = RobinWinstonConsole;
