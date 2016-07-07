var fs = require('fs')
, tls = require('tls')
, http = require('http')
, https = require('https')
, httpProxy = require('http-proxy')
, url = require('url')
, finalhandler = require('finalhandler')
, serveStatic = require('serve-static')
 
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

var serve = serveStatic('public')
var redir = http.createServer(function(req, res){
  if (req.url.indexOf('.well-known') > -1) {
    serve(req, res, finalhandler(req, res));
    return;
  }
  res.writeHead(302, {
    'Location': 'https://'+req.headers.host+req.url
  });
  res.end();
});
redir.listen(80);

var server = https.createServer(httpsOptions, function(req, res){
  var hostname = url.parse('https://'+req.headers.host).hostname;
  if (Object.keys(addresses).indexOf(hostname) > -1){
    proxies[hostname].web(req, res);
    return;
  }
});
server.listen(443);



