import { useState, useEffect } from 'react'

export default function Amis(){
  const [amis, setAmis] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('amis')

  useEffect(() => {
    fetchAmis()
  }, [])

  const fetchAmis = async () => {
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const userEmail = user?.email
      if (!userEmail) {
        setLoading(false)
        return
      }
      const res = await fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await res.json()
      setAmis(data.amis || [])
      setSuggestions(data.suggestions || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (id) => {
    await fetch('/api/amis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', userId: id }) })
    fetchAmis()
  }

  const handleRemove = async (id) => {
    await fetch('/api/amis', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id }) })
    fetchAmis()
  }

  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{padding:16,borderBottom:'1px solid var(--fb-border)',display:'flex',gap:8}}>
          <button 
            onClick={() => setActiveTab('amis')}
            style={{padding:'8px 16px',background:activeTab==='amis'?'var(--fb-blue)':'var(--fb-bg)',color:activeTab==='amis'?'white':'var(--fb-text)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
          >
            Mes amis ({amis.length})
          </button>
          <button 
            onClick={() => setActiveTab('suggestions')}
            style={{padding:'8px 16px',background:activeTab==='suggestions'?'var(--fb-blue)':'var(--fb-bg)',color:activeTab==='suggestions'?'white':'var(--fb-text)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
          >
            Suggéstions ({suggestions.length})
          </button>
        </div>

        <div style={{padding:16}}>
          {activeTab === 'amis' && (
            <div>
              <h3 style={{marginBottom:16}}>Mes amis</h3>
              {amis.length === 0 ? (
                <p style={{color:'var(--fb-text-secondary)'}}>Vous n'avez pas encore d'amis</p>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',gap:12}}>
                  {amis.map(ami => (
                    <div key={ami.id} style={{textAlign:'center',padding:12,borderRadius:8,border:'1px solid var(--fb-border)'}}>
                      <div className="avatar-placeholder" style={{width:80,height:80,fontSize:32,margin:'0 auto 8px'}}>{ami.avatar}</div>
                      <div style={{fontWeight:600,marginBottom:4}}>{ami.name}</div>
                      <div style={{fontSize:12,color:'var(--fb-text-secondary)',marginBottom:8}}>{ami.status}</div>
                      <button onClick={() => handleRemove(ami.id)} style={{width:'100%',padding:'6px 12px',background:'#E4E6E9',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600}}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div>
              <h3 style={{marginBottom:16}}>Suggestions d'amis</h3>
              {suggestions.length === 0 ? (
                <p style={{color:'var(--fb-text-secondary)'}}>Pas de suggéstions pour le moment</p>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',gap:12}}>
                  {suggestions.map(user => (
                    <div key={user.id} style={{textAlign:'center',padding:12,borderRadius:8,border:'1px solid var(--fb-border)'}}>
                      <div className="avatar-placeholder" style={{width:80,height:80,fontSize:32,margin:'0 auto 8px'}}>{user.avatar}</div>
                      <div style={{fontWeight:600,marginBottom:4}}>{user.name}</div>
                      <div style={{fontSize:12,color:'var(--fb-text-secondary)',marginBottom:8}}>{user.mutualFriends} amis en commun</div>
                      <button onClick={() => handleAdd(user.id)} style={{width:'100%',padding:'6px 12px',background:'var(--fb-blue)',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600,color:'white'}}>
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
