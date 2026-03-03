import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id: conversationId, messageId } = req.query
  const { method } = req

  if (method === 'PUT') {
    return handleMarkAsRead(messageId, req, res)
  } else if (method === 'DELETE') {
    return handleDeleteMessage(messageId, req, res)
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

async function handleMarkAsRead(messageId, req, res) {
  try {
    const message = await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return res.status(200).json(message)
  } catch (error) {
    console.error('Error marking message as read:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function handleDeleteMessage(messageId, req, res) {
  try {
    const message = await prisma.message.delete({
      where: { id: parseInt(messageId) }
    })

    return res.status(200).json({ message: 'Message deleted', message: message })
  } catch (error) {
    console.error('Error deleting message:', error)
    return res.status(500).json({ error: error.message })
  }
}
