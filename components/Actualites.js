import { useState, useEffect } from 'react'

export default function Actualites(){
  const [actualites, setActualites] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchActualites()
  }, [])

  const fetchActualites = async () => {
    try {
      const res = await fetch('/api/actualites')
      const data = await res.json()
      setActualites(data.actualites || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', 'tech', 'business', 'design', 'web']
  const filtered = filter === 'all' ? actualites : actualites.filter(a => a.category === filter)

  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{padding:16,borderBottom:'1px solid var(--fb-border)'}}>
          <h2 style={{marginBottom:12}}>Actualités</h2>
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding:'8px 16px',
                  background:filter===cat?'var(--fb-blue)':'var(--fb-bg)',
                  color:filter===cat?'white':'var(--fb-text)',
                  border:'none',
                  borderRadius:20,
                  cursor:'pointer',
                  fontWeight:600,
                  fontSize:13,
                  whiteSpace:'nowrap',
                  flex:'0 0 auto'
                }}
              >
                {cat === 'all' ? 'Toutes' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          {filtered.length === 0 ? (
            <div style={{padding:24,textAlign:'center',color:'var(--fb-text-secondary)'}}>
              <p>Aucune actualité dans cette catégorie</p>
            </div>
          ) : (
            filtered.map(article => (
              <div key={article.id} style={{borderBottom:'1px solid var(--fb-border)',padding:12,cursor:'pointer',transition:'background .15s'}} className="article-item">
                <div style={{display:'flex',gap:12}}>
                  <div style={{width:100,height:80,borderRadius:8,background:article.image,flex:'0 0 100px',overflow:'hidden'}}>
                    <img src={article.image} alt={article.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,background:'var(--fb-blue)',color:'white',padding:'2px 8px',borderRadius:12}}>
                        {article.category}
                      </span>
                      <span style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{article.source}</span>
                    </div>
                    <h4 style={{marginBottom:6,fontWeight:600,lineHeight:1.3}}>{article.title}</h4>
                    <p style={{fontSize:13,color:'var(--fb-text-secondary)',marginBottom:6,lineHeight:1.4}}>{article.excerpt}</p>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,color:'var(--fb-text-secondary)'}}>
                      <span>{article.author}</span>
                      <span>{article.time}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,flex:'0 0 auto'}}>
                    <button style={{width:40,height:40,borderRadius:'50%',background:'var(--fb-bg)',border:'none',cursor:'pointer',fontSize:16}} title="Lire">
                      📖
                    </button>
                    <button style={{width:40,height:40,borderRadius:'50%',background:'var(--fb-bg)',border:'none',cursor:'pointer',fontSize:16}} title="Partager">
                      📤
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .article-item:hover {
          background: var(--fb-bg);
        }
      `}</style>
    </div>
  )
}
