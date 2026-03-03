import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id: conversationId } = req.query
  const { method } = req

  if (method === 'GET') {
    return handleGetConversation(conversationId, req, res)
  } else if (method === 'PUT') {
    return handleUpdateConversation(conversationId, req, res)
  } else if (method === 'DELETE') {
    return handleDeleteConversation(conversationId, req, res)
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

async function handleGetConversation(conversationId, req, res) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    return res.status(200).json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function handleUpdateConversation(conversationId, req, res) {
  try {
    const { title, avatar } = req.body

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(title && { title }),
        ...(avatar && { avatar })
      }
    })

    return res.status(200).json(conversation)
  } catch (error) {
    console.error('Error updating conversation:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function handleDeleteConversation(conversationId, req, res) {
  try {
    await prisma.message.deleteMany({
      where: { conversationId }
    })

    const conversation = await prisma.conversation.delete({
      where: { id: conversationId }
    })

    return res.status(200).json({ message: 'Conversation deleted', conversation })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return res.status(500).json({ error: error.message })
  }
}
