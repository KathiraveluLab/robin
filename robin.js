var httpProxy = require('http-proxy/lib/node-http-proxy'),
    Cookies = require('cookies');

Robin.prototype.maximumWeight = 1000;
Robin.prototype.defaultPort = 80;

function Robin(conf) {
    this.conf = conf;
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
    var receivedCookieValue = cookies.get(this.conf.cookie_name);

    if (typeof receivedCookieValue == 'undefined') { // No cookie in the request. Initial request.
        this.proxyRequestFirstTime(req, res, proxy);
    } else { //cookie found in the request
        this.proxySubsequentRequests(req, res, proxy, receivedCookieValue);
    }    
}

Robin.prototype.proxyRequestFirstTime = function (req, res, proxy) {
    var cookies = new Cookies(req, res);
    var maxWeight = this.conf.max_weight || this.maximumWeight; // "max_weight" is optional in config.json.
    var deploymentLabel = this.generateDeploymentLabel(maxWeight);  

    var target = this.conf.deployments[deploymentLabel];
    var cookieName = this.conf.cookie_name;
    var expiryTime = this.getExpiryTime();

    res.oldWriteHead = res.writeHead;
    
    res.writeHead = function(statusCode, headers) {
        cookies.set(cookieName, deploymentLabel, {expires: expiryTime}, {domain: req.headers.host});
        res.setHeader('content-type', 'text/html');
        res.oldWriteHead(statusCode, headers);
    }
    proxy.proxyRequest(req, res, target); 
}

Robin.prototype.proxySubsequentRequests = function (req, res, proxy, deploymentLabel) {
    var target;
    if (typeof this.conf.deployments[deploymentLabel] != 'undefined') { //valid cookie in the request
        target = this.conf.deployments[deploymentLabel];
    } else { // no valid cookie found in the request
        target = this.conf.default_deployment;
    }
    proxy.proxyRequest(req, res, target); 
}

Robin.prototype.generateDeploymentLabel = function (maxWeight) {
    var randomNumber = this.generateRandomNumber(maxWeight);
    var depWeight;
    for (var label in this.conf.deployments) {
        if (this.conf.deployments.hasOwnProperty(label)) {
            depWeight = this.conf.deployments[label].weight;
            if (randomNumber < depWeight) {
                return label;
            } else {
                randomNumber = randomNumber - depWeight;
            }
        }
    }
    return label;
}

Robin.prototype.generateRandomNumber = function (maxWeight) {
    var randomNumber = Math.ceil(Math.random() * maxWeight);   
    return randomNumber;
}

module.exports = Robin;
