// API for message actions in test mode: react, reply, forward
// Operates on global.testConversations only; in a real app persist in DB

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { action, conversationId, messageId, payload } = req.body

    if (!global.testConversations) {
      return res.status(400).json({ error: 'No test conversations available' })
    }

    const conv = global.testConversations.find(c => c.id === conversationId)
    if (!conv) return res.status(404).json({ error: 'Conversation not found' })

    const msgIndex = conv.messages.findIndex(m => String(m.id) === String(messageId))
    const message = msgIndex !== -1 ? conv.messages[msgIndex] : null

    if (action === 'react') {
      if (!message) return res.status(404).json({ error: 'Message not found' })
      const { emoji, userEmail } = payload || {}
      if (!emoji || !userEmail) return res.status(400).json({ error: 'emoji and userEmail required' })

      message.reactions = message.reactions || []
      const r = message.reactions.find(r => r.emoji === emoji)
      if (!r) {
        message.reactions.push({ emoji, by: [userEmail] })
      } else {
        const idx = r.by.indexOf(userEmail)
        if (idx === -1) r.by.push(userEmail)
        else r.by.splice(idx, 1)
        if (r.by.length === 0) message.reactions = message.reactions.filter(x => x.emoji !== emoji)
      }

      return res.status(200).json({ message, conversation: conv })
    }

    if (action === 'delete') {
      if (!message) return res.status(404).json({ error: 'Message not found' })
      conv.messages = conv.messages.filter(m => String(m.id) !== String(messageId))
      conv.updatedAt = new Date()
      return res.status(200).json({ conversation: conv })
    }

    if (action === 'reply') {
      const { senderEmail, senderName, text } = payload || {}
      if (!senderEmail || !senderName || !text) return res.status(400).json({ error: 'sender and text required' })

      const newMsg = {
        id: `msg_${Math.random().toString(36).substr(2,9)}`,
        conversationId,
        senderEmail,
        senderName,
        type: 'text',
        text,
        replyTo: message ? { id: message.id, text: message.text, senderName: message.senderName } : null,
        attachments: null,
        isRead: false,
        readAt: null,
        createdAt: new Date()
      }
      conv.messages.push(newMsg)
      conv.updatedAt = new Date()
      return res.status(201).json({ message: newMsg, conversation: conv })
    }

    if (action === 'forward') {
      const { targetConversationId, senderEmail, senderName } = payload || {}
      if (!targetConversationId || !senderEmail || !senderName) return res.status(400).json({ error: 'targetConversationId and sender required' })
      const target = global.testConversations.find(c => c.id === targetConversationId)
      if (!target) return res.status(404).json({ error: 'Target conversation not found' })

      const forwarded = {
        id: `msg_${Math.random().toString(36).substr(2,9)}`,
        conversationId: targetConversationId,
        senderEmail,
        senderName,
        type: message?.type || 'text',
        text: message?.text || null,
        attachments: message?.attachments || null,
        forwardedFrom: { conversationId, messageId: messageId },
        isRead: false,
        createdAt: new Date()
      }
      target.messages.push(forwarded)
      target.updatedAt = new Date()
      return res.status(201).json({ forwarded, target })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (error) {
    console.error('Action handler error:', error)
    return res.status(500).json({ error: error.message })
  }
}
