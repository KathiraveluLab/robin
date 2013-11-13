var httpProxy = require('http-proxy/lib/node-http-proxy');
var etc = require('etc');

var conf = etc().argv().env().etc();
var chunk = conf.toJSON();

var noOfDeployments = chunk.deployments.length;
var defaultDeployment;
var maximumRandomNumber = 1000;

var addresses = initAddresses();
var pport = initProxyPort();


httpProxy.createServer(function (req, res, proxy) {
    target = matchProxy();
 
    console.log('balancing request to: ', target);
    proxy.proxyRequest(req, res, target);
    
}).listen(pport);

function initAddresses() {
    var deployments = [];
    for (var i = 0; i < noOfDeployments; i ++) {
        deployments[i] = {
            host: chunk.deployments[i].addr,
            port: chunk.deployments[i].port
        };
        if (chunk.deployments[i].label == chunk.default_deployment) {
            defaultDeployment = deployments[i];
        }
    }
    return deployments;
}

function matchProxy() {
    var randomnumber= generateRandomNumber();
    var depWeight;
    for (var i = 0; i < noOfDeployments; i++) {
        depWeight = chunk.deployments[i].weight;
        if (randomnumber < depWeight) {
            return addresses[i];
        } else {
            randomnumber = randomnumber - depWeight;
        }
    }
    return defaultDeployment;
}

function generateRandomNumber() {
    var randomNumber = Math.floor(Math.random()*(maximumRandomNumber+1));
    console.log('Random Number: ' ,randomNumber);
    return randomNumber;
}

function initProxyPort() {
    var port=80;
    if (chunk.proxy_port>0 && 
        chunk.proxy_port<65535) { //  e.g: "proxy_port": "8000" in config.json,
        port = chunk.proxy_port;
    }
    return port;
}
