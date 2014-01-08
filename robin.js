var httpProxy = require('http-proxy/lib/node-http-proxy'),
    Cookies = require('cookies');

Robin.prototype.maximumWeight = 1000;
Robin.prototype.defaultPort = 80;

function Robin(conf) {
    this.conf = conf;
    this.defaultDeploymentIndex = 0;
    this.defaultDeployment = this.initDefaultDeployment(); 
    this.labels = this.initLabels();
    this.labelledDeployments = this.labelDeployments();
}

Robin.prototype.initDefaultDeployment = function () {
    for (var i = 0; i < this.conf.deployments.length; i++) {
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
    for (var i = 0; i < this.conf.deployments.length; i++) {
        this.labels[i] = this.conf.deployments[i].label;
    }
    return this.labels;
}

Robin.prototype.labelDeployments = function () {
    this.labelledDeployments = {}; 
    for (var i = 0; i < this.conf.deployments.length; i++) {
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
    var receivedValue = cookies.get(this.conf.cookie_name);

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
    var target = this.conf.deployments[deploymentIndex];

    var cookieName = this.conf.cookie_name;
    var cookieValue = this.labels[deploymentIndex];
    var expiryTime = this.getExpiryTime();

    res.oldWriteHead = res.writeHead;
    
    res.writeHead = function(statusCode, headers) {
        cookies.set(cookieName, cookieValue, {expires: expiryTime}, {domain: req.headers.host});
        res.setHeader('content-type', 'text/html');
        res.oldWriteHead(statusCode, headers);
    }
    proxy.proxyRequest(req, res, target); 
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
    for (var index = 0; index < this.conf.deployments.length; index++) {
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
