// Mock data for notifications
const mockNotifications = [
  { id: 1, avatar: '👤', userName: 'Marie Dupont', action: 'a aimé', content: 'votre publication', time: 'il y a 5 min', read: false, type: 'like', url: '/posts/1' },
  { id: 2, avatar: '👨', userName: 'Pierre Martin', action: 'a commenté', content: 'Génial comme publication!', time: 'il y a 15 min', read: false, type: 'comment', url: '/posts/2' },
  { id: 3, avatar: '👩', userName: 'Sophie Bernard', action: 'a partagé', content: 'votre photo', time: 'il y a 1h', read: true, type: 'share', url: '/posts/3' },
  { id: 4, avatar: '👤', userName: 'Luc Henry', action: 'vous a envoyé', content: 'une demande d\'amitié', time: 'il y a 2h', read: true, type: 'friend', url: '/amis' },
  { id: 5, avatar: '💬', userName: 'Jean Dupont', action: 'vous a envoyé un message', content: 'Cliquez pour ouvrir', time: 'il y a 3h', read: true, type: 'message', url: '/messages' },
]

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Get all notifications
    return res.status(200).json({ notifications: mockNotifications })
  } 
  else if (req.method === 'PUT') {
    // Mark notification as read
    const { id, read, all } = req.body
    if (all) {
      mockNotifications.forEach(n => n.read = true)
    } else {
      const notif = mockNotifications.find(n => n.id === id)
      if (notif) notif.read = !!read
    }
    return res.status(200).json({ success: true })
  } 
  else if (req.method === 'DELETE') {
    // Delete notification
    const { id } = req.body
    const index = mockNotifications.findIndex(n => n.id === id)
    if (index > -1) mockNotifications.splice(index, 1)
    return res.status(200).json({ success: true })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
