Robin
=====

### UniPlaces Proxy ###

### Features
* Proxies the deployments for A/B Testing.
* Based on the weight function, directs the traffic to the deployments.
* Uses cookies to facilitate stickiness, such that the same deployment
will be used to serve the same user till the cookie expires.
* Logs the accesses to a log file or console based on the parameters given to Robin.


### Directory Structure
├── robin
│   ├── etc
│   │   └── config.sample.json
│   ├── LICENSE
│   ├── package.json
│   ├── README.md
│   ├── Robin
│   ├── robinInit.js
│   ├── robin.js
│   ├── robin.log
│   ├── robinWinstonConsole.js
│   └── robinWinston.js

### Installing Node and npm
If you are entirely new to NodeJs, you may have to install NodeJS and npm first.
* Install Node.js on Ubuntu.
$ sudo apt-get install nodejs 

* Install npm (node package manager)
sudo su
$ curl https://npmjs.org/install.sh | sh


### Installing Robin
* To install Robin, installing the dependencies,
$ npm install 
from the robin root directory

### Configuration
Create the configuration file config.json.
Sample can be found at etc/config.sample.json.

{
  "cookie_name": "uniplaces", <-- The name of the cookie.->
  "expires": "2592000000", <-- expired after, in milliseconds.->
  "default_deployment": { 
      "host": "www.uniplaces.com", <-- The default deployment.->
      "port": "80" <-- optional. Default, 80.->
  },
  "proxy_port": "8000", <-- Optional port for the proxy. Default, 80.->
  "max_weight": "1000", <-- Optional. Default, 1000.->

  "deployments": {
      "A": { <-- Label of the deployment. Also the cookie value. A string value.->
        "host": "www.uniplaces.com",
        "port": "80", "80", <-- optional. Default, 80.->
        "weight": "600"
      },    
      "B": {
        "host": "www.uniplaces.pt",
        "port": "80",
        "weight": "400"
      }  
    }
}

### To run
From the robin root directory
$ ./Robin

### Setting the proxy_port
proxy_port is an optional parameter in config.json. Default is, 80.

Ports < 1024 are privileged and cannot be bound to a non-root process.
To be able to bind port 80 or anyother privileged ports to Robin,
$ sudo setcap 'cap_net_bind_service=+ep' path_to_node
For example,
$ sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/node
