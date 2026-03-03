import { useState, useEffect } from 'react'

export default function Pages(){
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('followed')

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages')
      const data = await res.json()
      setPages(data.pages || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowPage = async (id) => {
    await fetch('/api/pages', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ action: 'follow', pageId: id }) 
    })
    fetchPages()
  }

  const handleUnfollowPage = async (id) => {
    await fetch('/api/pages', { 
      method: 'DELETE', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ pageId: id }) 
    })
    fetchPages()
  }

  const followedPages = pages.filter(p => p.followed)
  const suggestedPages = pages.filter(p => !p.followed)

  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{padding:16,borderBottom:'1px solid var(--fb-border)',display:'flex',gap:8}}>
          <button 
            onClick={() => setActiveTab('followed')}
            style={{padding:'8px 16px',background:activeTab==='followed'?'var(--fb-blue)':'var(--fb-bg)',color:activeTab==='followed'?'white':'var(--fb-text)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
          >
            Pages suivies ({followedPages.length})
          </button>
          <button 
            onClick={() => setActiveTab('suggestions')}
            style={{padding:'8px 16px',background:activeTab==='suggestions'?'var(--fb-blue)':'var(--fb-bg)',color:activeTab==='suggestions'?'white':'var(--fb-text)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
          >
            Suggéstions ({suggestedPages.length})
          </button>
        </div>

        <div style={{padding:16}}>
          {activeTab === 'followed' && (
            <div>
              <h3 style={{marginBottom:16}}>Pages que vous suivez</h3>
              {followedPages.length === 0 ? (
                <p style={{color:'var(--fb-text-secondary)'}}>Vous ne suivez pas encore de pages</p>
              ) : (
                <div>
                  {followedPages.map(page => (
                    <div key={page.id} style={{display:'flex',gap:12,padding:12,borderBottom:'1px solid var(--fb-border)',alignItems:'center'}}>
                      <div className="avatar-placeholder" style={{width:60,height:60,fontSize:28,flex:'0 0 60px'}}>{page.icon}</div>
                      <div style={{flex:1}}>
                        <h4 style={{marginBottom:2}}>{page.name}</h4>
                        <p style={{fontSize:13,color:'var(--fb-text-secondary)',marginBottom:4}}>{page.followers} abonnés</p>
                        <p style={{fontSize:13,color:'var(--fb-text-secondary)'}}>{page.description}</p>
                      </div>
                      <button 
                        onClick={() => handleUnfollowPage(page.id)}
                        style={{padding:'8px 16px',background:'#E4E6E9',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}
                      >
                        S'abonner
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div>
              <h3 style={{marginBottom:16}}>Pages suggérées</h3>
              {suggestedPages.length === 0 ? (
                <p style={{color:'var(--fb-text-secondary)'}}>Pas de suggéstions pour le moment</p>
              ) : (
                <div>
                  {suggestedPages.map(page => (
                    <div key={page.id} style={{display:'flex',gap:12,padding:12,borderBottom:'1px solid var(--fb-border)',alignItems:'center'}}>
                      <div className="avatar-placeholder" style={{width:60,height:60,fontSize:28,flex:'0 0 60px'}}>{page.icon}</div>
                      <div style={{flex:1}}>
                        <h4 style={{marginBottom:2}}>{page.name}</h4>
                        <p style={{fontSize:13,color:'var(--fb-text-secondary)',marginBottom:4}}>{page.followers} abonnés</p>
                        <p style={{fontSize:13,color:'var(--fb-text-secondary)'}}>{page.description}</p>
                      </div>
                      <button 
                        onClick={() => handleFollowPage(page.id)}
                        style={{padding:'8px 16px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}
                      >
                        S'abonner
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
