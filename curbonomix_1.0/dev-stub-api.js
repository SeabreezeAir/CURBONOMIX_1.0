const http = require('http');

function readBody(req) {
  return new Promise((res, rej) => {
    let data = '';
    req.on('data', (c) => data += c.toString());
    req.on('end', () => res(data));
    req.on('error', rej);
  });
}

const sampleGeo = {
  vertices: [[0,0,0],[96,0,0],[96,55,0],[0,55,0],[48,0,20],[144,0,20],[144,55,20],[48,55,20]],
  faces: [[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4]]
};

const samplePerf = { cfm_s: 1200, cfm_r: 900, dp_inwc: 0.08, vel_sup_fpm: 1200, vel_ret_fpm: 900 };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'OPTIONS') { res.writeHead(204, corsHeaders()); res.end(); return; }
    if (url.pathname === '/rtu/preview' && req.method === 'POST') {
      await readBody(req);
      res.writeHead(200, {...corsHeaders(),'Content-Type':'application/json'});
      res.end(JSON.stringify({ perf: samplePerf, geo: sampleGeo }));
      return;
    }
    if (url.pathname === '/rtu/design' && req.method === 'POST') {
      await readBody(req);
      res.writeHead(200, {...corsHeaders(),'Content-Type':'application/json'});
      res.end(JSON.stringify({ ok: true, data: { perf: samplePerf, geo: sampleGeo } }));
      return;
    }
    if (url.pathname === '/rtu/dxf' && req.method === 'POST') {
      await readBody(req);
      const txt = '0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n';
      res.writeHead(200, {...corsHeaders(),'Content-Type':'application/dxf','Content-Disposition':'attachment; filename=curbonomix.dxf'});
      res.end(txt);
      return;
    }
    if (url.pathname === '/rtu/gcode' && req.method === 'POST') {
      await readBody(req);
      const txt = '(GCODE)\nG21\nG90\nM30\n';
      res.writeHead(200, {...corsHeaders(),'Content-Type':'text/plain','Content-Disposition':'attachment; filename=curbonomix_gmetric.txt'});
      res.end(txt);
      return;
    }
    if (url.pathname === '/rtu/submittal' && req.method === 'POST') {
      await readBody(req);
      const txt = 'CURBONOMIX SUBMITTAL\nModel: SAMPLE\n';
      res.writeHead(200, {...corsHeaders(),'Content-Type':'text/plain','Content-Disposition':'attachment; filename=submittal.txt'});
      res.end(txt);
      return;
    }

    // health
    if (url.pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, {...corsHeaders(),'Content-Type':'application/json'});
      res.end(JSON.stringify({ status: 'up' }));
      return;
    }

    res.writeHead(404, {...corsHeaders(),'Content-Type':'text/plain'});
    res.end('not found');
  } catch (e) {
    res.writeHead(500, {...corsHeaders(),'Content-Type':'text/plain'});
    res.end('server error');
  }
});

function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type' }; }

const port = process.env.PORT || 4011;
server.listen(port, '127.0.0.1', () => console.log('Stub API listening on', port));
