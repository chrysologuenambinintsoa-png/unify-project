const handler = require('./pages/api/items/index').default;

// create fake req/res
const req = { method: 'POST', body: { title: 'foo', content: 'bar' } };
const res = {
  status(code) { this.code = code; return this; },
  json(obj) { console.log('response', this.code, obj); },
  setHeader() {},
  end(msg) { console.log('end', this.code, msg); }
};

handler(req, res).then(()=>console.log('done')).catch(e=>console.error('handler error',e));
