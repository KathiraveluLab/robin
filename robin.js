var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    Cookies = require('cookies');

var configObject = etc().argv().env().etc();
var conf = configObject.toJSON();

var noOfDeployments = conf.deployments.length;
var defaultDeployment, domainIndex, target;
var maximumRandomNumber = 1000;
var cookieName = conf.cookie_name;
var cookies, receivedValue, cookieValue;

var addresses = initAddresses();
var pport = initProxyPort();
var expiryTime = setExpiryTime();
var labels = initLabels();

var robin = new Robin();

var server = httpProxy.createServer(function (req, res, proxy) {
    cookies = new Cookies(req, res);
    receivedValue = cookies.get(cookieName);

    if (receivedValue == undefined) {
        target = robin.matchProxy(res);
        cookieValue = labels[domainIndex];
        cookies.set(cookieName,cookieValue, {expires: expiryTime}, {domain: target});
        res.writeHead( 302, { "Location": "/" } )
        return res.end();
     } else {        
        target = robin.findDeployment(receivedValue);
     }
    proxy.proxyRequest(req, res, target);
}).listen(pport);

function Robin() {
}

Robin.prototype.matchProxy = function (res) {
    var randomnumber= this.generateRandomNumber();
    var depWeight;
    for (var i = 0; i < noOfDeployments; i++) {
        depWeight = conf.deployments[i].weight;
        if (randomnumber < depWeight) {
            domainIndex = i;
            return addresses[i];
        } else {
            randomnumber = randomnumber - depWeight;
        }
    }
    return defaultDeployment;
}

Robin.prototype.findDeployment = function (depLabel) {
    for (var i = 0; i < noOfDeployments; i++) {
        if (depLabel == labels[i]) {
            return addresses[i];
        } else {
            return defaultDeployment;
        }
    }
}

Robin.prototype.generateRandomNumber = function () {
    var randomNumber = Math.floor(Math.random()*(maximumRandomNumber+1));
    return randomNumber;
}

function initAddresses() {
    var deployments = [];
    for (var i = 0; i < noOfDeployments; i ++) {
        deployments[i] = {
            host: conf.deployments[i].addr,
            port: conf.deployments[i].port
        };
        if (conf.deployments[i].addr == conf.default_deployment) {
            domainIndex = i;
            defaultDeployment = deployments[i];
        }
    }
    return deployments;
}

function initLabels() {
    var deploymentLabels = [];
    for (var i = 0; i < noOfDeployments; i ++) {
        deploymentLabels[i] = conf.deployments[i].label;
    }
    return deploymentLabels;
}

function initProxyPort() {
    var defaultPort = 80;
    return conf.proxy_port || defaultPort; // "proxy_port" is optional in config.json.
}

function setExpiryTime() {
    var currentTimeInMillis = new Date().getTime();
    var expires = parseInt(conf.expires);
    var expiryTime = new Date(currentTimeInMillis + expires);
    return expiryTime;
}
