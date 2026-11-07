import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const port = Number(process.env.PORT || 8787);
const server = createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, {'content-type':'application/json','access-control-allow-origin':'*'});
    res.end(JSON.stringify({ok:true, service:'ReproductorJAz realtime', version:'0.3.0'}));
    return;
  }
  res.writeHead(404, {'content-type':'application/json'});
  res.end(JSON.stringify({error:'not found'}));
});
const wss = new WebSocketServer({server, path:'/ws', maxPayload:4096});
const publish = data => {
  const serialized = JSON.stringify(data);
  for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(serialized);
};
wss.on('connection', socket => {
  socket.send(JSON.stringify({type:'hello', serverTime:Date.now()}));
  socket.on('message', raw => {
    let packet;
    try {packet=JSON.parse(raw.toString());} catch {socket.send(JSON.stringify({type:'error',message:'invalid json'}));return;}
    if (packet.type === 'ping' && Number.isFinite(packet.clientTime)) {
      socket.send(JSON.stringify({type:'pong',clientTime:packet.clientTime,serverTime:Date.now()}));
    } else if (packet.type === 'telemetry') {
      // Never relay audio samples, file contents, or arbitrary user-controlled payloads.
      const {state, peak, underruns} = packet;
      if (typeof state !== 'string' || !['playing','paused','ready','ended'].includes(state)) return;
      publish({type:'telemetry',state,peak:Number.isFinite(peak)?Math.max(0,Math.min(1,peak)):0,underruns:Number.isSafeInteger(underruns)?Math.max(0,underruns):0,time:Date.now()});
    }
  });
});
server.listen(port, '127.0.0.1', () => console.log(`ReproductorJAz API http://127.0.0.1:${port}`));
