export default function CreatePost({ onOpen, user, onOpenTextPublication }){
  const name = user?.prenom || user?.nomUtilisateur || (user?.email ? user.email.split('@')[0] : 'Jean')
  const initials = user?.prenom ? `${user.prenom[0]}${(user.nom||'')[0] || ''}`.toUpperCase() : (user?.nomUtilisateur ? user.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')

  return (
    <div className="card create-post">
      <div className="create-post-top">
        <div className="avatar-placeholder" style={{width:40,height:40}}>{initials}</div>
        <div className="create-post-input" onClick={onOpen}>Quoi de neuf, {name} ?</div>
      </div>
      <div className="create-post-divider"></div>
      <div className="create-post-actions">
        <button className="create-post-btn"><i className="fas fa-video"></i> Vidéo en direct</button>
        <button className="create-post-btn" onClick={onOpen}><i className="fas fa-image"></i> Photo/vidéo</button>
        <button className="create-post-btn" onClick={onOpenTextPublication}><i className="fas fa-pen"></i> Texte</button>
      </div>
    </div>
  )
}
