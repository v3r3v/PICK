const { getDefaultConfig } = require('expo/metro-config');
const http = require('node:http');
const config = getDefaultConfig(__dirname);
// Fixed local target only. Browser uses its own origin; native calls the separate API directly.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  if (!req.url?.startsWith('/pick-api/')) return middleware(req, res, next);
  const path = req.url.slice('/pick-api'.length);
  const pathname = new URL(path, 'http://localhost').pathname;
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (['/demo/reset','/demo/migrate'].includes(pathname) && !local) {
    res.writeHead(403, {'Content-Type':'application/json'});
    res.end(JSON.stringify({code:'LOCAL_ONLY',message:'Reset the shared demo from the computer running PICK.'})); return;
  }
  const upstream = http.request({hostname:'127.0.0.1',port:Number(process.env.PICK_API_PORT||4100),path,method:req.method,headers:{...req.headers,host:'127.0.0.1:4100'}}, response => {
    res.writeHead(response.statusCode || 502, response.headers); response.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(503, {'Content-Type':'application/json'});
    res.end(JSON.stringify({code:'API_UNAVAILABLE',message:'The local API response is unavailable. Check the receipt before repeating an action.'}));
  });
  req.pipe(upstream);
};
module.exports = config;
