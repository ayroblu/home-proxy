var http = require('http')
, httpProxy = require('http-proxy')

httpProxy.setMaxSockets(4096)

var home = new httpProxy.HttpProxy({
  target: {
    host: '127.0.0.1'
  , port: '3000'
  }
});

var webrec = new httpProxy.HttpProxy({
  target: {
    host: '127.0.0.1'
  , port: '4000'
  }
});

var server = http.createServer(function(req ,res){
  switch(req.headers.host){
    case 'ayro.nz':
      home.proxyRequest(req, res);
    break;
    case 'webrec.ayro.nz':
      webrec.proxyRequest(req, res);
    break;
  }
});

server.on('upgrade', function(req, socket, head){
  // Cases need only for servers that actually use websockets
  switch(req.headers.host){
    case 'ayro.nz':
      home.proxyWebSocketRequest(req, socket, head);
    break;
    case 'webrec.ayro.nz':
      webrec.proxyWebSocketRequest(req, socket, head);
    break;
  }
});

server.listen(80);
