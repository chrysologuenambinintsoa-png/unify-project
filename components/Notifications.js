import { useState, useEffect } from 'react'

export default function Notifications(){
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    await fetch('/api/notifications', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id, read: true }) 
    })
    fetchNotifications()
  }

  const handleDelete = async (id) => {
    await fetch('/api/notifications', { 
      method: 'DELETE', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id }) 
    })
    fetchNotifications()
  }

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return '👍'
      case 'comment': return '💬'
      case 'share': return '🔄'
      case 'friend': return '👤'
      case 'message': return '📧'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type) => {
    switch(type) {
      case 'like': return '#B8860B'
      case 'comment': return '#0A6BA8'
      case 'share': return '#45BD62'
      case 'friend': return '#764ba2'
      case 'message': return '#F7B928'
      default: return '#667eea'
    }
  }

  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{padding:16,borderBottom:'1px solid var(--fb-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2>Notifications ({notifications.length})</h2>
          {notifications.length > 0 && (
            <button 
              onClick={async () => {
                try{
                  await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
                  fetchNotifications()
                }catch(e){ console.error('mark all failed', e) }
              }}
              style={{padding:'8px 16px',background:'var(--fb-bg)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13}}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        <div>
          {notifications.length === 0 ? (
            <div style={{padding:24,textAlign:'center',color:'var(--fb-text-secondary)'}}>
              <div style={{fontSize:48,marginBottom:8}}>🔔</div>
              <p>Aucune notification pour le moment</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                style={{
                  display:'flex',
                  gap:12,
                  padding:12,
                  borderBottom:'1px solid var(--fb-border)',
                  background:notif.read?'white':'#F0F2F5',
                  alignItems:'flex-start',
                  cursor:'pointer',
                  transition:'background .15s'
                }}
              >
                <div className="avatar-placeholder" style={{width:48,height:48,fontSize:20,flex:'0 0 48px'}}>{notif.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{marginBottom:4}}>
                    <span style={{fontWeight:600}}>{notif.userName}</span>
                    <span style={{color:'var(--fb-text-secondary)'}}> {notif.action}</span>
                  </div>
                  <p style={{fontSize:13,color:'var(--fb-text-secondary)',marginBottom:4}}>{notif.content}</p>
                  <p style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{notif.time}</p>
                </div>
                <div style={{display:'flex',gap:4,flex:'0 0 auto'}}>
                  {!notif.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      style={{width:32,height:32,borderRadius:'50%',background:'var(--fb-blue)',color:'white',border:'none',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}
                      title="Marquer comme lu"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notif.id)}
                    style={{width:32,height:32,borderRadius:'50%',background:'var(--fb-bg)',border:'none',cursor:'pointer',color:'var(--fb-text)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
