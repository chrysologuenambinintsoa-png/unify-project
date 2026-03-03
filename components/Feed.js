import { useEffect, useState, useRef } from 'react'
import CreatePost from './CreatePost'
import PostCard from './PostCard'
import Stories from './Stories'
import Modal from './Modal'
import { PostSkeleton } from './Skeleton'

export default function Feed(){
  const [items,setItems] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [isPostOpen, setIsPostOpen] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedFilesCount, setSelectedFilesCount] = useState(0)
  const fileInputRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showFeelingModal, setShowFeelingModal] = useState(false)
  const [showTextPublicationModal, setShowTextPublicationModal] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [feelingSelected, setFeelingSelected] = useState(null)
  const [textPubContent, setTextPubContent] = useState('')
  const [textPubBgType, setTextPubBgType] = useState('color')
  const [textPubBgColor, setTextPubBgColor] = useState('#667eea')
  const [textPubTextColor, setTextPubTextColor] = useState('#ffffff')

  async function load(){
    setLoadingPosts(true)
    try{
      const res = await fetch('/api/items')
      const data = await res.json()
      // Transform raw data to format expected by PostCard
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const transformed = data.map(item => ({
        ...item,
        author: item.author || (localUser ? (localUser.prenom || localUser.nomUtilisateur || localUser.email.split('@')[0]) : 'Jean Dupont'),
        date: new Date(item.createdAt).toLocaleDateString('fr-FR'),
        initials: item.initials || (localUser ? ((localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}` : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2) : 'JD')).toUpperCase()) : 'JD'),
        color: item.color || 'linear-gradient(135deg, #0B3D91, #082B60)',
        privacy: item.privacy || 'globe',
        likes: item.likes || 0,
        shares: item.shares || 0,
        image: item.image || null
      }))
      setItems(prev => {
        const temps = (prev || []).filter(p => String(p.id).startsWith('temp-'))
        return [...temps, ...transformed]
      })
    }catch(e){console.error(e)}
    finally{ setLoadingPosts(false) }
  }

  useEffect(()=>{
    const u = localStorage.getItem('user')
    if(u) setCurrentUser(JSON.parse(u))
    load()
  },[])

  async function handleCreate(title, content){
    if(!content?.trim() && !selectedImage){
      alert('Veuillez ajouter du contenu ou une image');
      return;
    }
    // ensure we always send a non-empty title (backend rejects empty)
    const computedTitle = (title || content || (selectedImage ? 'Image' : '')).trim();
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ title: computedTitle, content: content.trim(), image: selectedImage || null })
      });
      if(!res.ok) {
        const text = await res.text();
        console.error('create post failed body', text);
        // Fallback: still show the post locally with a temporary id so image appears
        const userStr = localStorage.getItem('user')
        const localUser = userStr ? JSON.parse(userStr) : null
        const name = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'
        const initials = localUser ? (localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}`.toUpperCase() : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'
        const tempPost = {
          id: `temp-${Date.now()}`,
          title: computedTitle,
          content: content.trim(),
          author: name,
          initials,
          color: 'linear-gradient(135deg, #0B3D91, #082B60)',
          date: new Date().toLocaleDateString('fr-FR'),
          image: selectedImage || null,
          likes: 0,
          shares: 0
        }
        setItems(prev => {
          const withoutDup = (prev || []).filter(p => p.id !== tempPost.id)
          return [tempPost, ...withoutDup]
        })
        closeModal()
        return
      }
      const created = await res.json()
      // prepend a local post that includes the selected image and current user info
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const name = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'
      const initials = localUser ? (localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}`.toUpperCase() : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'
      const localPost = {
        ...created,
        author: name,
        initials,
        color: 'linear-gradient(135deg, #0B3D91, #082B60)',
        date: new Date().toLocaleDateString('fr-FR'),
        image: selectedImage || null,
        likes: 0,
        shares: 0
      }
      setItems(prev => {
        // remove any temp posts (they were placeholders)
        const withoutTemps = (prev || []).filter(p => !String(p.id).startsWith('temp-'))
        return [localPost, ...withoutTemps]
      })
      closeModal()
    } catch(e) {
      console.error('Erreur lors de la création du post:', e);
      alert('Erreur lors de la création du post');
    }
  }

  async function handleDelete(id){
    try {
      const res = await fetch(`/api/items/${id}`, {method: 'DELETE'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      await load()
    } catch(e) {
      console.error('Erreur lors de la suppression:', e);
    }
  }

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if(files.length === 0) return;
    setSelectedFilesCount(files.length);
    const first = files[0];
    if(first) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result);
      };
      reader.readAsDataURL(first);
    }
  }

  function insertEmoji(emoji) {
    setPostContent(prev => prev + emoji);
  }

  function insertTag() {
    setPostContent(prev => prev + ' @Ami ');
  }

  function addTagFromModal() {
    if (tagInput.trim()) {
      setPostContent(prev => prev + ` @${tagInput} `);
      setTagInput('');
      setShowTagModal(false);
    }
  }

  function addFeelingFromModal() {
    if (feelingSelected) {
      setPostContent(prev => prev + ` ${feelingSelected.emoji} ${feelingSelected.label} `);
      setFeelingSelected(null);
      setShowFeelingModal(false);
    }
  }

  const feelings = [
    { emoji: '😊', label: 'Joyeux' },
    { emoji: '😔', label: 'Triste' },
    { emoji: '😍', label: 'Amoureux' },
    { emoji: '😡', label: 'En colère' },
    { emoji: '😴', label: 'Fatigué' },
    { emoji: '🤔', label: 'Pensif' },
    { emoji: '🎉', label: 'Célébrant' },
    { emoji: '😎', label: 'Confiant' },
    { emoji: '😅', label: 'Rigolo' },
    { emoji: '😢', label: 'Ému' }
  ];

  function insertLocation() {
    setPostContent(prev => prev + ' 📍 Localisation ');
  }

  function closeModal() {
    setIsPostOpen(false);
    setPostTitle('');
    setPostContent('');
    setSelectedImage(null);
    setSelectedFilesCount(0);
  }

  async function handleCreateTextPublication() {
    if (!textPubContent.trim()) {
      alert('Veuillez ajouter du texte');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      const localUser = userStr ? JSON.parse(userStr) : null;

      const payload = {
        content: textPubContent,
        backgroundColor: textPubBgColor,
        textColor: textPubTextColor,
        privacy: 'public'
      };

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newPost = await res.json();
        setItems(prev => [newPost, ...prev]);
        setTextPubContent('');
        setTextPubBgColor('#667eea');
        setTextPubTextColor('#ffffff');
        setShowTextPublicationModal(false);
      } else {
        alert('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    }
  }

  function resetTextPublicationModal() {
    setShowTextPublicationModal(false);
    setTextPubContent('');
    setTextPubBgColor('#667eea');
    setTextPubTextColor('#ffffff');
    setTextPubBgType('color');
  }

  return (
    <div>
      <Stories />
      <CreatePost onOpen={()=>setIsPostOpen(true)} user={currentUser} onOpenTextPublication={() => setShowTextPublicationModal(true)} />
      <div style={{marginTop:12}}>
        {loadingPosts ? (
        Array.from({length:3}).map((_,i)=> <PostSkeleton key={i} />)
      ) : (
        items.map(it=> <PostCard key={it.id} post={it} onDelete={handleDelete} currentUser={currentUser} />)
      )}
      </div>

      <Modal open={isPostOpen} onClose={closeModal} title={"Créer une publication"} footer={
        <>
          <div className="modal-add-to-post" style={{marginBottom:8, borderTop:'1px solid var(--fb-border)', paddingTop:8, display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:'4px'}}>
            <div className="modal-add-icon" onClick={handlePhotoClick} style={{color:'#45BD62', cursor:'pointer', flex:1, minWidth:'70px', justifyContent:'center', display:'flex', alignItems:'center', gap:8, padding:'8px'}} title="Médias"><i className="fas fa-image"></i> Médias</div>
            <div className="modal-add-icon" onClick={() => setShowTagModal(true)} style={{color:'#0A6BA8', cursor:'pointer', flex:1, minWidth:'70px', justifyContent:'center', display:'flex', alignItems:'center', gap:8, padding:'8px'}} title="Tag"><i className="fas fa-user-tag"></i> Tag</div>
            <div className="modal-add-icon" onClick={() => setShowFeelingModal(true)} style={{color:'#F02849', cursor:'pointer', flex:1, minWidth:'70px', justifyContent:'center', display:'flex', alignItems:'center', gap:8, padding:'8px'}} title="Feelings"><i className="fas fa-face-smile"></i> Feelings</div>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:8, flexWrap:'wrap'}}>
            <button style={{padding:'8px 24px', borderRadius:6, border:'1px solid var(--fb-border)', background:'transparent', cursor:'pointer', fontSize:15, fontWeight:600}} onClick={closeModal}>Annuler</button>
            <button className="btn-post" onClick={()=>handleCreate(postTitle, postContent)} disabled={!postContent.trim() && !selectedImage} style={{flex:'1', minWidth:'80px'}}>Publier</button>
          </div>
        </>
      }>
        <div className="modal-section" style={{marginBottom:16}}>
          <div className="modal-author">
            <div className="modal-author-avatar">{currentUser ? (currentUser.prenom ? `${currentUser.prenom[0]}${(currentUser.nom||'')[0]||''}`.toUpperCase() : (currentUser.nomUtilisateur ? currentUser.nomUtilisateur.slice(0,2).toUpperCase() : (currentUser.email||'')[0] )) : 'JD'}</div>
            <div className="modal-author-meta">
              <div className="modal-author-name">{currentUser ? (currentUser.prenom || currentUser.nomUtilisateur || (currentUser.email||'').split('@')[0]) : 'Jean Dupont'}</div>
              <select className="modal-author-privacy">
                <option>🌍 Public</option>
                <option>👥 Amis</option>
                <option>🔒 Privé</option>
              </select>
            </div>
          </div>
          <textarea value={postContent} onChange={(e)=>setPostContent(e.target.value)} className="post-textarea" placeholder={currentUser ? `Quoi de neuf, ${currentUser.prenom || currentUser.nomUtilisateur || (currentUser.email||'').split('@')[0]} ?` : 'Quoi de neuf ?'} style={{fontSize:16, lineHeight:1.5, width:'100%', boxSizing:'border-box'}}></textarea>
          {selectedImage && <div className="modal-file-preview" style={{position:'relative'}}>
            <img src={selectedImage} alt="preview" className="modal-file-preview-img" />
            {selectedFilesCount > 1 && <div className="modal-file-count">+{selectedFilesCount - 1}</div>}
          </div>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} style={{display:'none'}} multiple />
      </Modal>

      {/* Tag Modal */}
      <Modal open={showTagModal} onClose={() => { setShowTagModal(false); setTagInput(''); }} title="Ajouter un tag">
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Entrez le nom de la personneà tagger"
            onKeyPress={(e) => e.key === 'Enter' && addTagFromModal()}
            style={{
              width:'100%',
              padding:'10px 12px',
              border:'1px solid var(--fb-border)',
              borderRadius:'6px',
              fontSize:'14px',
              boxSizing:'border-box'
            }}
            autoFocus
          />
          <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
            <button
              onClick={() => { setShowTagModal(false); setTagInput(''); }}
              style={{
                padding:'8px 16px',
                border:'1px solid var(--fb-border)',
                borderRadius:'6px',
                background:'transparent',
                cursor:'pointer',
                fontSize:'13px',
                fontWeight:'500'
              }}
            >
              Annuler
            </button>
            <button
              onClick={addTagFromModal}
              disabled={!tagInput.trim()}
              style={{
                padding:'8px 16px',
                border:'none',
                borderRadius:'6px',
                background:'var(--fb-blue)',
                color:'white',
                cursor:tagInput.trim()?'pointer':'not-allowed',
                fontSize:'13px',
                fontWeight:'600',
                opacity:tagInput.trim()?1:0.6
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      </Modal>

      {/* Feeling Modal */}
      <Modal open={showFeelingModal} onClose={() => setShowFeelingModal(false)} title="Sélectionnez votre émotion">
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(80px, 1fr))', gap:'12px'}}>
          {feelings.map((feeling) => (
            <div
              key={feeling.label}
              onClick={() => setFeelingSelected(feeling)}
              style={{
                padding:'12px',
                border:feelingSelected?.label === feeling.label ? '3px solid var(--fb-blue)' : '1px solid var(--fb-border)',
                borderRadius:'8px',
                textAlign:'center',
                cursor:'pointer',
                transition:'all 0.15s',
                background:feelingSelected?.label === feeling.label ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
              }}
            >
              <div style={{fontSize:'32px', marginBottom:'4px'}}>{feeling.emoji}</div>
              <div style={{fontSize:'12px', fontWeight:'500', color:'var(--fb-text)'}}>{feeling.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'16px'}}>
          <button
            onClick={() => setShowFeelingModal(false)}
            style={{
              padding:'8px 16px',
              border:'1px solid var(--fb-border)',
              borderRadius:'6px',
              background:'transparent',
              cursor:'pointer',
              fontSize:'13px',
              fontWeight:'500'
            }}
          >
            Annuler
          </button>
          <button
            onClick={addFeelingFromModal}
            disabled={!feelingSelected}
            style={{
              padding:'8px 16px',
              border:'none',
              borderRadius:'6px',
              background:'var(--fb-blue)',
              color:'white',
              cursor:feelingSelected?'pointer':'not-allowed',
              fontSize:'13px',
              fontWeight:'600',
              opacity:feelingSelected?1:0.6
            }}
          >
            Ajouter
          </button>
        </div>
      </Modal>

      {/* Text Publication Modal */}
      <Modal open={showTextPublicationModal} onClose={resetTextPublicationModal} title="Créer une publication texte">
        <div style={{display:'flex',gap:'20px',maxHeight:'600px'}}>
          {/* Preview */}
          <div style={{flex:'0 0 300px',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{
              width:'100%',
              height:'400px',
              background: textPubBgType === 'color' ? textPubBgColor : '#f0f0f0',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius:'12px',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              padding:'16px',
              boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
              position:'relative',
              overflow:'hidden'
            }}>
              <div style={{
                color: textPubTextColor,
                fontSize:'18px',
                textAlign:'center',
                fontWeight:'600',
                maxWidth:'90%',
                wordWrap:'break-word'
              }}>
                {textPubContent}
              </div>
            </div>
            <div className="action-buttons" style={{display:'flex',gap:'8px',marginTop:'10px',justifyContent:'center',width:'100%'}}>
              <button type="button" onClick={resetTextPublicationModal} style={{padding:'8px 12px',background:'var(--fb-bg)',border:'1px solid var(--fb-border)',borderRadius:'8px',cursor:'pointer',fontWeight:'500',fontSize:'13px',transition:'all 0.15s'}}>Annuler</button>
              <button type="button" onClick={handleCreateTextPublication} style={{padding:'8px 12px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600',fontSize:'13px',transition:'all 0.15s'}}>Publier</button>
            </div>
          </div>

          {/* Controls */}
          <div style={{flex:1,overflowY:'auto',paddingRight:'8px'}}>
            <div style={{marginBottom:'16px'}}>
              <textarea
                placeholder="Écrivez votre texte..."
                value={textPubContent}
                onChange={(e)=>setTextPubContent(e.target.value)}
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
                {textPubContent.length}/200
              </div>
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Arrière-plan</label>
              <div style={{display:'flex',gap:'8px'}}>
                <button type="button" onClick={()=>setTextPubBgType('color')} style={{flex:1,padding:'8px',background:textPubBgType==='color'?'var(--fb-blue)':'var(--fb-bg)',color:textPubBgType==='color'?'white':'var(--fb-text)',border:'1px solid var(--fb-border)',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'500',transition:'all 0.15s'}}>Couleur</button>
                <button type="button" onClick={()=>setTextPubBgType('image')} style={{flex:1,padding:'8px',background:textPubBgType==='image'?'var(--fb-blue)':'var(--fb-bg)',color:textPubBgType==='image'?'white':'var(--fb-text)',border:'1px solid var(--fb-border)',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'500',transition:'all 0.15s'}}>Image</button>
              </div>
            </div>

            {textPubBgType==='color' && (
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Couleur du fond</label>
                <input type="color" value={textPubBgColor} onChange={e=>setTextPubBgColor(e.target.value)} style={{width:'100%',height:'32px',border:'none',padding:0}} />
              </div>
            )}

            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Couleur du texte</label>
              <input type="color" value={textPubTextColor} onChange={e=>setTextPubTextColor(e.target.value)} style={{width:'100%',height:'32px',border:'none',padding:0}} />
            </div>
          </div>
        </div>
      </Modal>

    </div>
  )
}
