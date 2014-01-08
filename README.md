Robin
=====

### UniPlaces Proxy ###

### Features
* Proxies the deployments for A/B Testing.
* Based on the weight function, directs the traffic to the deployments.
* Uses cookies to facilitate stickiness, such that the same deployment
will be used to serve the same user till the cookie expires.


### Directory Structure
├── robin
│   ├── etc
│   │   └── config.sample.json
│   ├── LICENSE
│   ├── package.json
│   ├── README.md
│   ├── Robin
│   ├── robin.js
│   └── robinInit.js


### Installing Node and npm
If you are entirely new to NodeJs, you may have to install NodeJS and npm first.
* Install Node.js on Ubuntu.
sudo apt-get install nodejs 

* Install npm (node package manager)
sudo su
curl https://npmjs.org/install.sh | sh


### Installing Robin
* To install Robin, installing the dependencies,
npm install 
from the robin root directory

### Configuration
Create the configuration file config.json.
Sample can be found at etc/config.sample.json.

{
  "cookie_name": "uniplaces", <-- The name of the cookie.->
  "expires": "2592000000", <-- expired after, in milliseconds.->
  "default_deployment": "www.uniplaces.com", <-- The default deployment.->
  "proxy_port": "8000", <-- Optional port for the proxy. Default, 80.->

  "deployments": [ <-- Can be more than two deployments. ->
  {
    "label": "A", <-- Label of the deployment->
    "weight": "600", <-- The sum of the weights should be 1000.-> 
    "host": "www.uniplaces.com",
    "port": "80"
  },
  <-- ... -->
  ]
}

### To run
From the robin root directory
./Robin

To be able to bind port 80 to the proxy
sudo setcap 'cap_net_bind_service=+ep' path_to_node
For example,
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node

Note: proxy_port is an optional parameter in config.json.
"proxy_port": "8000",
Default is, 80.
