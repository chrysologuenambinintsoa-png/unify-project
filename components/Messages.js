import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { ContactSkeleton, MessageSkeleton } from './Skeleton'

export default function Messages({ user }) {
  const router = useRouter()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newParticipant, setNewParticipant] = useState('')
  const [participants, setParticipants] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const messagesEndRef = useRef(null)

  const userEmail = user?.email || 'user@example.com'
  const userName = user ? `${user.prenom} ${user.nom}` : 'User'

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages])

  async function fetchConversations() {
    try {
      const res = await fetch(`/api/messages?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
      setLoading(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if ((!newMessage.trim() && !attachment) || !activeConversation) return

    try {
      const attach = attachment ? { name: attachment.name, type: attachment.type.startsWith('image/') ? 'media' : 'file', url: attachment.dataUrl } : null

      const payload = {
        conversationId: activeConversation.id,
        senderEmail: userEmail,
        senderName: userName,
        text: newMessage || null,
        attachments: attach,
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName } : null
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setNewMessage('')
        setAttachment(null)
        setReplyTo(null)
        await fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setAttachment({ name: file.name, type: file.type, dataUrl })
    }
    reader.readAsDataURL(file)
  }

  function handleReact(message) {
    const emoji = prompt('Entrez l\'emoji pour réagir (ex: ❤️, 👍)')
    if (!emoji) return
    fetch('/api/messages/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'react', conversationId: activeConversation.id, messageId: message.id, payload: { emoji, userEmail } })
    }).then(() => fetchConversations())
  }

  function handleReply(message) {
    setReplyTo({ id: message.id, text: message.text, senderName: message.senderName })
    const el = document.querySelector('[name="messageInput"]')
    el?.focus()
  }

  async function handleForward(message) {
    const targetId = prompt('Entrez l\'id de la conversation cible (ex: conv_...)')
    if (!targetId) return
    await fetch('/api/messages/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'forward', conversationId: activeConversation.id, messageId: message.id, payload: { targetConversationId: targetId, senderEmail: userEmail, senderName: userName } })
    })
    await fetchConversations()
  }

  async function createConversation(e) {
    e.preventDefault()
    if (!newParticipant.trim() || !participants.length) return

    try {
      const allParticipants = [userEmail, ...participants]
      const res = await fetch('/api/messages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: allParticipants,
          title: null
        })
      })

      if (res.ok) {
        const newConv = await res.json()
        setShowNewConversation(false)
        setNewParticipant('')
        setParticipants([])
        await fetchConversations()
        setActiveConversation(newConv)
        setShowChatModal(true)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  async function deleteMessage(messageId) {
    try {
      const res = await fetch(`/api/messages/${activeConversation.id}/${messageId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchConversations()
        return
      }
    } catch (error) {
      console.warn('API delete failed, trying in-memory fallback')
    }

    // Fallback: remove from global.testConversations if present
    try {
      if (globalThis && globalThis.window) {
        // cannot modify server-side global from client; try calling test-actions to delete
      }
      // Try test API to remove message
      await fetch('/api/messages/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', conversationId: activeConversation.id, messageId })
      })
      await fetchConversations()
    } catch (err) {
      console.error('Error deleting message (fallback):', err)
    }
  }

  async function deleteConversation(convId) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return

    try {
      const res = await fetch(`/api/messages/${convId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setActiveConversation(null)
        setShowChatModal(false)
        await fetchConversations()
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  // helper used when sidebar link or query param requests a chat with someone
  async function createConvFor(contactEmail, contactName) {
    if (!contactEmail) return
    try {
      const res = await fetch('/api/messages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: [userEmail, contactEmail], title: contactName || null })
      })
      if (res.ok) {
        const newConv = await res.json()
        setConversations(prev => [...prev, newConv])
        setActiveConversation(newConv)
        setShowChatModal(true)
        // also update URL to reflect newly opened chat
        const other = newConv.participants?.find(p => p !== userEmail)
        if(other){
          router.push(`/messages?contact=${encodeURIComponent(other)}&name=${encodeURIComponent(contactName||'')}`, undefined, { shallow: true })
        }
      }
    } catch (err) {
      console.error('Error creating conversation from sidebar', err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const activeConv = activeConversation
    ? conversations.find(c => c.id === activeConversation.id)
    : null

  // if we were navigated here with a contact query param, open chat when conversations load
  useEffect(() => {
    const { contact, name } = router.query
    if (contact && conversations.length > 0) {
      let conv = conversations.find(c => c.participants?.includes(contact))
      if (conv) {
        setActiveConversation(conv)
        setShowChatModal(true)
      } else {
        // no existing conversation, create one automatically
        createConvFor(contact, name)
      }
    }
  }, [router.query.contact, conversations])

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleConversationClick = (conv) => {
    setLoadingMessages(true);
    setActiveConversation(conv)
    setShowChatModal(true)
    // update query so sidebar stays in sync
    const other = conv.participants?.find(p => p !== userEmail)
    const name = conv.title || ''
    if(other){
      router.push(`/messages?contact=${encodeURIComponent(other)}&name=${encodeURIComponent(name)}`, undefined, { shallow: true })
    }
    // simulate loading time (or could fetch messages separately)
    setTimeout(() => setLoadingMessages(false), 250);
  }

  const closeChatModal = () => {
    setShowChatModal(false)
    // remove query parameters when closing
    router.push('/messages', undefined, { shallow: true })
  }

  return (
    <div style={styles.pageContainer}>
      {/* Conversations List */}
      <div style={styles.conversationsList}>
        <div style={styles.header}>
          <h2 style={styles.title}>Messages</h2>
          <button
            onClick={() => setShowNewConversation(!showNewConversation)}
            style={styles.newConvButton}
            title="Nouvelle conversation"
          >
            ✏️
          </button>
        </div>

        {showNewConversation && (
          <form onSubmit={createConversation} style={styles.newConvForm}>
            <input
              type="email"
              placeholder="Email du contact"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              style={styles.input}
            />
            <div style={styles.participantsList}>
              {participants.map((p, idx) => (
                <div key={idx} style={styles.participantTag}>
                  {p}
                  <button
                    type="button"
                    onClick={() => setParticipants(participants.filter((_, i) => i !== idx))}
                    style={styles.removeTag}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => {
              if (newParticipant.trim()) {
                setParticipants([...participants, newParticipant])
                setNewParticipant('')
              }
            }} style={styles.addButton}>
              Ajouter
            </button>
            <button type="submit" style={styles.createButton}>
              Créer
            </button>
            <button type="button" onClick={() => {
              setShowNewConversation(false)
              setNewParticipant('')
              setParticipants([])
            }} style={styles.cancelButton}>
              Annuler
            </button>
          </form>
        )}

        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.conversationsScroll}>
          {loading ? (
            // show skeletons instead of plain text
            Array.from({length:5}).map((_,i)=><ContactSkeleton key={i} />)
          ) : filteredConversations.length === 0 ? (
            <div style={styles.emptyState}>Aucune conversation</div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleConversationClick(conv)}
                style={{
                  ...styles.conversationItem,
                  background: activeConv?.id === conv.id ? '#E7F3FF' : 'transparent'
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  deleteConversation(conv.id)
                }}
              >
                <div style={styles.conversationAvatar}>
                  {conv.avatar ? (
                    <div style={styles.avatarCircle}>{conv.avatar}</div>
                  ) : (
                    <div style={styles.avatarCircle}>{(conv.participants?.find(p => p !== userEmail) || '👤')[0]?.toUpperCase()}</div>
                  )}
                </div>
                <div style={styles.conversationInfo}>
                  <div style={styles.conversationName}>{conv.title}</div>
                  <div style={styles.conversationPreview}>
                    {conv.lastMessageSender && <strong>{conv.lastMessageSender}: </strong>}
                    {conv.lastMessage}
                  </div>
                  <div style={styles.conversationTime}>
                    {new Date(conv.lastMessageTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <div style={styles.unreadBadge}>{conv.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && activeConv && (
        <div style={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeChatModal()
        }}>
          <div style={styles.modalContent}>
            <div style={styles.chatHeader}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={styles.headerAvatar}>{activeConv.avatar || (activeConv.participants?.find(p => p !== userEmail) || '?')[0]?.toUpperCase()}</div>
                <div>
                  <div style={styles.chatHeaderTitle}>{activeConv.title}</div>
                  <div style={{fontSize:12,color:'#666'}}>{(activeConv.participants?.find(p => p !== userEmail)) || ''}</div>
                </div>
              </div>
              <button
                onClick={closeChatModal}
                style={styles.closeButton}
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div style={styles.messagesContainer}>
              {loadingMessages ? (
                Array.from({length:5}).map((_,i)=><MessageSkeleton key={i} />)
              ) : activeConv.messages?.length === 0 ? (
                <div style={styles.emptyMessages}>Aucun message. Commencez la conversation!</div>
              ) : (
                activeConv.messages?.map(msg => {
                  const isMine = msg.senderEmail === userEmail
                  return (
                    <div
                      key={msg.id}
                      style={{
                        ...styles.messageWrapper,
                        justifyContent: isMine ? 'flex-end' : 'flex-start'
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        if (msg.senderEmail === userEmail) {
                          deleteMessage(msg.id)
                        }
                      }}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          background: isMine ? '#0B3D91' : '#E4E6EB',
                          color: isMine ? 'white' : '#000',
                          position: 'relative'
                        }}
                      >
                        {!isMine && (
                          <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>{msg.senderName}</div>
                        )}
                        {/* Quoted reply */}
                        {msg.replyTo && (
                          <div style={{padding:8,background:isMine?'rgba(255,255,255,0.06)':'#F3F4F6',borderRadius:8,marginBottom:6,fontSize:13}}>
                            <strong style={{fontSize:12}}>{msg.replyTo.senderName}: </strong>
                            <span style={{color:'#444'}}>{msg.replyTo.text}</span>
                          </div>
                        )}
                        {msg.type === 'media' && (msg.attachments?.url || msg.attachments?.dataUrl) ? (
                          <img src={msg.attachments?.url || msg.attachments?.dataUrl} alt={msg.attachments?.name || 'media'} style={{maxWidth:300,borderRadius:8}} />
                        ) : msg.type === 'file' || msg.type === 'document' ? (
                          <a href={msg.attachments?.url || msg.attachments?.dataUrl} target="_blank" rel="noreferrer" style={{display:'inline-block',padding:8,background:isMine?'rgba(255,255,255,0.06)':'#fff',borderRadius:8,color:isMine?'white':'#0A2342',textDecoration:'none'}}>
                            📎 {msg.attachments?.name || 'Fichier'}
                          </a>
                        ) : (
                          <div style={styles.messageText}>{msg.text}</div>
                        )}

                        <div style={{
                          ...styles.messageTime,
                          color: isMine ? 'rgba(255,255,255,0.7)' : '#65676B'
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {msg.isRead && msg.senderEmail === userEmail && ' ✓✓'}
                        </div>

                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div style={{display:'flex',gap:6,marginTop:6}}>
                            {msg.reactions.map(r => (
                              <div key={r.emoji} style={{padding:'2px 6px',background:'#fff',borderRadius:12,fontSize:12}}>{r.emoji} {r.by?.length || 0}</div>
                            ))}
                          </div>
                        )}

                        {/* Actions toolbar */}
                        <div style={{position:'absolute',top:-22,right:isMine?0:'auto',left:isMine?'auto':0,display:'flex',gap:6}}>
                          <button type="button" onClick={()=>handleReact(msg)} style={{background:'transparent',border:'none',cursor:'pointer'}} title="Réagir">😀</button>
                          <button type="button" onClick={()=>handleReply(msg)} style={{background:'transparent',border:'none',cursor:'pointer'}} title="Répondre">↩️</button>
                          <button type="button" onClick={()=>handleForward(msg)} style={{background:'transparent',border:'none',cursor:'pointer'}} title="Transférer">🔁</button>
                          {isMine && <button type="button" onClick={()=>deleteMessage(msg.id)} style={{background:'transparent',border:'none',cursor:'pointer'}} title="Supprimer">🗑️</button>}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={styles.messageForm}>
              <div style={{display:'flex',flexDirection:'column',flex:1,gap:6}}>
                {replyTo && (
                  <div style={{padding:8,background:'#F1F5F9',borderRadius:8,fontSize:13}}>
                    <strong>Répondre à {replyTo.senderName}:</strong> {replyTo.text}
                    <button onClick={() => setReplyTo(null)} type="button" style={{marginLeft:8,background:'none',border:'none',cursor:'pointer'}}>✕</button>
                  </div>
                )}
                <input
                  name="messageInput"
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez un message..."
                  style={styles.messageInput}
                />
                {attachment && (
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{padding:6,background:'#fff',borderRadius:8,border:'1px solid #E5E7EB'}}>{attachment.name}</div>
                    <button type="button" onClick={() => setAttachment(null)} style={{background:'none',border:'none',cursor:'pointer'}}>Retirer</button>
                  </div>
                )}
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} title="Ajouter un fichier">
                <input type="file" onChange={handleFileChange} style={{display:'none'}} />
                📎
              </label>
              <button type="submit" style={styles.sendButton}>
                📤
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageContainer: {
    display: 'flex',
    height: 'calc(100vh - 72px)',
    background: '#f5f5f5'
  },
  conversationsList: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    background: '#FFF',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#000'
  },
  newConvButton: {
    background: '#0B3D91',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  newConvForm: {
    padding: 12,
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: '#F8FAFC'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit'
  },
  participantsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6
  },
  participantTag: {
    background: '#E7F3FF',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#0B3D91'
  },
  removeTag: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
    color: '#0B3D91'
  },
  addButton: {
    padding: '8px 12px',
    background: '#E7F3FF',
    color: '#0B3D91',
    border: '1px solid #0B3D91',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'background 0.2s'
  },
  createButton: {
    padding: '8px 12px',
    background: '#0B3D91',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'background 0.2s'
  },
  cancelButton: {
    padding: '8px 12px',
    background: '#F0F2F5',
    color: '#000',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'background 0.2s'
  },
  searchInput: {
    padding: '10px 16px',
    border: 'none',
    borderBottom: '1px solid #E5E7EB',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    background: '#F8FAFC'
  },
  conversationsScroll: {
    flex: 1,
    overflowY: 'auto'
  },
  emptyState: {
    padding: 20,
    textAlign: 'center',
    color: '#65676B',
    fontSize: 13
  },
  conversationItem: {
    padding: 12,
    borderBottom: '1px solid #F0F2F5',
    cursor: 'pointer',
    display: 'flex',
    gap: 12,
    transition: 'background 0.15s'
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#E7F3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
    color: '#0B3D91',
    fontWeight: 700
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    background: '#E7F3FF',
    color: '#0B3D91',
    fontWeight: 700
  },
  conversationInfo: {
    flex: 1,
    minWidth: 0
  },
  conversationName: {
    fontWeight: 600,
    fontSize: 14,
    color: '#000',
    marginBottom: 3
  },
  conversationPreview: {
    fontSize: 12,
    color: '#65676B',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 4
  },
  conversationTime: {
    fontSize: 11,
    color: '#BCC0C4'
  },
  unreadBadge: {
    background: '#FF4458',
    color: 'white',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#FFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    height: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease-out'
  },
  chatHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#F8FAFC'
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#E7F3FF',
    color: '#0B3D91',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0
  },
  chatHeaderTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: '#000'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 24,
    color: '#65676B',
    padding: 0,
    transition: 'color 0.2s'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  emptyMessages: {
    textAlign: 'center',
    color: '#65676B',
    fontSize: 13,
    margin: 'auto'
  },
  messageWrapper: {
    display: 'flex',
    gap: 8
  },
  messageBubble: {
    padding: '8px 12px',
    borderRadius: 18,
    maxWidth: '80%',
    wordWrap: 'break-word'
  },
  messageSender: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 2,
    opacity: 0.8
  },
  messageText: {
    fontSize: 14,
    lineHeight: 1.4
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.8
  },
  messageForm: {
    padding: 12,
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    gap: 8,
    background: '#F8FAFC'
  },
  messageInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: 20,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit'
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#0B3D91',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    transition: 'background 0.2s'
  }
}

