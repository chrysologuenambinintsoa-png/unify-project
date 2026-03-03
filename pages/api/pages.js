// Mock data for pages
const mockPages = [
  { id: 1, name: 'Tech News Daily', icon: '📰', followers: 45000, description: 'Actualités technologiques quotidiennes', followed: true },
  { id: 2, name: 'Web Design Tips', icon: '🎨', followers: 32000, description: 'Conseils en design web et UX', followed: true },
  { id: 3, name: 'Startup Hub', icon: '🚀', followers: 78000, description: 'Ressources pour entrepreneurs', followed: false },
  { id: 4, name: 'Code Masters', icon: '💻', followers: 56000, description: 'Tutoriels de programmation', followed: false },
  { id: 5, name: 'Digital Marketing Pro', icon: '📊', followers: 67000, description: 'Stratégies marketing digital', followed: false },
  { id: 6, name: 'Product Management', icon: '🎯', followers: 43000, description: 'Gestion de produits numériques', followed: false },
]

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Get all pages
    return res.status(200).json({ pages: mockPages })
  } 
  else if (req.method === 'POST') {
    // Follow page
    const { action, pageId } = req.body
    if (action === 'follow') {
      const page = mockPages.find(p => p.id === pageId)
      if (page) {
        page.followed = true
        page.followers++
      }
    }
    return res.status(200).json({ success: true })
  }
  else if (req.method === 'DELETE') {
    // Unfollow page
    const { pageId } = req.body
    const page = mockPages.find(p => p.id === pageId)
    if (page) {
      page.followed = false
      page.followers--
    }
    return res.status(200).json({ success: true })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
