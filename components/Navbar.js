import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Dropdown from './Dropdown'

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter()
  const [openId, setOpenId] = useState(null)
  const rootRef = useRef()
  const [notifications, setNotifications] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
    }
    function onUserUpdated() {
      const u = localStorage.getItem('user')
      setUser(u ? JSON.parse(u) : null)
    }
    window.addEventListener('userUpdated', onUserUpdated)
    return () => window.removeEventListener('userUpdated', onUserUpdated)
  }, [])

  useEffect(()=>{
    function onDoc(e){
      if(!rootRef.current) return
      if(!rootRef.current.contains(e.target)) setOpenId(null)
    }
    document.addEventListener('click', onDoc)
    return ()=> document.removeEventListener('click', onDoc)
  },[])

  useEffect(() => {
    let mounted = true
    async function fetchNotifications(){
      try{
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if(mounted) setNotifications(data.notifications || [])
      }catch(e){ console.error('failed to load notifications', e) }
    }
    fetchNotifications()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    async function fetchConversations(){
      try{
        if (!user) return
        const res = await fetch(`/api/messages?userEmail=${encodeURIComponent(user.email)}`)
        const data = await res.json()
        if(mounted) setConversations(Array.isArray(data) ? data : [])
      }catch(e){ console.error('failed to load conversations', e) }
    }
    fetchConversations()
    const interval = setInterval(fetchConversations, 3000)
    return () => { mounted = false; clearInterval(interval) }
  }, [user])

  async function markAsRead(id){
    try{
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true }) })
      // update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }catch(e){ console.error('mark read failed', e) }
  }

  async function markAllRead(){
    try{
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }catch(e){ console.error('mark all read failed', e) }
  }

  async function sendMessage(e){
    e.preventDefault()
    if(!newMessage.trim() || !activeConversation) return
    try{
      const payload = {
        conversationId: activeConversation.id,
        senderEmail: user?.email || 'user@example.com',
        senderName: user ? `${user.prenom} ${user.nom}` : 'User',
        text: newMessage
      }

      await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setNewMessage('')
      const res = await fetch(`/api/messages?userEmail=${encodeURIComponent(user?.email || 'user@example.com')}`)
      const data = await res.json()
      const updated = Array.isArray(data) ? data.find(c => c.id === activeConversation.id) : null
      setActiveConversation(updated || activeConversation)
    }catch(e){ console.error('send failed', e) }
  }

  function toggle(id){ setOpenId(prev => prev === id ? null : id) }

  async function handleMessageClick(e){
    e.stopPropagation()
    if (!user) {
      router.push('/auth')
      return
    }
    toggle('messages')
  }

  function handleLogout(e) {
    e?.stopPropagation()
    localStorage.removeItem('user')
    setUser(null)
    // close menus
    setOpenId(null)
    // redirect to auth
    router.push('/auth')
  }

  return (
    <nav className="navbar" ref={rootRef}>
      <div className="navbar-left" style={{display:'flex',alignItems:'center',gap:12}}>
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{display:'none',background:'none',border:'none',cursor:'pointer',fontSize:22,color:'#D4A017',padding:'8px 10px'}}
          title="Menu"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Link href="/" className="navbar-logo" style={{display:'flex',alignItems:'center',justifyContent:'center',width:40,height:40,padding:0}}>
            <svg width="40" height="40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="95" fill="#0A2342" stroke="#D4A017" strokeWidth="10" />
              <text x="100" y="130" textAnchor="middle" fontSize="100" fontFamily="Arial, sans-serif" fill="#D4A017" fontWeight="bold">U</text>
            </svg>
          </Link>
          <span style={{fontSize:32,fontWeight:700,color:'#B8860B',letterSpacing:'-1px',fontFamily:'Arial, sans-serif'}}>Unify</span>
        </div>
      </div>

      <div className="navbar-center" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input type="text" placeholder="Rechercher" />
        </div>
      </div>

      <div className="navbar-right" style={{display:'flex',alignItems:'center',gap:8}}>
        <Link href="/">
          <button className="nav-icon-btn dark" title="Accueil"><i className="fas fa-home"></i></button>
        </Link>

        <div className="dropdown" style={{position:'relative'}}>
          <button className="nav-icon-btn dark" onClick={handleMessageClick} title="Messages"><i className="fas fa-comment-dots"></i></button>
          <Dropdown open={openId==='messages'}>
            <div className="notif-header"><h3>Messages</h3></div>
            <div style={{padding:8,maxHeight:320,overflowY:'auto'}}>
              {conversations.length === 0 ? (
                <div style={{padding:8,color:'var(--fb-text-secondary)'}}>Aucune conversation</div>
              ) : (
                conversations.map(conv => (
                  <div key={conv.id} onClick={(e)=>{ e.stopPropagation(); setActiveConversation(conv); setChatModalOpen(true) }} style={{padding:8,borderBottom:'1px solid var(--fb-bg)',cursor:'pointer',background:'transparent',transition:'background .15s',display:'flex',gap:8,alignItems:'center'}} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:40,height:40,borderRadius:'50%',background:'#E7F3FF',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#0B3D91',flexShrink:0}}>
                      {conv.avatar || (conv.participants?.find(p => p !== (user?.email || '')) || '?')[0]?.toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13}}>{conv.title || conv.name}</div>
                      <div style={{fontSize:12,color:'var(--fb-text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {conv.lastMessageSender && <strong>{conv.lastMessageSender}: </strong>}
                        {conv.lastMessage}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Dropdown>
        </div>

        {/* Chat Modal */}
        {chatModalOpen && activeConversation && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={(e)=>{ if(e.target === e.currentTarget) setChatModalOpen(false) }}>
            <div style={{background:'white',borderRadius:12,width:'90%',maxWidth:500,height:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 4px 16px rgba(0,0,0,0.2)'}}>
              <div style={{padding:12,borderBottom:'1px solid var(--fb-bg)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'#E7F3FF',color:'#0B3D91',fontWeight:700}}>{activeConversation.avatar || (activeConversation.participants?.find(p => p !== (user?.email || '')) || '?')[0]?.toUpperCase()}</div>
                  <div>
                    <h3 style={{margin:0}}>{activeConversation.title || activeConversation.name}</h3>
                    <div style={{fontSize:12,color:'#666'}}>{activeConversation.participants?.find(p => p !== (user?.email || ''))}</div>
                  </div>
                </div>
                <button onClick={(e)=>{ e.stopPropagation(); setChatModalOpen(false) }} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--fb-text)'}}>✕</button>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
                {(activeConversation.messages || []).slice().reverse().map(msg => {
                  const isMine = user && (msg.senderEmail ? msg.senderEmail === user.email : msg.sender === `${user.prenom} ${user.nom}`)
                  return (
                    <div key={msg.id} style={{display:'flex',justifyContent: isMine ? 'flex-end' : 'flex-start'}}>
                      <div style={{background: isMine ? '#0B3D91' : 'var(--fb-bg)',color: isMine ? 'white' : 'var(--fb-text)',padding:'8px 12px',borderRadius:8,maxWidth:'80%',wordWrap:'break-word'}}>
                        {!isMine && (msg.senderName || msg.sender) && <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{msg.senderName || msg.sender}</div>}
                        {msg.type === 'media' && msg.attachments?.url ? (
                          <img src={msg.attachments.url} alt={msg.attachments.name || 'media'} style={{maxWidth:220,borderRadius:8}} />
                        ) : msg.type === 'file' || msg.type === 'document' ? (
                          <a href={msg.attachments?.url} target="_blank" rel="noreferrer" style={{display:'inline-block',padding:8,background:isMine?'rgba(255,255,255,0.06)':'#fff',borderRadius:8,color:isMine?'white':'#0A2342',textDecoration:'none'}}>
                            📎 {msg.attachments?.name || 'Fichier'}
                          </a>
                        ) : (
                          <div>{msg.text}</div>
                        )}
                        <div style={{fontSize:11,opacity:0.7,marginTop:6}}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form onSubmit={sendMessage} style={{padding:12,borderTop:'1px solid var(--fb-bg)',display:'flex',gap:8}}>
                <input value={newMessage} onChange={(e)=>setNewMessage(e.target.value)} placeholder="Aa" style={{flex:1,padding:'8px 12px',border:'1px solid var(--fb-border)',borderRadius:20,fontSize:14,outline:'none'}} />
                <button type="submit" style={{width:36,height:36,borderRadius:'50%',background:'var(--fb-blue)',color:'white',border:'none',cursor:'pointer',fontSize:16}}>✉</button>
              </form>
            </div>
          </div>
        )}

        <div className="dropdown" style={{position:'relative'}}>
          <button className="nav-icon-btn dark" onClick={(e)=>{ e.stopPropagation(); toggle('notif') }} title="Notifications">
            <i className="fas fa-bell"></i>
            {notifications.filter(n => !n.read).length > 0 && <span className="badge">{notifications.filter(n => !n.read).length}</span>}
          </button>
          <Dropdown open={openId==='notif'}>
            <div className="notif-dropdown">
              <div className="notif-header">
                <h3>Notifications</h3>
                <button className="btn-secondary" onClick={(e)=>{ e.stopPropagation(); markAllRead() }} style={{fontSize:'13px',padding:'6px 10px',background:'transparent',border:'none',color:'var(--fb-blue)',fontWeight:700,cursor:'pointer'}}>
                  Tout marquer comme lu
                </button>
              </div>
              {notifications.length > 0 && (
                <p style={{padding:'4px 8px',fontSize:'13px',fontWeight:700,color:'var(--fb-text-secondary)',margin:'8px 0 4px 0'}}>Nouvelles</p>
              )}
              <div style={{maxHeight:320,overflowY:'auto'}}>
                {notifications.length === 0 ? (
                  <div style={{padding:'8px',color:'var(--fb-text-secondary)'}}>Pas de notifications pour l'instant</div>
                ) : (
                  notifications.slice(0,8).map(notif => {
                    const getIconClass = () => {
                      if(notif.action?.includes('aimé')) return 'blue'
                      if(notif.action?.includes('commenté') || notif.action?.includes('réagi')) return 'red'
                      if(notif.action?.includes('accepté') || notif.action?.includes('suivre')) return 'green'
                      return 'blue'
                    }
                    const getIconSymbol = () => {
                      if(notif.action?.includes('aimé')) return '👍'
                      if(notif.action?.includes('commenté')) return '💬'
                      if(notif.action?.includes('accepté')) return '✓'
                      if(notif.action?.includes('anniversaire')) return '🎂'
                      return '💙'
                    }
                    return (
                      <div key={notif.id} className={`notif-item ${!notif.read ? 'unread' : ''}`} onClick={() => { if(notif.url) window.location.href = notif.url }}>
                        <div className="notif-avatar">
                          <div className="avatar-placeholder" style={{background:'linear-gradient(135deg, #667eea, #764ba2)'}}>
                            {notif.avatar}
                          </div>
                          <span className={`notif-icon ${getIconClass()}`}>{getIconSymbol()}</span>
                        </div>
                        <div className="notif-text">
                          <p><strong>{notif.userName}</strong> {notif.action} {notif.content && `votre ${notif.content}`}</p>
                          <span>{notif.time}</span>
                        </div>
                        {!notif.read && <div className="notif-dot"></div>}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </Dropdown>
        </div>

        <div className="dropdown" style={{position:'relative'}}>
          <button className="nav-icon-btn dark" onClick={(e)=>{ e.stopPropagation(); toggle('profile') }} title="Profil">
            <div style={{width:32,height:32,borderRadius:'50%',background:'#E7F3FF',display:'flex',alignItems:'center',justifyContent:'center',color:'#0B3D91',fontWeight:700}}>
              {user ? (user.nom ? (user.nom[0] || user.prenom[0]) : user.prenom[0]) : 'U'}
            </div>
          </button>
          <Dropdown open={openId==='profile'}>
            <div style={{padding:8,minWidth:260}}>
              {user ? (
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:12,paddingBottom:8,borderBottom:'1px solid var(--fb-border)',cursor:'pointer',padding:8,borderRadius:8}} onClick={()=>{ setOpenId(null); router.push('/profile') }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,#667eea,#764ba2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'white',fontSize:22,flexShrink:0}}>{user.nom ? user.nom[0] : user.prenom[0]}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:16}}>{user.prenom} {user.nom}</div>
                      <div style={{fontSize:13,color:'var(--fb-blue)',fontWeight:600}}>Voir votre profil</div>
                    </div>
                  </div>
                  <div style={{borderBottom:'1px solid var(--fb-border)',margin:'8px 0'}}></div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8}} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className="fas fa-moon"></i></div>
                    <span>Mode sombre</span>
                    <div style={{marginLeft:'auto',width:44,height:24,background:'var(--fb-border)',borderRadius:12,cursor:'pointer',position:'relative',transition:'background .2s'}} className="toggle" onClick={(e)=>{ e.currentTarget.classList.toggle('on') }}>
                      <div style={{position:'absolute',width:20,height:20,background:'white',borderRadius:'50%',top:2,left:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}></div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8}} onClick={()=>{ setOpenId(null); router.push('/settings') }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className="fas fa-cog"></i></div>
                    <span>Paramètres et confidentialité</span>
                    <i className="fas fa-chevron-right" style={{marginLeft:'auto',color:'var(--fb-text-secondary)',fontSize:14}}></i>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8}} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className="fas fa-question-circle"></i></div>
                    <span>Aide et assistance</span>
                  </div>
                  <div style={{borderBottom:'1px solid var(--fb-border)',margin:'8px 0'}}></div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8,color:'#c53030'}} onClick={handleLogout} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className="fas fa-sign-out-alt"></i></div>
                    <span>Se déconnecter</span>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:8,padding:8}}>
                  <button className="btn-primary" onClick={()=>router.push('/auth')} style={{width:'100%',justifyContent:'center'}}>Se connecter</button>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </div>
    </nav>
  )
}
