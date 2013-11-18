var httpProxy = require('http-proxy/lib/node-http-proxy'),
    etc = require('etc'),
    Cookies = require('cookies');

var conf = etc().argv().env().etc();
var chunk = conf.toJSON();

var noOfDeployments = chunk.deployments.length;
var defaultDeployment;
var maximumRandomNumber = 1000;
var cookieName = chunk.cookie_name;
var unsignedCookie, cookieValue;
var domainIndex = 0;

var addresses = initAddresses();
var pport = initProxyPort();
var expiryTime = setExpiryTime();

var cookies, target;
var robin = new Robin();

var server = httpProxy.createServer(function (req, res, proxy) {
    cookies = new Cookies(req, res);
    unsignedCookie = cookies.get(cookieName);

    if (unsignedCookie == undefined) {
        cookieValue = cookieName + domainIndex;
        target = robin.matchProxy(res);
        cookies.set(cookieName,cookieValue, {expires: expiryTime}, {domain: target});
        res.writeHead( 302, { "Location": "/" } )
        return res.end();
     }

    else if (unsignedCookie.indexOf(cookieName) > -1) {
        var splitted = unsignedCookie.split(cookieName, 2);
        if (splitted[1]!='') {
             domainIndex = splitted[1];
        }
        target = addresses[domainIndex];
     }
    proxy.proxyRequest(req, res, target);
}).listen(pport);

function Robin() {
}

Robin.prototype.matchProxy = function (res) {
    var randomnumber= this.generateRandomNumber();
    var depWeight;
    for (var i = 0; i < noOfDeployments; i++) {
        depWeight = chunk.deployments[i].weight;
        if (randomnumber < depWeight) {
            domainIndex = i;
            return addresses[i];
        } else {
            randomnumber = randomnumber - depWeight;
        }
    }
    return defaultDeployment;
}

Robin.prototype.generateRandomNumber = function () {
    var randomNumber = Math.floor(Math.random()*(maximumRandomNumber+1));
    return randomNumber;
}

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

function initProxyPort() {
    var defaultPort = 80;
    return chunk.proxy_port || defaultPort; // "proxy_port" is optional in config.json.
}

function setExpiryTime() {
    var currentTimeInMillis = new Date().getTime();
    var expires = parseInt(chunk.expires);
    var expiryTime = new Date(currentTimeInMillis + expires);
    return expiryTime;
}
