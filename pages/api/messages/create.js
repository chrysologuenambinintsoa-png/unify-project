import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { method } = req

  if (method === 'POST') {
    return handleCreateConversation(req, res)
  } else {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

async function handleCreateConversation(req, res) {
  try {
    const { participants, title } = req.body

    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({
        error: 'participants must be an array with at least 2 emails'
      })
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findMany({
      where: {
        participants: {
          contains: JSON.stringify(participants)
        }
      }
    })

    if (existingConversation.length > 0) {
      return res.status(200).json(existingConversation[0])
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: JSON.stringify(participants),
        title: title || null
      }
    })

    return res.status(201).json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return res.status(500).json({ error: error.message })
  }
}
