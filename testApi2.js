(async ()=>{
  const mod = await import('./pages/api/items/index.js');
  const handler = mod.default;
  const req = { method: 'POST', body: { title: 'foo', content: 'bar' } };
  const res = {
    status(code) { this.code = code; return this; },
    json(obj) { console.log('response', this.code, obj); },
    setHeader() {},
    end(msg) { console.log('end', this.code, msg); }
  };
  try {
    await handler(req, res);
  } catch(e) {
    console.error('handler error', e);
  }
})();
