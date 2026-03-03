const prisma = require('./lib/prisma');
(async ()=>{
  try {
    const item = await prisma.item.create({ data: { title: 'test', content: 'foo' } });
    console.log('created item', item);
  } catch (e) {
    console.error('prisma error', e);
  } finally {
    await prisma.$disconnect();
  }
})();
