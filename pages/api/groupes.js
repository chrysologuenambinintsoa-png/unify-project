import prisma from '../../lib/prisma';

// Mock data used as fallback when the database is unreachable
const mockGroups = [
  { id: 1, name: 'Développeurs Web', members: 1234, description: 'Communauté de développeurs web', coverIcon: '💻', cover: 'linear-gradient(135deg, #667eea, #764ba2)', joined: true },
  { id: 2, name: 'Design Graphique', members: 856, description: 'Pour les designers et graphistes', coverIcon: '🎨', cover: 'linear-gradient(135deg, #f093fb, #f5576c)', joined: true },
  { id: 3, name: 'Entrepreneurs', members: 2341, description: 'Réseau d\'entrepreneurs et startups', coverIcon: '🚀', cover: 'linear-gradient(135deg, #0B3D91, #082B60)', joined: false },
  { id: 4, name: 'Marketing Digital', members: 1567, description: 'Stratégies et tendances marketing', coverIcon: '📊', cover: 'linear-gradient(135deg, #43e97b, #38f9d7)', joined: false },
  { id: 5, name: 'Freelancers', members: 3456, description: 'Groupe pour les freelancers', coverIcon: '💼', cover: 'linear-gradient(135deg, #fa709a, #fee140)', joined: false },
]

export default async function handler(req, res) {
  const userEmail = req.body?.userEmail || req.query?.userEmail || null;

  const formatGroup = (g) => {
    const group = {
      id: g.id,
      name: g.name,
      description: g.description,
      coverIcon: g.coverIcon || '👥',
      cover: g.cover || 'linear-gradient(135deg, #667eea, #764ba2)',
      members: g.members,
    };
    if (userEmail && g.membersList) {
      try {
        const arr = JSON.parse(g.membersList);
        group.joined = arr.includes(userEmail);
      } catch {};
    }
    return group;
  };

  try {
    if (req.method === 'GET') {
      // Get all groups from database
      const groups = await prisma.group.findMany();
      const formatted = groups.map(formatGroup);
      return res.status(200).json({ groupes: formatted });
    } 
    else if (req.method === 'POST') {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const created = await prisma.group.create({ data: { name, members: 1, membersList: userEmail ? JSON.stringify([userEmail]) : '' } });
      return res.status(201).json({ group: formatGroup(created) });
    }
    else if (req.method === 'PUT') {
      const { action, groupId } = req.body;
      if (action === 'join' && userEmail) {
        const g = await prisma.group.findUnique({ where: { id: Number(groupId) } });
        if (g) {
          const list = g.membersList ? JSON.parse(g.membersList) : [];
          if (!list.includes(userEmail)) {
            list.push(userEmail);
            await prisma.group.update({
              where: { id: Number(groupId) },
              data: { members: { increment: 1 }, membersList: JSON.stringify(list) }
            });
          }
        }
      }
      return res.status(200).json({ success: true });
    }
  } catch (err) {
    console.error('groupes API db error', err);
    // fallback to mock implementation
    if (req.method === 'GET') {
      return res.status(200).json({ groupes: mockGroups });
    } else if (req.method === 'POST') {
      const { name } = req.body;
      const newGroup = {
        id: Math.max(...mockGroups.map(g => g.id)) + 1,
        name,
        members: 1,
        description: 'Nouveau groupe',
        coverIcon: '👥',
        cover: 'linear-gradient(135deg, #667eea, #764ba2)',
        joined: true
      };
      mockGroups.push(newGroup);
      return res.status(201).json({ group: newGroup });
    } else if (req.method === 'PUT') {
      const { action, groupId } = req.body;
      if (action === 'join') {
        const group = mockGroups.find(g => g.id === groupId);
        if (group) {
          group.joined = true;
          group.members++;
        }
      }
      return res.status(200).json({ success: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
