var http = require('http')
, https = require('https')
, httpProxy = require('http-proxy')
, fs = require('fs')
, path = require('path')

var addresses = {
  'ayro.nz': {
    host: '127.0.0.1'
  , port: '3000'
  }
, 'webrec.ayro.nz': {
    host: '127.0.0.1'
  , port: '4000'
  }
}

var httpsOptions = Object.keys(addresses).map(name=>{
  if (!fs.statSync(path.join('/etc/letsencrypt/live', name, 'privkey.pem')) ||
    !fs.statSync(path.join('/etc/letsencrypt/live', name, 'cert.pem'))) { 
    throw new Error('Certs not found!');
  }
});
var httpsOptions = Object.keys(addresses).map(name=>{
  return {
    key: fs.readFileSync(path.join('/etc/letsencrypt/live', name, 'privkey.pem'))
  , cert: fs.readFileSync(path.join('/etc/letsencrypt/live', name, 'cert.pem'))
  }
});

var ssls = Object.keys(addresses).reduce((o, name)=>{
  o[name] = new httpProxy.createProxyServer({
    ssl: httpsOptions
  , target: addresses[name]
  });
  return o;
}, {});
var proxies = Object.keys(addresses).reduce((o,name)=>{
  o[name] = new httpProxy.createProxyServer({target: addresses[name]});
  return o;
}, {});

var server = http.createServer(function(req, res){
  if (!proxies.hasOwnProperty(req.headers.host)){
    console.log('Could not find:', req.headers.host);
    res.status(400).send('Bad Address');
    return;
  }
  proxies[req.headers.host].web(req, res);
});
var httpsServer = https.createServer(httpsOptions['webrec.ayro.nz'], function(req, res){
  if (!ssls.hasOwnProperty(req.headers.host)){
    console.log('Could not find:', req.headers.host);
    res.status(400).send('Bad Address');
    return;
  }
  ssls[req.headers.host].web(req, res);
}).listen(443);

server.on('upgrade', function (req, socket, head) {
  if (!proxies.hasOwnProperty(req.headers.host)){
    console.log('Upgrade: could not find:', req.headers.host);
    res.status(400).send('Bad Address');
    return;
  }
  proxies[req.headers.host].ws(req, socket, head);
});
httpsServer.on('upgrade', function (req, socket, head) {
  if (!ssls.hasOwnProperty(req.headers.host)){
    console.log('Upgrade: could not find:', req.headers.host);
    res.status(400).send('Bad Address');
    return;
  }
  ssls[req.headers.host].ws(req, socket, head);
});

console.log('Listening on port:',process.env.PORT || 8000);
console.log('SSL Listening on port:',443);
server.listen(process.env.PORT || 8000);


