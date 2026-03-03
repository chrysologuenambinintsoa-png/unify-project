import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('Publications')
  const [openMenu, setOpenMenu] = useState(null)
  const chevronMenuRef = useRef(null)
  const ellipsisMenuRef = useRef(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      try {
        const parsed = JSON.parse(u)
        setUser(parsed)
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (chevronMenuRef.current && !chevronMenuRef.current.contains(e.target)) {
        if (openMenu === 'chevron') setOpenMenu(null)
      }
      if (ellipsisMenuRef.current && !ellipsisMenuRef.current.contains(e.target)) {
        if (openMenu === 'ellipsis') setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenu])

  function getInitials() {
    if (!user) return 'U'
    if (user.prenom && user.nom) return (user.prenom[0] + user.nom[0]).toUpperCase()
    if (user.prenom) return user.prenom[0].toUpperCase()
    if (user.nom) return user.nom[0].toUpperCase()
    return 'U'
  }

  function handleProfilePictureChange() {
    alert('Modifier la photo de profil (non implémenté)')
  }

  function handleEditProfile() {
    setEditMode(!editMode)
  }

  function handleLogout() {
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('userUpdated'))
    router.push('/auth')
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        Aucun utilisateur connecté. <button onClick={() => router.push('/auth')}>Se connecter</button>
      </div>
    )
  }

  return (
    <div>
      {/* PROFILE HEADER */}
      <div className="card" style={{ marginBottom: 0, borderRadius: '8px 8px 0 0', overflow: 'visible' }}>
        <div className="profile-cover">
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg,#0B3D91 0%,#082B60 50%,#0B3D91 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
            opacity: 0.3
          }}>🌊</div>
          <div className="profile-cover-actions">
            <button className="btn-secondary" style={{ background: 'rgba(255,255,255,.9)' }}>
              <i className="fas fa-camera"></i> Modifier la photo de couverture
            </button>
          </div>
        </div>

        <div className="profile-info-section">
          <div className="profile-top">
            {/* AVATAR */}
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">{getInitials()}</div>
              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 36,
                height: 36,
                background: 'var(--fb-bg)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '3px solid white'
              }} onClick={handleProfilePictureChange}>
                <i className="fas fa-camera" style={{ fontSize: 14 }}></i>
              </div>
            </div>

            {/* NAME AREA */}
            <div className="profile-name-area">
              <div className="profile-name">{user.prenom} {user.nom}</div>
              <div className="profile-friends-count">{user.amis || '0'} amis</div>
              <div style={{ display: 'flex', marginTop: 8 }}>
                <div style={{ display: 'flex', marginLeft: -8 }}>
                  {/* Friends avatars placeholder */}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="profile-action-btns">
              <button className="btn-primary">
                <i className="fas fa-plus"></i> Ajouter à la story
              </button>
              <button className="btn-secondary" onClick={handleEditProfile}>
                <i className="fas fa-pen"></i> Modifier le profil
              </button>
              <div style={{ position: 'relative' }} ref={chevronMenuRef}>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '8px 10px' }}
                  onClick={() => setOpenMenu(openMenu === 'chevron' ? null : 'chevron')}
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
                {openMenu === 'chevron' && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 8,
                    background: 'white',
                    borderRadius: 8,
                    boxShadow: '0 2px 12px rgba(0,0,0,.15)',
                    minWidth: 240,
                    zIndex: 200
                  }}>
                    <div style={{ padding: '8px' }}>
                      <div style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 15,
                        borderRadius: 6,
                        transition: 'background .15s'
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                        setOpenMenu(null)
                      }}>
                        <i className="fas fa-copy" style={{ marginRight: 8 }}></i>Copier le lien
                      </div>
                      <div style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 15,
                        borderRadius: 6,
                        transition: 'background .15s'
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => setOpenMenu(null)}>
                        <i className="fas fa-lock" style={{ marginRight: 8 }}></i>Confidentialité
                      </div>
                      <div style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 15,
                        borderRadius: 6,
                        transition: 'background .15s'
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => setOpenMenu(null)}>
                        <i className="fas fa-image" style={{ marginRight: 8 }}></i>Photos
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="profile-tabs">
            {['Publications', 'À propos', 'Amis', 'Photos', 'Vidéos', 'Plus'].map(tab => (
              <div
                key={tab}
                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ cursor: 'pointer' }}
              >
                {tab}
              </div>
            ))}
            <div style={{ marginLeft: 'auto', marginBottom: 4, position: 'relative' }} ref={ellipsisMenuRef}>
              <button 
                className="btn-secondary" 
                style={{ padding: '6px 10px' }}
                onClick={() => setOpenMenu(openMenu === 'ellipsis' ? null : 'ellipsis')}
              >
                <i className="fas fa-ellipsis-h"></i>
              </button>
              {openMenu === 'ellipsis' && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: 'white',
                  borderRadius: 8,
                  boxShadow: '0 2px 12px rgba(0,0,0,.15)',
                  minWidth: 200,
                  zIndex: 200
                }}>
                  <div style={{ padding: '8px' }}>
                    <div style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: 15,
                      borderRadius: 6,
                      transition: 'background .15s'
                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setOpenMenu(null)}>
                      <i className="fas fa-images" style={{ marginRight: 8 }}></i>Diaporama
                    </div>
                    <div style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: 15,
                      borderRadius: 6,
                      transition: 'background .15s'
                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setOpenMenu(null)}>
                      <i className="fas fa-thumbtack" style={{ marginRight: 8 }}></i>Épingler
                    </div>
                    <div style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: 15,
                      borderRadius: 6,
                      transition: 'background .15s'
                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setOpenMenu(null)}>
                      <i className="fas fa-eye-slash" style={{ marginRight: 8 }}></i>Masquer
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PROFILE CONTENT */}
      <div className="profile-content">
        {/* LEFT SIDEBAR - hidden for Publications so posts use full width */}
        {activeTab !== 'Publications' && (
          <div className="profile-left">
            {/* Show Info only when À propos tab selected */}
            {activeTab === "À propos" && (
              <div className="info-card">
                <h3>Infos</h3>
                {!editMode ? (
                  <div>
                    {user.metier && <div className="info-item">
                      <i className="fas fa-briefcase"></i>
                      <span>Travaille chez <strong>{user.metier}</strong></span>
                    </div>}
                    {user.ecole && <div className="info-item">
                      <i className="fas fa-graduation-cap"></i>
                      <span>A étudié à <strong>{user.ecole}</strong></span>
                    </div>}
                    {user.ville && <div className="info-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>Habite à <strong>{user.ville}</strong></span>
                    </div>}
                    {user.originaire && <div className="info-item">
                      <i className="fas fa-home"></i>
                      <span>Originaire de <strong>{user.originaire}</strong></span>
                    </div>}
                    {user.relation && <div className="info-item">
                      <i className="fas fa-heart"></i>
                      <span><strong>{user.relation}</strong></span>
                    </div>}
                    {user.membre && <div className="info-item">
                      <i className="fas fa-globe"></i>
                      <span>Membre depuis <strong>{user.membre}</strong></span>
                    </div>}
                    {!user.metier && !user.ecole && !user.ville && !user.originaire && !user.relation && !user.membre && (
                      <p style={{ color: 'var(--fb-text-secondary)', textAlign: 'center', padding: '12px 0' }}>Aucune information pour le moment</p>
                    )}
                    <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={handleEditProfile}>
                      Modifier les infos
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>Édition des informations (fonctionnalité prochainement disponible)</p>
                    <button className="btn-secondary" onClick={() => setEditMode(false)}>Fermer</button>
                  </div>
                )}
              </div>
            )}

            {/* Show Photos when Photos tab selected */}
            {activeTab === 'Photos' && (
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Photos</h3>
                  <span style={{ color: 'var(--fb-blue)', fontSize: 15, cursor: 'pointer' }}>Voir tout</span>
                </div>
                <div style={{ padding: 0 }}>
                  {user.photos && user.photos.length > 0 ? (
                    <div className="photos-grid">
                      {user.photos.map((p, i) => (
                        <div key={i} className="photo-thumb"><img src={p} alt={`photo-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--fb-text-secondary)' }}>Aucune photo pour le moment</div>
                  )}
                </div>
              </div>
            )}

            {/* Show Friends when Amis tab selected */}
            {activeTab === 'Amis' && (
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Amis <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--fb-text-secondary)' }}>{user.amisList ? user.amisList.length : 0}</span></h3>
                  <span style={{ color: 'var(--fb-blue)', fontSize: 15, cursor: 'pointer' }}>Voir tout</span>
                </div>
                <div style={{ padding: 0 }}>
                  {user.amisList && user.amisList.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {user.amisList.map((f, idx) => (
                        <div key={idx} style={{ textAlign: 'center', cursor: 'pointer' }}>
                          <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 24, marginBottom: 6 }}>{(f.prenom ? f.prenom[0] : 'U') + (f.nom ? f.nom[0] : '')}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{f.prenom} {f.nom}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--fb-text-secondary)' }}>Les amis ajoutés apparaîtront ici</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT SIDEBAR */}
        <div className="profile-right">
          {/* Render main tab content */}
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            {activeTab === 'Publications' && (
              <div>
                {/* CREATE POST inside Publications */}
                <div className="card create-post" style={{ marginBottom: 12 }}>
                  <div className="create-post-top">
                    {user && (user.avatarUrl || user.avatar) ? (
                    <img src={user.avatarUrl || user.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
                  ) : (
                    <div className="avatar-placeholder" style={{ width: 40, height: 40, flexShrink: 0 }}>
                      {getInitials()}
                    </div>
                  )}
                    <div className="create-post-input">Quoi de neuf, {user.prenom} ?</div>
                  </div>
                  <div className="create-post-divider"></div>
                  <div className="create-post-actions">
                    <button className="create-post-btn"><i className="fas fa-video"></i> Vidéo en direct</button>
                    <button className="create-post-btn"><i className="fas fa-image"></i> Photo/vidéo</button>
                    <button className="create-post-btn"><i className="fas fa-face-smile"></i> Activité</button>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 8px 0' }}>Publications</h3>
                <div style={{ color: 'var(--fb-text-secondary)' }}>Les publications de l'utilisateur s'afficheront ici.</div>
              </div>
            )}

            {activeTab === "À propos" && (
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>À propos</h3>
                <div style={{ color: 'var(--fb-text-secondary)' }}>
                  <p><strong>Travail :</strong> {user.metier || 'Non renseigné'}</p>
                  <p><strong>Études :</strong> {user.ecole || 'Non renseigné'}</p>
                  <p><strong>Ville :</strong> {user.ville || 'Non renseigné'}</p>
                  <p><strong>Originaire de :</strong> {user.originaire || 'Non renseigné'}</p>
                </div>
              </div>
            )}

            {activeTab === 'Photos' && (
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Photos</h3>
                <div className="photos-grid">
                  {/* If user.photos array exists, map it, otherwise show placeholder */}
                  {user.photos && user.photos.length > 0 ? (
                    user.photos.map((p, i) => (
                      <div key={i} className="photo-thumb"><img src={p} alt={`photo-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                    ))
                  ) : (
                    <div style={{ padding: 16, color: 'var(--fb-text-secondary)' }}>Aucune photo pour le moment</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Vidéos' && (
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Vidéos</h3>
                <div style={{ color: 'var(--fb-text-secondary)' }}>Aucune vidéo pour le moment</div>
              </div>
            )}

            {activeTab === 'Amis' && (
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Amis</h3>
                {user.amisList && user.amisList.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {user.amisList.map((f, idx) => (
                      <div key={idx} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 24, marginBottom: 6 }}>{(f.prenom ? f.prenom[0] : 'U') + (f.nom ? f.nom[0] : '')}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{f.prenom} {f.nom}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--fb-text-secondary)' }}>Aucun ami pour le moment</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
