import { useState, useEffect, useRef } from 'react'
import Modal from './Modal'

export default function Stories(){
  const [active, setActive] = useState(null)
  const [user, setUser] = useState(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [createStoryOpen, setCreateStoryOpen] = useState(false)
  const [storyContent, setStoryContent] = useState('')
  const [storyImage, setStoryImage] = useState(null)
  const [storyImagePreview, setStoryImagePreview] = useState(null)
  const [creatingStory, setCreatingStory] = useState(false)
  const [storyBackground, setStoryBackground] = useState('image')
  const [storyBgColor, setStoryBgColor] = useState('#667eea')
  const [storyVisibility, setStoryVisibility] = useState('public')
  const [storyTextPosition, setStoryTextPosition] = useState('bottom') // 'top' | 'center' | 'bottom'
  const imageInputRef = useRef(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      try { setUser(JSON.parse(u)) } catch {}
    }
    function onUserUpdated(){
      const v = localStorage.getItem('user')
      setUser(v ? JSON.parse(v) : null)
    }
    window.addEventListener('userUpdated', onUserUpdated)
    return () => window.removeEventListener('userUpdated', onUserUpdated)
  }, [])

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    try {
      setLoading(true)
      const res = await fetch('/api/stories')
      if (res.ok) {
        const data = await res.json()
        setStories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  function getInitials(){
    if (!user) return 'U'
    const first = user.prenom ? user.prenom[0] : ''
    const last = user.nom ? user.nom[0] : ''
    return (first+last).toUpperCase() || 'U'
  }

  function formatTime(date) {
    if (!date) return ''
    const now = new Date()
    const storyDate = new Date(date)
    const diffMs = now - storyDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays < 7) return `Il y a ${diffDays} j`
    return storyDate.toLocaleDateString('fr-FR')
  }

  function getStoryBackground(index) {
    const gradients = [
      'linear-gradient(135deg,#667eea,#764ba2)',
      'linear-gradient(135deg,#f093fb,#f5576c)',
      'linear-gradient(135deg,#0B3D91,#082B60)',
      'linear-gradient(135deg,#fa709a,#fee140)',
      'linear-gradient(135deg,#4facfe,#00f2fe)',
      'linear-gradient(135deg,#43e97b,#38f9d7)'
    ]
    return gradients[index % gradients.length]
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      setStoryImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setStoryImagePreview(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleCreateStory() {
    if (!user) {
      alert('Vous devez être connecté')
      return
    }

    if (!storyContent && !storyImage) {
      alert('Veuillez ajouter du contenu ou une image')
      return
    }

    setCreatingStory(true)
    try {
      const payload = {
        content: storyContent,
        image: storyImagePreview,
        visibility: storyVisibility
      }

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.stringify(user)
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const newStory = await res.json()
        setStories([newStory, ...stories])
        setCreateStoryOpen(false)
        setStoryContent('')
        setStoryImage(null)
        setStoryImagePreview(null)
      } else {
        alert('Erreur lors de la création de la story')
      }
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Erreur lors de la création de la story')
    } finally {
      setCreatingStory(false)
    }
  }

  function resetCreateForm() {
    setCreateStoryOpen(false)
    setStoryContent('')
    setStoryImage(null)
    setStoryImagePreview(null)
    setStoryBackground('image')
    setStoryBgColor('#667eea')
    setStoryVisibility('public')
    setStoryTextPosition('bottom')
  }

  return (
    <div className="card" style={{padding:'12px 16px',marginBottom:12}}>
      <div className="stories-row">
        <div
          className="story-card story-create"
          onClick={()=>setCreateStoryOpen(true)}
          style={user && (user.avatarUrl || user.avatar) ? {background:`url(${user.avatarUrl||user.avatar}) center/cover`} : undefined}
        >
          <div className="story-create-icon"><i className="fas fa-plus"></i></div>
          <p className="story-label">Créer une story</p>
        </div>
        {!loading && stories.length > 0 ? (
          stories.map((s, index) => {
            const authorName = `${s.author?.prenom || ''} ${s.author?.nom || ''}`
            const initials = `${s.author?.prenom?.[0] || ''}${s.author?.nom?.[0] || ''}`
            return (
              <div 
                key={s.id} 
                className="story-card" 
                onClick={()=>setActive(s)} 
                style={{background: getStoryBackground(index)}}
              >
                {s.author?.avatarUrl || s.author?.avatar ? (
                  <img src={s.author.avatarUrl || s.author.avatar} alt="" className="story-user-avatar-img" style={{height:'100%',width:'100%',objectFit:'cover',borderRadius:'8px'}} />
                ) : (
                  <>
                    <div className="story-user-avatar" style={{background: getStoryBackground(index)}}>{initials}</div>
                    {s.image && <div style={{position:'absolute',inset:0,backgroundImage:`url(${s.image})`,backgroundSize:'cover',borderRadius:'8px'}}></div>}
                  </>
                )}
                <div className="story-gradient"></div>
                <p className="story-name">{authorName}</p>
              </div>
            )
          })
        ) : loading ? (
          <div style={{padding:'20px',color:'var(--fb-text-secondary)',fontSize:'13px'}}>Chargement des stories...</div>
        ) : (
          <div style={{padding:'20px',color:'var(--fb-text-secondary)',fontSize:'13px'}}>Aucune story pour le moment</div>
        )}
      </div>

      <Modal open={!!active} onClose={()=>setActive(null)} title={active ? `${active.author?.prenom || ''} ${active.author?.nom || ''}` : ''}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          {active?.image && (
            <img src={active.image} alt="story" style={{maxWidth:'100%',maxHeight:'60vh',borderRadius:'8px'}} />
          )}
          <div style={{marginTop:8,color:'var(--fb-text-secondary)',fontSize:'13px'}}>
            {formatTime(active?.createdAt)}
          </div>
          {active?.content && (
            <div style={{marginTop:12,textAlign:'center',fontSize:'14px'}}>
              {active.content}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={createStoryOpen} onClose={resetCreateForm} title="Créer une story">
        <div style={{display:'flex',gap:'20px',maxHeight:'600px'}}>
          {/* Preview */}
          <div style={{flex:'0 0 300px',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{
              width:'100%',
              height:'400px',
              background: storyBackground === 'color' ? storyBgColor : storyImagePreview ? `url(${storyImagePreview})` : '#f0f0f0',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius:'12px',
              display:'flex',
              alignItems: storyTextPosition === 'top' ? 'flex-start' : storyTextPosition === 'center' ? 'center' : 'flex-end',
              justifyContent:'center',
              padding:'16px',
              boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
              position:'relative',
              overflow:'hidden'
            }}>
              {storyContent && (
                <div style={{
                  position:'relative',
                  zIndex:10,
                  textAlign:'center',
                  color:'white',
                  textShadow:'0 2px 4px rgba(0,0,0,0.3)',
                  fontSize:'18px',
                  fontWeight:'600',
                  maxWidth:'90%',
                  wordWrap:'break-word'
                }}>
                  {storyContent}
                </div>
              )}
            </div>
            {/* Buttons under preview */}
            <div className="action-buttons" style={{display:'flex',gap:'12px',marginTop:'10px',justifyContent:'center',width:'100%'}}>
                <button
                  type="button"
                  onClick={resetCreateForm}
                  style={{
                    padding:'8px 12px',
                    background:'var(--fb-bg)',
                    border:'1px solid var(--fb-border)',
                    borderRadius:'8px',
                    cursor:'pointer',
                    fontWeight:'500',
                    fontSize:'13px',
                    transition:'all 0.15s'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateStory}
                  disabled={creatingStory || (!storyContent && !storyImage)}
                  style={{
                    padding:'8px 12px',
                    background:'var(--fb-blue)',
                    color:'white',
                    border:'none',
                    borderRadius:'8px',
                    cursor:creatingStory||(!storyContent&&!storyImage)?'not-allowed':'pointer',
                    fontWeight:'600',
                    fontSize:'13px',
                    opacity:creatingStory||(!storyContent&&!storyImage)?0.6:1,
                    transition:'all 0.15s'
                  }}
                >
                  {creatingStory ? <><i className="fas fa-spinner fa-spin"></i> Création...</> : <><i className="fas fa-paper-plane"></i> Publier</>}
                </button>
            </div>
          </div>

          {/* Controls */}
          <div style={{flex:1,overflowY:'auto',paddingRight:'8px'}}>
            {/* Content */}
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>
                Contenu
              </label>
              <textarea
                placeholder="Écrivez votre story..."
                value={storyContent}
                onChange={(e)=>setStoryContent(e.target.value)}
                maxLength={200}
                style={{
                  width:'100%',
                  height:'80px',
                  padding:'10px',
                  border:'1px solid var(--fb-border)',
                  borderRadius:'8px',
                  fontFamily:'inherit',
                  fontSize:'13px',
                  resize:'none'
                }}
              />
              <div style={{fontSize:'11px',color:'var(--fb-text-secondary)',marginTop:'4px'}}>
                {storyContent.length}/200
              </div>
            </div>
            {/* Text position */}
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>
                Position du texte
              </label>
              <div style={{display:'flex',gap:'8px'}}>
                {['top','center','bottom'].map(pos=>(
                  <button
                    key={pos}
                    type="button"
                    onClick={()=>setStoryTextPosition(pos)}
                    style={{
                      flex:1,
                      padding:'8px',
                      background:storyTextPosition===pos?'var(--fb-blue)':'var(--fb-bg)',
                      color:storyTextPosition===pos?'white':'var(--fb-text)',
                      border:'1px solid var(--fb-border)',
                      borderRadius:'6px',
                      cursor:'pointer',
                      fontSize:'12px',
                      fontWeight:'500',
                      transition:'all 0.15s'
                    }}
                  >
                    {pos === 'top' ? 'Haut' : pos === 'center' ? 'Centre' : 'Bas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Type */}
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>
                Arrière-plan
              </label>
              <div style={{display:'flex',gap:'8px'}}>
                <button
                  type="button"
                  onClick={() => {
                    setStoryBackground('image')
                    imageInputRef.current?.click()
                  }}
                  style={{
                    flex:1,
                    padding:'8px',
                    background:storyBackground==='image'?'var(--fb-blue)':'var(--fb-bg)',
                    color:storyBackground==='image'?'white':'var(--fb-text)',
                    border:'1px solid var(--fb-border)',
                    borderRadius:'6px',
                    cursor:'pointer',
                    fontSize:'12px',
                    fontWeight:'500',
                    transition:'all 0.15s'
                  }}
                >
                  <i className="fas fa-image"></i> Image
                </button>
                <button
                  type="button"
                  onClick={()=>setStoryBackground('color')}
                  style={{
                    flex:1,
                    padding:'8px',
                    background:storyBackground==='color'?'var(--fb-blue)':'var(--fb-bg)',
                    color:storyBackground==='color'?'white':'var(--fb-text)',
                    border:'1px solid var(--fb-border)',
                    borderRadius:'6px',
                    cursor:'pointer',
                    fontSize:'12px',
                    fontWeight:'500',
                    transition:'all 0.15s'
                  }}
                >
                  <i className="fas fa-palette"></i> Couleur
                </button>
              </div>
            </div>

            {/* Color Picker */}
            {storyBackground === 'color' && (
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>
                  Couleur
                </label>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {['#667eea','#764ba2','#f093fb','#f5576c','#0B3D91','#082B60','#4facfe','#00f2fe','#43e97b','#38f9d7','#fa709a','#fee140'].map(color=>(
                    <button
                      key={color}
                      type="button"
                      onClick={()=>setStoryBgColor(color)}
                      style={{
                        width:'32px',
                        height:'32px',
                        background:color,
                        border:storyBgColor===color?'3px solid white':'2px solid rgba(0,0,0,0.1)',
                        borderRadius:'50%',
                        cursor:'pointer',
                        boxShadow:'0 2px 4px rgba(0,0,0,0.1)',
                        transition:'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload */}
            {storyBackground === 'image' && (
              <div style={{marginBottom:'16px'}}>
                <label style={{
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:'8px',
                  padding:'12px',
                  background:'var(--fb-bg)',
                  border:'2px dashed var(--fb-border)',
                  borderRadius:'8px',
                  cursor:'pointer',
                  transition:'all 0.15s'
                }}>
                  <i className="fas fa-upload"></i>
                  <span style={{fontSize:'13px',fontWeight:'500'}}>Ajouter une image</span>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{display:'none'}} />
                </label>
                {storyImage && (
                  <div style={{fontSize:'11px',color:'var(--fb-text-secondary)',marginTop:'4px'}}>
                    ✓ Image sélectionnée
                  </div>
                )}
              </div>
            )}



            {/* Visibility */}
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>
                Visibilité
              </label>
              <select
                value={storyVisibility}
                onChange={(e)=>setStoryVisibility(e.target.value)}
                style={{
                  width:'100%',
                  padding:'8px 10px',
                  border:'1px solid var(--fb-border)',
                  borderRadius:'6px',
                  fontSize:'13px',
                  background:'white',
                  cursor:'pointer'
                }}
              >
                <option value="public">👥 Tout le monde</option>
                <option value="friends">👫 Amis uniquement</option>
                <option value="close">🔒 Proches amis</option>
              </select>
            </div>
          </div>


        </div>
      </Modal>
    </div>
  )
}
