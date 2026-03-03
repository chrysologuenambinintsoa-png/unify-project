import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  // simple user profile/settings endpoint
  const { method } = req
  const userEmail = req.query?.userEmail || req.body?.userEmail
  if (!userEmail) {
    return res.status(400).json({ error: 'userEmail required' })
  }

  try {
    if (method === 'GET') {
      const user = await prisma.user.findUnique({ where: { email: userEmail } })
      if (!user) return res.status(404).json({ error: 'User not found' })
      // exclude passwordHash
      const safe = {
        id: user.id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        nomUtilisateur: user.nomUtilisateur,
        phone: user.phone,
        dateNaissance: user.dateNaissance,
        genre: user.genre,
        avatar: user.avatar,
        settings: user.settings || {}
      }
      return res.status(200).json({ user: safe })
    } else if (method === 'PUT') {
      const updates = {}
      // allow updating general profile fields
      const profileFields = ['prenom', 'nom', 'nomUtilisateur', 'phone', 'dateNaissance', 'genre']
      profileFields.forEach(f => {
        if (req.body[f] !== undefined) {
          updates[f] = req.body[f]
        }
      })
      // settings may be provided as object
      if (req.body.settings !== undefined) {
        updates.settings = req.body.settings
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }
      const updated = await prisma.user.update({ where: { email: userEmail }, data: updates })
      const safe = {
        id: updated.id,
        email: updated.email,
        prenom: updated.prenom,
        nom: updated.nom,
        nomUtilisateur: updated.nomUtilisateur,
        phone: updated.phone,
        dateNaissance: updated.dateNaissance,
        genre: updated.genre,
        avatar: updated.avatar,
        settings: updated.settings || {}
      }
      return res.status(200).json({ user: safe })
    }
  } catch (err) {
    console.error('user API error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).json({ error: `Method ${method} Not Allowed` })
}
