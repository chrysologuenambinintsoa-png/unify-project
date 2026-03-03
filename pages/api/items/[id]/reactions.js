const prisma = require('../../../../lib/prisma');

export default async function handler(req, res) {
  const { id } = req.query;
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'POST') {
    try {
      const { action } = req.body;
      if (!action) return res.status(400).json({ error: 'action is required' });
      if (action === 'like') {
        const updated = await prisma.item.update({ where: { id: parsedId }, data: { likes: { increment: 1 } } });
        return res.json({ likes: updated.likes });
      }
      if (action === 'unlike') {
        const updated = await prisma.item.update({ where: { id: parsedId }, data: { likes: Math.max(0, (await prisma.item.findUnique({ where: { id: parsedId } })).likes - 1) } });
        return res.json({ likes: updated.likes });
      }
      return res.status(400).json({ error: 'unknown action' });
    } catch (e) {
      console.error('reactions POST error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
