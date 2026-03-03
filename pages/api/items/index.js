const prisma = require('../../../lib/prisma');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const items = await prisma.item.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(items);
  }

  if (req.method === 'POST') {
    try {
      const { title, content, image } = req.body;
      if (!title) return res.status(400).json({ error: 'title is required' });
      const item = await prisma.item.create({ data: { title, content: content || null, image: image || null } });
      return res.status(201).json(item);
    } catch(err) {
      console.error('items POST error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
