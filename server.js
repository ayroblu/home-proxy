const fs = require('fs')
const tls = require('tls')
const http = require('http')
const https = require('https')
const httpProxy = require('http-proxy')
const url = require('url')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const _ = require('lodash')

const sites = require('./sites')

function convertLetsEncrypt(key, entry){
  const letsEncryptDir = '/etc/letsencrypt/live/'
  return {
    cert: {
      key: fs.readFileSync(letsEncryptDir + key + '/privkey.pem')
    , cert: fs.readFileSync(letsEncryptDir + key + '/fullchain.pem')
    , ca: fs.readFileSync(letsEncryptDir + key + '/chain.pem')
    }
  , address: _.pick(entry, ['host', 'port'])
  }
}
function convertElse(key, entry){
  return {
    cert: entry.cert
  , address: _.pick(entry, ['host', 'port'])
  }
}

const { certs, addresses } = Object.keys(sites).reduce((a, n)=>{
  const { cert, address } = sites[n].type === 'letsencrypt' ? convertLetsEncrypt(n, sites[n]) : convertElse(n, sites[n])
  a.certs[n] = cert
  a.addresses[n] = address
  return a
}, {certs: {}, addresses: {}})

const serve = serveStatic('public')
const redir = http.createServer(function(req, res){
  if (req.url.indexOf('.well-known') > -1) {
    serve(req, res, finalhandler(req, res))
    return
  }
  res.writeHead(302, {
    'Location': 'https://'+req.headers.host+req.url
  })
  res.end()
})
 
const proxies = Object.keys(addresses).reduce((o,name)=>{
  o[name] = new httpProxy.createProxyServer({target: addresses[name]})
  return o
}, {})

const httpsOptions = Object.assign({
  SNICallback(hostname, cb) {
    const ctx = tls.createSecureContext(certs[hostname])
    cb(null, ctx)
  }
  // Default, probably unnecessary, but as a fallback
}, certs[Object.keys(certs)[0]])

const server = https.createServer(httpsOptions, function(req, res){
  const hostname = url.parse('https://'+req.headers.host).hostname
  if (Object.keys(addresses).indexOf(hostname) > -1){
    proxies[hostname].web(req, res)
    return
  }
})

redir.listen(80)
server.listen(443)

