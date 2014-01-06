var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    Cookies = require('cookies');

Robin.prototype.maximumWeight = 1000;
Robin.prototype.defaultPort = 80;

function Robin() {
    this.configObject = etc().argv().env().etc();
    this.conf = this.configObject.toJSON();
    this.noOfDeployments = this.conf.deployments.length;
    this.cookieName = this.conf.cookie_name;
    this.cookies = new Cookies();
    this.receivedValue = null;
    this.cookieValue = null;
    this.deployments = this.initDeployments();
    this.expiryTime = this.getExpiryTime();
    this.labels = this.initLabels();
    this.labelledDeployments = this.labelDeployments();
    this.defaultDeployment = null; 
    this.domainIndex = 0;
    this.target = this.defaultDeployment;
}

Robin.prototype.initDeployments = function () {
    this.deployments = [];
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.deployments[i] = {
            host: this.conf.deployments[i].addr,
            port: this.conf.deployments[i].port
        };
        if (this.conf.deployments[i].addr == this.conf.default_deployment) {
            this.domainIndex = i;
            this.defaultDeployment = this.deployments[i];
        }
    }
    return this.deployments;
}

Robin.prototype.initLabels = function () {
    this.labels = [];
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.labels[i] = this.conf.deployments[i].label;
    }
    return this.labels;
}

Robin.prototype.labelDeployments = function () {
    this.labelledDeployments = new Array(); 
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.labelledDeployments[this.labels[i]] = this.deployments[i];
    }
    return this.labelledDeployments;
}

Robin.prototype.getProxyPort = function () {
    return this.conf.proxy_port || this.defaultPort; // "proxy_port" is optional in config.json.
}

Robin.prototype.getExpiryTime = function () {
    var currentTimeInMillis = new Date().getTime();
    var expires = parseInt(this.conf.expires);
    var expiryTime = new Date(currentTimeInMillis + expires);
    return expiryTime;
}

Robin.prototype.proxyRequests = function (req, res, proxy) {
    this.cookies = new Cookies(req, res);
    this.receivedValue = this.cookies.get(this.cookieName);
    if (typeof this.receivedValue == 'undefined') {
        this.target = this.matchProxy(res);
        this.cookieValue = this.labels[this.domainIndex];
        this.cookies.set(this.cookieName, this.cookieValue, {expires: this.expiryTime}, {domain: req.headers.host});
        res.writeHead( 302, { "Location": "/" } )
        return res.end();
     } else {        
        this.target = this.labelledDeployments[this.receivedValue];
     }
    proxy.proxyRequest(req, res, this.target);
}

Robin.prototype.matchProxy = function (res) {
    var randomnumber= this.generateRandomNumber();
    var depWeight;
    for (var i = 0; i < this.noOfDeployments; i++) {
        depWeight = this.conf.deployments[i].weight;
        if (randomnumber < depWeight) {
            this.domainIndex = i;
            return this.deployments[i];
        } else {
            randomnumber = randomnumber - depWeight;
        }
    }
    return this.defaultDeployment;
}

Robin.prototype.generateRandomNumber = function () {
    var randomNumber = 
        Math.ceil(Math.random()*(this.conf.max_weight || this.maximumWeight)); 
        // "max_weight" is optional in config.json.
    return randomNumber;
}

module.exports = Robin;
