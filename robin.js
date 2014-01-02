var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    Cookies = require('cookies');

Robin.prototype.maximumRandomNumber = 1000;

function Robin() {
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    this.configObject = etc().argv().env().etc();
    this.conf = this.configObject.toJSON();
    this.noOfDeployments = this.conf.deployments.length;
    this.cookieName = this.conf.cookie_name;
    this.cookies;
    this.receivedValue;
    this.cookieValue;
    this.addresses = this.initDeployments();
    this.pport = this.initProxyPort();
    this.expiryTime = this.setExpiryTime();
    this.labels = this.initLabels();
    this.labelledDeployments = this.labelDeployments();
    this.defaultDeployment; 
    this.domainIndex;
    this.target = this.defaultDeployment;
}

Robin.prototype.initDeployments = function () {
    var deployments = [];
    for (var i = 0; i < this.noOfDeployments; i ++) {
        deployments[i] = {
            host: this.conf.deployments[i].addr,
            port: this.conf.deployments[i].port
        };
        if (this.conf.deployments[i].addr == this.conf.default_deployment) {
            this.domainIndex = i;
            this.defaultDeployment = deployments[i];
        }
    }
    return deployments;
}

Robin.prototype.initLabels = function () {
    var deploymentLabels = [];
    for (var i = 0; i < this.noOfDeployments; i ++) {
        deploymentLabels[i] = this.conf.deployments[i].label;
    }
    return deploymentLabels;
}

Robin.prototype.labelDeployments = function () {
    labelledDeployments = new Array(); 
    var deploymentLabels = [];
    for (var i = 0; i < this.noOfDeployments; i ++) {
        deploymentLabels[i] = this.conf.deployments[i].label;
        labelledDeployments[deploymentLabels[i]] = this.addresses[i];
    }
    return labelledDeployments;
}

Robin.prototype.initProxyPort = function () {
    var defaultPort = 80;
    return this.conf.proxy_port || defaultPort; // "proxy_port" is optional in config.json.
}

Robin.prototype.setExpiryTime = function () {
    var currentTimeInMillis = new Date().getTime();
    var expires = parseInt(this.conf.expires);
    var expiryTime = new Date(currentTimeInMillis + expires);
    return expiryTime;
}

var robin = new Robin();

var server = httpProxy.createServer(function (req, res, proxy) {
    robin.createServer(req, res, proxy);
}).listen(robin.pport);

Robin.prototype.createServer = function (req, res, proxy) {
    this.cookies = new Cookies(req, res);
    this.receivedValue = this.cookies.get(this.cookieName);
    if (this.receivedValue == undefined) {
        this.target = this.matchProxy(res);
        this.cookieValue = this.labels[this.domainIndex];
        this.cookies.set(this.cookieName,this.cookieValue, {expires: this.expiryTime}, {domain: req.headers.host});
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
            return this.addresses[i];
        } else {
            randomnumber = randomnumber - depWeight;
        }
    }
    return this.defaultDeployment;
}

Robin.prototype.generateRandomNumber = function () {
    var randomNumber = Math.floor(Math.random()*(this.maximumRandomNumber+1));
    return randomNumber;
}
