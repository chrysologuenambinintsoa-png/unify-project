// Stockage global en mémoire pour les données de test (persiste pendant la session du serveur)
// Note: En production, utiliser une vraie base de données avec Prisma
global.testConversations = global.testConversations || []

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userEmail, userName } = req.body

    if (!userEmail || !userName) {
      return res.status(400).json({ error: 'userEmail and userName are required' })
    }

    // Utilisateurs de test
    const testUsers = [
      { email: 'alice@example.com', name: 'Alice Alice' },
      { email: 'bob@example.com', name: 'Bob Bob' },
      { email: 'charlie@example.com', name: 'Charlie Charlie' },
      { email: 'diana@example.com', name: 'Diana Diana' }
    ]

    // Récupérer les autres utilisateurs
    const otherUsers = testUsers.filter(u => u.email !== userEmail)

    // Créer les conversations avec messages
    for (const otherUser of otherUsers) {
      const participants = [userEmail, otherUser.email].sort()
      const conversationId = `conv_${participants[0]}_${participants[1]}`
      
      // Vérifier si la conversation existe déjà
      const existingConv = global.testConversations.find(c => c.id === conversationId)
      
      if (!existingConv) {
        // Créer la nouvelle conversation
        const newConversation = {
          id: conversationId,
          participants: JSON.stringify(participants),
          title: `Chat avec ${otherUser.name}`,
          avatar: otherUser.name[0].toUpperCase(),
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [
            {
              id: `msg_${Math.random().toString(36).substr(2, 9)}`,
              conversationId: conversationId,
              senderEmail: otherUser.email,
              senderName: otherUser.name,
              type: 'text',
              text: 'Salut! 👋',
              attachments: null,
              isRead: false,
              readAt: null,
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
            },
            {
              id: `msg_${Math.random().toString(36).substr(2, 9)}`,
              conversationId: conversationId,
              senderEmail: userEmail,
              senderName: userName,
              text: 'Salut! Comment ça va?',
              isRead: true,
              readAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
            },
            {
              id: `msg_${Math.random().toString(36).substr(2, 9)}`,
              conversationId: conversationId,
              senderEmail: otherUser.email,
              senderName: otherUser.name,
              type: 'media',
              text: null,
              attachments: { type: 'image', url: 'https://via.placeholder.com/300', name: 'image.jpg' },
              isRead: true,
              readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
              id: `msg_${Math.random().toString(36).substr(2, 9)}`,
              conversationId: conversationId,
              senderEmail: userEmail,
              senderName: userName,
              text: "C'est cool! Les modales de chat fonctionnent parfaitement",
              isRead: true,
              readAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
            },
            {
              id: `msg_${Math.random().toString(36).substr(2, 9)}`,
              conversationId: conversationId,
              senderEmail: otherUser.email,
              senderName: otherUser.name,
              type: 'file',
              text: null,
              attachments: { type: 'document', url: 'https://example.com/sample.pdf', name: 'sample.pdf' },
              isRead: true,
              readAt: new Date(Date.now() - 50 * 60 * 1000),
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
            },
            {
              id: `msg_${Math.random().toString(36).substr(2, 9)}`,
              conversationId: conversationId,
              senderEmail: userEmail,
              senderName: userName,
              text: 'À plus tard!',
              isRead: true,
              readAt: new Date(Date.now() - 30 * 60 * 1000),
              createdAt: new Date(Date.now() - 30 * 60 * 1000)
            }
          ]
        }
        
        global.testConversations.push(newConversation)
      }
    }

    return res.status(200).json({
      success: true,
      message: `Données de test initialisées avec succès pour ${userEmail}`,
      conversationsCreated: otherUsers.length,
      testConversations: global.testConversations
    })
  } catch (error) {
    console.error('Error initializing test data:', error)
    return res.status(500).json({ error: error.message })
  }
}
