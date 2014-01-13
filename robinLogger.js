var httpProxy = require('http-proxy/lib/node-http-proxy'),
    winston = require('winston'),
    loggly = require('loggly'),
    LogProcessor = require('./logProcessor');

require('winston-loggly');

function RobinLogger(conf) {
    this.conf = conf;
    this.logMode = 'console';
    this.initializeLogger();
}

RobinLogger.prototype.initializeLogger = function() {
    if (typeof process.argv[2] != 'undefined') {
        winston.remove(winston.transports.Console);
        if (process.argv[2] === '-file') {
            winston.add(winston.transports.File, {filename: process.argv[3]});
            this.logMode = 'file';
        } else if (process.argv[2] === '-loggly') {
            winston.add(winston.transports.Loggly, this.conf.transports.loggly);
            this.logMode = 'loggly';
        }
    }
}

RobinLogger.prototype.processLogs = function(proxiedRequest) {
    if (this.logMode === 'console' || this.logMode === 'file') {
        var logProcessor = new LogProcessor();
        logProcessor.processLogs(proxiedRequest);
    } else {
        winston.info(proxiedRequest);   
    }
}

module.exports = RobinLogger;
