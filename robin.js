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
    this.defaultDeployment; 
    this.domainIndex;
    this.target;
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
    robin.cookies = new Cookies(req, res);
    robin.receivedValue = robin.cookies.get(robin.cookieName);
    if (robin.receivedValue == undefined) {
        robin.target = robin.matchProxy(res);
        robin.cookieValue = robin.labels[robin.domainIndex];
        robin.cookies.set(robin.cookieName,robin.cookieValue, {expires: robin.expiryTime}, {domain: req.headers.host});
        res.writeHead( 302, { "Location": "/" } )
        return res.end();
     } else {        
        robin.target = robin.findDeployment(robin.receivedValue);
     }
    proxy.proxyRequest(req, res, robin.target);
}).listen(robin.pport);

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

Robin.prototype.findDeployment = function (depLabel) {
    for (var i = 0; i < this.noOfDeployments; i++) {
        if (depLabel == this.labels[i]) {
            return this.addresses[i];
        } 
    }
    return this.defaultDeployment;
}

Robin.prototype.generateRandomNumber = function () {
    var randomNumber = Math.floor(Math.random()*(this.maximumRandomNumber+1));
    return randomNumber;
}
