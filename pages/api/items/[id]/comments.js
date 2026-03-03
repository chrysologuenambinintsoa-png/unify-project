const prisma = require('../../../../lib/prisma');

export default async function handler(req, res) {
  const { id } = req.query;
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'GET') {
    // include replies and likes
    const comments = await prisma.comment.findMany({
      where: { postId: parsedId },
      orderBy: { createdAt: 'asc' }
    });
    return res.json(comments);
  }

  if (req.method === 'POST') {
    const { author, text, parentId } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const data = { postId: parsedId, author: author || 'Anonymous', text };
    if (parentId) data.parentId = parentId;
    const comment = await prisma.comment.create({ data });
    return res.status(201).json(comment);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
