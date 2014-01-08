var httpProxy = require('http-proxy/lib/node-http-proxy'),
    Cookies = require('cookies');

Robin.prototype.maximumWeight = 1000;
Robin.prototype.defaultPort = 80;

function Robin(conf) {
    this.conf = conf;
    this.noOfDeployments = this.conf.deployments.length;
    this.defaultDeploymentIndex = 0;
    this.defaultDeployment = this.initDefaultDeployment(); 
    this.labels = this.initLabels();
    this.labelledDeployments = this.labelDeployments();
    this.cookieName = this.conf.cookie_name;
    this.expiryTime = this.getExpiryTime();
}

Robin.prototype.initDefaultDeployment = function () {
    for (var i = 0; i < this.noOfDeployments; i++) {
        if ((this.conf.deployments[i].addr == this.conf.default_deployment) && 
            (this.conf.deployments[i].port == this.conf.default_deployment_port)) {
            this.defaultDeploymentIndex = i;
            this.defaultDeployment = this.conf.deployments[i];
            return this.conf.deployments[i];
        }
    }
    return this.conf.deployments[this.defaultDeploymentIndex]; //initialize to deployments[0]
}

Robin.prototype.initLabels = function () {
    this.labels = [];
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.labels[i] = this.conf.deployments[i].label;
    }
    return this.labels;
}

Robin.prototype.labelDeployments = function () {
    this.labelledDeployments = {}; 
    for (var i = 0; i < this.noOfDeployments; i++) {
        this.labelledDeployments[this.labels[i]] = this.conf.deployments[i];
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
    var cookies = new Cookies(req, res);
    var receivedValue = cookies.get(this.cookieName);

    if (typeof receivedValue == 'undefined') { // No cookie in the request. Initial request.
        this.proxyRequestFirstTime(req, res, proxy);
    } else { //cookie found in the request
        this.proxySubsequentRequests(req, res, proxy, receivedValue);
    }    
}

Robin.prototype.proxyRequestFirstTime = function (req, res, proxy) {
    var cookies = new Cookies(req, res);
    var maxWeight = this.conf.max_weight || this.maximumWeight; // "max_weight" is optional in config.json.
    var deploymentIndex = this.generateDeploymentIndex(maxWeight);  
    target = this.conf.deployments[deploymentIndex];

    var cookieValue = this.labels[deploymentIndex];
    cookies.set(this.cookieName, cookieValue, {expires: this.expiryTime}, {domain: req.headers.host});
    res.writeHead(200);
    return res.end();
}

Robin.prototype.proxySubsequentRequests = function (req, res, proxy, deploymentIndex) {
    var target;
    if (typeof this.labelledDeployments[deploymentIndex] != 'undefined') { //valid cookie in the request
        target = this.labelledDeployments[deploymentIndex];
    } else { // no valid cookie found in the request
        target = this.defaultDeployment;
    }
    proxy.proxyRequest(req, res, target); 
}

Robin.prototype.generateDeploymentIndex = function (maxWeight) {
    var randomNumber = this.generateRandomNumber(maxWeight);
    var depWeight;
    for (var index = 0; index < this.noOfDeployments; index++) {
        depWeight = this.conf.deployments[index].weight;
        if (randomNumber < depWeight) {
            return index;
        } else {
            randomNumber = randomNumber - depWeight;
        }
    }
    return this.defaultDeploymentIndex;
}

Robin.prototype.generateRandomNumber = function (maxWeight) {
    var randomNumber = Math.ceil( Math.random() * maxWeight );   
    return randomNumber;
}

module.exports = Robin;