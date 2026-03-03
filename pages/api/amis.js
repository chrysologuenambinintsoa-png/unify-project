import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  const { method } = req
  const { userEmail, friendId, action } = req.query

  try {
    if (method === 'GET') {
      // Get friends of a user
      if (!userEmail) return res.status(400).json({ error: 'userEmail required' })

      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          friendsOf: { include: { friend: true } },
          friendsWith: { include: { user: true } }
        }
      })

      if (!user) return res.status(404).json({ error: 'User not found' })

      const amis = [
        ...user.friendsOf.map(f => ({ 
          id: f.friend.id, 
          email: f.friend.email, 
          prenom: f.friend.prenom, 
          nom: f.friend.nom,
          nomUtilisateur: f.friend.nomUtilisateur 
        })),
        ...user.friendsWith.map(f => ({ 
          id: f.user.id, 
          email: f.user.email, 
          prenom: f.user.prenom, 
          nom: f.user.nom,
          nomUtilisateur: f.user.nomUtilisateur 
        }))
      ]

      return res.status(200).json({ amis, suggestions: [] })
    }

    if (method === 'POST') {
      if (!userEmail) return res.status(400).json({ error: 'userEmail required' })

      const user = await prisma.user.findUnique({ where: { email: userEmail } })
      if (!user) return res.status(404).json({ error: 'User not found' })

      if (action === 'add' && friendId) {
        const friendship = await prisma.friendship.create({
          data: {
            userId: user.id,
            friendId: parseInt(friendId)
          }
        })
        return res.status(201).json({ success: true, friendship })
      }

      if (action === 'remove' && friendId) {
        await prisma.friendship.deleteMany({
          where: {
            OR: [
              { userId: user.id, friendId: parseInt(friendId) },
              { userId: parseInt(friendId), friendId: user.id }
            ]
          }
        })
        return res.status(200).json({ success: true })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${method} Not Allowed`)
  } catch (err) {
    console.error('Friends API error', err)
    res.status(500).json({ error: err.message })
  }
}
