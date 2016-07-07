var fs = require('fs')
, tls = require('tls')
, https = require('https')
, httpProxy = require('http-proxy')
, url = require('url')

var certs = {
  "webrec.ayro.nz": {
    key: fs.readFileSync('/etc/letsencrypt/live/webrec.ayro.nz/privkey.pem')
  , cert: fs.readFileSync('/etc/letsencrypt/live/webrec.ayro.nz/fullchain.pem')
  , ca: fs.readFileSync('/etc/letsencrypt/live/webrec.ayro.nz/chain.pem')
  }
, "ayro.nz": {
    key: fs.readFileSync('/etc/letsencrypt/live/ayro.nz/privkey.pem')
  , cert: fs.readFileSync('/etc/letsencrypt/live/ayro.nz/fullchain.pem')
  , ca: fs.readFileSync('/etc/letsencrypt/live/ayro.nz/chain.pem')
  }
}

var addresses = {
  'ayro.nz': {
    host: 'localhost'
  , port: '3000'
  }
, 'webrec.ayro.nz': {
    host: 'localhost'
  , port: '4000'
  }
}
var ssls = Object.keys(certs).reduce((o, name)=>{
  o[name] = new httpProxy.createProxyServer({
    ssl: certs[name]
  , target: addresses[name]
  });
  return o;
}, {});

var proxies = Object.keys(addresses).reduce((o,name)=>{
  o[name] = new httpProxy.createProxyServer({target: addresses[name]});
  return o;
}, {});

var httpsOptions = {
  SNICallback: function(hostname, cb) {
    var ctx = tls.createSecureContext(certs[hostname])
    cb(null, ctx)
  }
, key: fs.readFileSync('/etc/letsencrypt/live/ayro.nz/privkey.pem')
, cert: fs.readFileSync('/etc/letsencrypt/live/ayro.nz/fullchain.pem')
, ca: fs.readFileSync('/etc/letsencrypt/live/ayro.nz/chain.pem')
}

var server = https.createServer(httpsOptions, function(req, res){
  console.log('hostname',url.parse('https://'+req.headers.host).hostname);
  console.log(Object.keys(addresses), 'Index: ',Object.keys(addresses).indexOf(url.parse('https://'+req.headers.host).hostname) > -1);
  var hostname = url.parse('https://'+req.headers.host).hostname;
  if (Object.keys(addresses).indexOf(hostname) > -1){
    proxies[hostname].web(req, res);
    return;
  }
});
server.listen(443);



