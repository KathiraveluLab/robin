var _ = require('underscore')._;

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

module.exports = RobinWinston;
