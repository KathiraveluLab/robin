Robin
=====

### UniPlaces Proxy ###

### Features
* Proxies the deployments.
* Based on the weight function, directs the traffic to the deployments.
* Uses cookies to facilitate stickiness, such that the same deployment
will be used to serve the same user till the cookie expires.


### Directory Structure
├── abproxy
│   ├── etc
│   │   └── config.json.sample
│   ├── package.json
│   ├── proxy.js
│   └── README.md


### Installing Node and npm
If you are entirely new to NodeJs, you may have to install NodeJS and npm first.
* Install Node.js on Ubuntu.
sudo apt-get install nodejs 

* Install npm (node package manager)
sudo su
curl https://npmjs.org/install.sh | sh


### Installing and Configuring Robin
* To install Robin, installing the dependencies,
npm install 
from the robin root directory

Create the configuration file config.json.
Sample can be found at etc/config.json.sample

### To run
From the robin root directory
node proxy

To be able to bind port 80 to the proxy
sudo setcap 'cap_net_bind_service=+ep' path_to_node
For example,
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node

Note: proxy_port is an optional parameter in config.json.
"proxy_port": "8000",
Default is, 80.
