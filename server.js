var http = require('http')
, httpProxy = require('http-proxy')

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
server.on('upgrade', function (req, socket, head) {
  if (!proxies.hasOwnProperty(req.headers.host)){
    console.log('Upgrade: could not find:', req.headers.host);
    res.status(400).send('Bad Address');
    return;
  }
  proxies[req.headers.host].ws(req, socket, head);
});

console.log('Listening on port:',process.env.PORT || 8000);
server.listen(process.env.PORT || 8000);


