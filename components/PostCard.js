import { useEffect, useState, useRef } from 'react'

export default function PostCard({ post, onDelete, currentUser }){
  // figure out who is currently logged in (same helper used elsewhere)
  const currentUserName = (() => {
    try{
      const userStr = localStorage.getItem('user')||''
      if(userStr){
        const u = JSON.parse(userStr)
        return u.prenom || u.nomUtilisateur || (u.email||'').split('@')[0]
      }
    }catch(e){}
    return null
  })()

  const isAuthor = currentUserName && post.author === currentUserName

  const [saved, setSaved] = useState(false)

  function toggleSave(){
    setSaved(v=>{
      const newVal = !v;
      try{
        const arr = JSON.parse(localStorage.getItem('savedPosts')||'[]');
        let updated;
        if(newVal){
          updated = [...new Set([...arr, post.id])];
        } else {
          updated = arr.filter(x=>x!==post.id);
        }
        localStorage.setItem('savedPosts', JSON.stringify(updated));
      }catch(e){ }
      return newVal;
    });
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [friends, setFriends] = useState([])
  const [shareTargetType, setShareTargetType] = useState('friend')
  const groups = [{id:1,name:'Famille'},{id:2,name:'Collègues'}]
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState(post.commentsList || [])
  const [commentInput, setCommentInput] = useState('')
  const commentInputRef = useRef(null)
  const [replyTo, setReplyTo] = useState(null) // comment id being replied to
  const [commentLikes, setCommentLikes] = useState({}) // track liked comments locally
  // liked is derived from reactionType for clarity
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes || 0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [reactionType, setReactionType] = useState(post.reactionType || null) // current reaction type
  const [reactionHistory, setReactionHistory] = useState([]) // array of recent types
  const wrapperRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  const cardRef = useRef(null)

  // close menu when clicking outside this post card
  useEffect(() => {
    const handler = e => {
      if (menuOpen && cardRef.current && !cardRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // when the dropdown menu is open on small screens, prevent body scroll
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    // cleanup handled above
  }, [menuOpen])

  useEffect(()=>{
    // Load comments from server if post.id exists and no inlined comments
    if((!post.commentsList || post.commentsList.length===0) && post.id){
      fetch(`/api/items/${post.id}/comments`).then(r=>r.json()).then(data=>setComments(data)).catch(()=>{})
    }
    // hydrate reaction state from localStorage (client side only)
    if(post.id){
      try{
        const stored = JSON.parse(localStorage.getItem('postReactions')||'{}');
        const saved = stored[post.id];
        if(saved){
          setReactionType(saved.type);
          setLiked(!!saved.liked);
          // assuming server count already reflects user like; no adjustment
        }
      }catch(e){ }
    }
    // hydrate saved status
    try{
      const arr = JSON.parse(localStorage.getItem('savedPosts')||'[]');
      setSaved(arr.includes(post.id));
    }catch(e){}
  },[post.id])

  function toggleComments(){ setCommentsOpen(v=>!v) }

  function handleReply(comment){
    // open commenting area and prepare reply
    setReplyTo(comment);
    const prefix = `@${comment.author || ''} `;
    setCommentInput(prefix);
    if(!commentsOpen) setCommentsOpen(true);
    // focus input after it becomes visible
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 0);
  }

  useEffect(()=>{
    if(shareOpen){
      try {
        const userStr = localStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : null
        const userEmail = user?.email
        if (userEmail) {
          fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}`)
            .then(r=>r.json())
            .then(d=>setFriends(d.amis || []))
            .catch(()=>{})
        }
      } catch (e) {
        console.error('Error loading friends:', e)
      }
    }
  },[shareOpen])

  async function toggleCommentLike(comment){
    const already = commentLikes[comment.id];
    const newVal = !already;
    setCommentLikes(prev => ({...prev, [comment.id]: newVal}))
    // optimistic UI
    setComments(prev => prev.map(c => c.id===comment.id ? {...c, likes: (c.likes||0) + (newVal?1:-1)} : c))
    if(post.id && comment.id){
      try{
        await fetch(`/api/items/${post.id}/comments/${comment.id}/reactions`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: newVal ? 'like' : 'unlike' }) })
      }catch(e){ console.error('comment like error', e) }
    }
  }

  async function submitComment(){
    let text = commentInput.trim();
    if(!text) return;
    let parentId = null;
    if(replyTo){
      // prefix text to indicate reply if not already added
      const mention = `@${replyTo.author || ''}`;
      if(!text.startsWith(mention)){
        text = `${mention} ${text}`;
      }
      parentId = replyTo.id;
    }
    if(post.id){
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'
      const bodyPayload = { author: authorName, text };
      if(parentId) bodyPayload.parentId = parentId;
      const res = await fetch(`/api/items/${post.id}/comments`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(bodyPayload) })
      if(res.ok){
        const created = await res.json()
        setComments(prev => [...prev, created])
        setCommentInput('')
        setReplyTo(null)
        if(!commentsOpen) setCommentsOpen(true)
      }
    } else {
      // fallback local
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'
      const initials = localUser ? (localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}`.toUpperCase() : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'
      const newC = { author: authorName, initials, color: 'linear-gradient(135deg,#0B3D91,#082B60)', text, likes: 0 }
      setComments(prev => [...prev, newC])
      setCommentInput('')
      if(!commentsOpen) setCommentsOpen(true)
    }
  }

  function handleKey(e){ if(e.key === 'Enter'){ e.preventDefault(); submitComment() } }

  async function handleReaction(type = 'like'){
    // type identifies which emoji
    const isCurrently = reactionType === type
    const newLiked = !isCurrently
    const newType = newLiked ? type : null
    setReactionType(newType)
    setLiked(newLiked)
    setLikesCount(c=> newLiked ? c+1 : Math.max(0,c-1))
    // update history: place like at front always if type is like
    if(newLiked){
      setReactionHistory(prev=>{
        let filtered = prev.filter(t=>t!==type);
        if(type==='like') filtered = filtered.filter(t=>t!=='like');
        const arr = [type, ...filtered];
        return arr.slice(0,3);
      });
    }
    if(post.id && !String(post.id).startsWith('temp-')){
      try{
        await fetch(`/api/items/${post.id}/reactions`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: newLiked ? 'like' : 'unlike' }) })
      }catch(e){ console.error('reaction API error', e) }
    }
    // persist locally
    if(post.id){
      try{
        const stored = JSON.parse(localStorage.getItem('postReactions')||'{}');
        stored[post.id] = { liked: newLiked, type: newType, history: newLiked ? ([type, ...(reactionHistory.filter(t=>t!==type))].slice(0,3)) : [] };
        localStorage.setItem('postReactions', JSON.stringify(stored));
      }catch(e){}
    }
  }

  // manage picker open/close properly
  const openPicker = () => {
    clearTimeout(hideTimeoutRef.current)
    setPickerOpen(true)
  }
  const closePicker = () => {
    hideTimeoutRef.current = setTimeout(()=>setPickerOpen(false), 300)
  }

  return (
    <article ref={cardRef} className="card post-card" id={`post-${post.id}` }>
      <div className="post-header">
        <div className="post-author">
          <div className="avatar-placeholder post-avatar-placeholder" style={{background: post.color}}>{post.initials}</div>
          <div className="post-author-info">
            <span className="post-author-name">{post.author}</span>
            <div className="post-meta"><span>{post.date}</span><span> · </span><i className={`fas fa-${post.privacy || 'globe'}`} style={{fontSize:12}}></i></div>
          </div>
        </div>
        <div style={{display:'flex',gap:4,position:'relative'}}>
          <button className="post-actions-btn" onClick={()=>setMenuOpen(v=>!v)}><i className="fas fa-ellipsis-h"></i></button>
          {menuOpen && (
            <div className="post-menu">
              <div className="post-menu-item" onClick={()=>{toggleSave(); setMenuOpen(false)}}><i className={`fa${saved?'s':'r'} fa-bookmark`}></i> {saved?'Enregistré':'Enregistrer la publication'}</div>
              <div className="post-menu-item" onClick={()=>{console.log('toggle notifications'); setMenuOpen(false)}}><i className="fas fa-bell"></i> Activer les notifications</div>
              <div className="post-menu-item separator"></div>
              {isAuthor && (
                <>
                  <div className="post-menu-item" onClick={()=>{ /* edit perhaps*/ setMenuOpen(false)}}><i className="fas fa-edit"></i> Modifier</div>
                  <div className="post-menu-item" onClick={()=>{onDelete?.(post.id); setMenuOpen(false)}}><i className="fas fa-trash"></i> Supprimer</div>
                  <div className="post-menu-item separator"></div>
                </>
              )}
              <div className="post-menu-item" onClick={()=>{setShareOpen(true); setMenuOpen(false)}}><i className="fas fa-share"></i> Partager...</div>
              <div className="post-menu-item" onClick={()=>{console.log('hide'); setMenuOpen(false)}}><i className="fas fa-eye-slash"></i> Masquer la publication</div>
              <div className="post-menu-item" onClick={()=>{console.log('unfollow'); setMenuOpen(false)}}><i className="fas fa-user-slash"></i> Ne plus suivre {post.author}</div>
              <div className="post-menu-item" onClick={()=>{console.log('why see'); setMenuOpen(false)}}><i className="fas fa-question-circle"></i> Pourquoi je vois ça ?</div>
              {!isAuthor && (
                <div className="post-menu-item" onClick={()=>{console.log('report'); setMenuOpen(false)}}><i className="fas fa-flag"></i> Signaler</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="post-content">{post.content}</div>
      {shareOpen && (
        <div className="share-modal-overlay" onClick={()=>setShareOpen(false)}>
          <div className="share-modal-card" onClick={(e)=>e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Partager la publication</h3>
              <button className="share-modal-close" onClick={()=>setShareOpen(false)}>✖</button>
            </div>
            <div className="share-modal-tabs">
              <button className={`share-tab ${shareTargetType==='friend'?'active':''}`} onClick={()=>setShareTargetType('friend')}><i className="fas fa-envelope"></i> Message privé</button>
              <button className={`share-tab ${shareTargetType==='group'?'active':''}`} onClick={()=>setShareTargetType('group')}><i className="fas fa-users"></i> Groupe</button>
            </div>
            <div className="share-modal-list">
              {shareTargetType==='friend' ? (
                friends.length > 0 ? (
                  friends.map(f=>(
                    <div key={f.id} className="share-item" onClick={async ()=>{
                      try{
                        const res = await fetch(`/api/messages/create`, {
                          method: 'POST',
                          headers: {'Content-Type':'application/json'},
                          body: JSON.stringify({
                            recipientId: f.id,
                            sharedPostId: post.id,
                            message: `${post.author} a partagé: ${post.content?.substring(0,100)}...`
                          })
                        });
                        if(res.ok){
                          setShareOpen(false);
                        }
                      }catch(e){ console.error('share error', e) }
                    }}>
                      <div className="share-item-avatar" style={{background:f.color||'#0B3D91'}}>{(f.prenom?f.prenom[0]:'')+(f.nom?f.nom[0]:'')}</div>
                      <span className="share-item-name">{f.prenom} {f.nom}</span>
                    </div>
                  ))
                ) : (
                  <div className="share-empty">Chargement des amis...</div>
                )
              ) : (
                groups.map(g=>(
                  <div key={g.id} className="share-item" onClick={async ()=>{
                    try{
                      const res = await fetch(`/api/items/${post.id}/share`, {
                        method: 'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({
                          groupId: g.id
                        })
                      });
                      if(res.ok){
                        setShareOpen(false);
                      }
                    }catch(e){ console.error('share error', e) }
                  }}>
                    <div className="share-item-icon"><i className="fas fa-users"></i></div>
                    <span className="share-item-name">{g.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {post.image && (
        (typeof post.image === 'string' && (post.image.indexOf('data:') === 0 || post.image.indexOf('http') === 0))
        ? <div className="post-image" style={{marginTop:12}}><img src={post.image} alt="post" style={{width:'100%',borderRadius:8}}/></div>
        : <div className="post-image-placeholder" style={{background:post.imageBg}}>{post.image}</div>
      )}
      <div className="engagement-bar">
        <div className="reactions-count">
          {likesCount > 0 && reactionHistory.length > 0 && (() => {
              // ensure like is always first if it exists
              let disp = [...reactionHistory];
              if(disp.includes('like')){
                disp = ['like', ...disp.filter(t=>t!=='like')];
              }
              return (
                <div className="reaction-icons">
                  {disp.slice(0,3).map((t,i)=>(
                    <div key={i} className="reaction-icon" style={{background: t==='like' ? '#0B3D91' : t==='love' ? '#F33E58' : t==='laugh' ? '#F7B125' : t==='wow' ? '#FFA500' : t==='sad' ? '#8B4513' : t==='angry' ? '#FF0000' : '#ccc',fontSize:10}}>
                      {t==='like' ? '👍' : t==='love' ? '❤️' : t==='laugh' ? '😂' : t==='wow' ? '😮' : t==='sad' ? '😢' : t==='angry' ? '😡' : ''}
                    </div>
                  ))}
                </div>
              )
            })()}
          <span>{likesCount}</span>
        </div>
        <div className="engagement-right">
          <span style={{cursor:'pointer'}} onClick={toggleComments}>{comments.length} commentaires</span>
          <span>{post.shares || 0} partages</span>
        </div>
      </div>

      <div className="action-bar">
        <div ref={wrapperRef} style={{position:'relative',flex:1}} onMouseEnter={openPicker} onMouseLeave={closePicker}>
          <button className={`action-btn ${reactionType==='like' ? 'liked':''}`} onClick={()=>handleReaction('like')}><i className="fas fa-thumbs-up"></i><span style={{marginLeft:6}}>J'aime</span></button>
          <div className={`reaction-picker ${pickerOpen ? 'visible':''}`} style={{pointerEvents: pickerOpen ? 'auto' : 'none'}} onMouseEnter={openPicker} onMouseLeave={closePicker}>
            <span className="reaction-emoji" onClick={()=>handleReaction('like')} style={{transform: pickerOpen ? 'scale(1)' : 'scale(0)'}}>👍</span>
            <span className="reaction-emoji" onClick={()=>handleReaction('love')} style={{transform: pickerOpen ? 'scale(1)' : 'scale(0)'}}>❤️</span>
            <span className="reaction-emoji" onClick={()=>handleReaction('laugh')} style={{transform: pickerOpen ? 'scale(1)' : 'scale(0)'}}>😂</span>
            <span className="reaction-emoji" onClick={()=>handleReaction('wow')} style={{transform: pickerOpen ? 'scale(1)' : 'scale(0)'}}>😮</span>
            <span className="reaction-emoji" onClick={()=>handleReaction('sad')} style={{transform: pickerOpen ? 'scale(1)' : 'scale(0)'}}>😢</span>
            <span className="reaction-emoji" onClick={()=>handleReaction('angry')} style={{transform: pickerOpen ? 'scale(1)' : 'scale(0)'}}>😡</span>
          </div>
        </div>
        <button className="action-btn" onClick={toggleComments}><i className="fas fa-comment-alt"></i> Commenter</button>
        <button className="action-btn" onClick={()=>setShareOpen(true)}><i className="fas fa-share"></i> Partager</button>
      </div>

      <div className={`comments-section ${commentsOpen ? 'open':''}`}>
        <div className="comment-input-row">
          <div className="avatar-placeholder" style={{width:32,height:32,fontSize:12,flexShrink:0}}>{currentUser ? (currentUser.prenom ? `${currentUser.prenom[0]}${(currentUser.nom||'')[0]||''}`.toUpperCase() : (currentUser.nomUtilisateur ? currentUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'}</div>
          <input className="comment-input" placeholder="Écrire un commentaire..." value={commentInput} onChange={e=>setCommentInput(e.target.value)} onKeyPress={handleKey} />
          <button className="btn comment-send-btn" style={{marginLeft:8,padding:'6px 12px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600}} onClick={submitComment}>Envoyer</button>
        </div>
        <div>
          {/** render top-level comments with replies nested */}
          {comments.filter(c=>!c.parentId).map((c,i)=>{
            const replies = comments.filter(r=>r.parentId===c.id);
            return (
              <div key={c.id || i} style={{marginBottom:8}}>
                <div className="comment">
                  <div className="avatar-placeholder post-avatar-placeholder" style={{background:c.color || 'linear-gradient(135deg,#667eea,#764ba2)',width:32,height:32,fontSize:12,flexShrink:0}}>{(c.initials) || (c.author ? c.author.split(' ').map(w=>w[0]).join('') : 'JD')}</div>
                  <div style={{flex:1}}>
                    <div className="comment-bubble">
                      <div className="comment-author">{c.author}</div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                    <div className="comment-actions">
                      <span className="comment-action" onClick={()=>toggleCommentLike(c)}>J'aime</span>
                      <span className="comment-action" onClick={()=>handleReply(c)}>Répondre</span>
                      <span style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{c.likes || 0} J'aime</span>
                    </div>
                  </div>
                </div>
                {replies.length > 0 && replies.map((r, j)=>(
                  <div key={r.id || j} style={{marginLeft:40}}>
                    <div className="comment">
                      <div className="avatar-placeholder post-avatar-placeholder" style={{background:r.color || 'linear-gradient(135deg,#667eea,#764ba2)',width:32,height:32,fontSize:12,flexShrink:0}}>{(r.initials) || (r.author ? r.author.split(' ').map(w=>w[0]).join('') : 'JD')}</div>
                      <div style={{flex:1}}>
                        <div className="comment-bubble">
                          <div className="comment-author">{r.author}</div>
                          <div className="comment-text">{r.text}</div>
                        </div>
                        <div className="comment-actions">
                          <span className="comment-action" onClick={()=>toggleCommentLike(r)}>J'aime</span>
                          <span className="comment-action" onClick={()=>handleReply(r)}>Répondre</span>
                          <span style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{r.likes || 0} J'aime</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}
