import { useState, useEffect } from 'react'
import Modal from './Modal'

export default function Settings(){
  const [active, setActive] = useState('privacy')
  const [userInfo, setUserInfo] = useState({})
  const [userSettings, setUserSettings] = useState({})

  // utility helpers
  const getSetting = (path, defaultVal) => {
    let val = userSettings
    for (const p of path) {
      if (val && val[p] !== undefined) val = val[p]
      else return defaultVal
    }
    return val
  }

  const saveUser = async (updates) => {
    const u = JSON.parse(localStorage.getItem('user')||'null')
    if (u?.email) {
      try {
        const res = await fetch('/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: u.email, ...updates })
        })
        const data = await res.json()
        if (data.user) {
          setUserInfo(data.user)
          setUserSettings(data.user.settings || {})
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            prenom: data.user.prenom,
            nom: data.user.nom,
            nomUtilisateur: data.user.nomUtilisateur,
            avatar: data.user.avatar
          }))
          window.dispatchEvent(new Event('userUpdated'))
        }
      } catch (err) {
        console.error('Failed to save user', err)
      }
    }
  }

  const toggleSetting = (section, key) => {
    setUserSettings(prev => {
      const updated = { ...prev }
      if (!updated[section]) updated[section] = {}
      updated[section][key] = !updated[section][key]
      saveUser({ settings: updated })
      return updated
    })
  }

  const editSettingStr = (path, promptText) => {
    // open modal editor instead of prompt
    handleModifySetting(path, promptText)
  }

  const editProfileField = (field, label) => {
    // open modal editor instead of prompt
    handleModifyProfile(field, label)
  }

  // Action handlers for various buttons
  const handleModifyProfile = (field, label) => {
    // open modal to edit profile field
    setModalMode('profile')
    setModalTitle(label)
    setModalField(field)
    setModalInput(field === 'name' ? (userInfo.prenom ? `${userInfo.prenom} ${userInfo.nom || ''}` : '') : (userInfo[field] || ''))
    setModalOpen(true)
  }

  const handleModifySetting = (path, label) => {
    setModalMode('setting')
    setModalTitle(label)
    setModalPath(path)
    const cur = getSetting(path, '')
    setModalInput(Array.isArray(cur) ? cur.join(', ') : cur)
    // Check if this is an audience setting (should show dropdown)
    const isAudience = path.some(p => ['futurePosts','friendRequests','friendList','reviewPosts'].includes(p))
    if (isAudience) {
      setDropdownPath(path)
    } else {
      setModalIsAudience(false)
      setModalOpen(true)
    }
  }

  const handleVerify = (path, label) => {
    // open modal to confirm verification and show timestamp
    setModalMode('verify')
    setModalTitle(label)
    setModalPath(path)
    setModalInput(`Dernière vérification: ${new Date().toLocaleString()}`)
    setModalOpen(true)
  }

  const handleManage = (area) => {
    // open modal for management actions (ads or blocked lists)
    setModalMode('manage')
    setModalArea(area)
    if (area === 'ads') {
      setModalTitle('Gérer vos centres d\'intérêt')
      const cur = getSetting(['ads','interests'], [])
      setModalInput(Array.isArray(cur) ? cur.join(', ') : cur || '')
    } else if (area === 'blocked') {
      setModalTitle('Gérer les personnes bloquées')
      const cur = getSetting(['blocking','blockedUsers'], [])
      setModalInput(Array.isArray(cur) ? cur.join(', ') : cur || '')
    } else {
      setModalTitle('Gérer')
      setModalInput('')
    }
    setModalOpen(true)
  }

  const handleConsult = (area) => {
    setModalMode('consult')
    setModalArea(area)
    if (area === 'ads') {
      setModalTitle('Centres d\'intérêt')
      const v = getSetting(['ads','interests'], [])
      setModalInput(Array.isArray(v) ? v.join(', ') : (v || ''))
    } else {
      setModalTitle('Consulter')
      setModalInput('Aucune donnée disponible')
    }
    setModalOpen(true)
  }

  const handleChangePassword = () => {
    // open modal to request password change (server implementation required)
    setModalMode('changePassword')
    setModalTitle('Changer le mot de passe')
    setModalInput('')
    setModalOpen(true)
  }

  const handleManage2FA = () => {
    // open modal to toggle 2FA
    setModalMode('2fa')
    setModalTitle('Authentification à deux facteurs')
    setModalInput(getSetting(['security','twoFactor'], false) ? 'Activée' : 'Désactivée')
    setModalOpen(true)
  }

  const handleVerifyDevices = async () => {
    // show devices in modal instead of alert
    const devices = getSetting(['security','devices'], [])
    setModalMode('consult')
    setModalTitle('Appareils récents')
    setModalInput((devices && devices.length) ? devices.join('\n') : 'Aucun appareil enregistré.')
    setModalOpen(true)
  }

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')||'null')
    if (u?.email) {
      fetch(`/api/user?userEmail=${u.email}`)
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUserInfo(d.user)
            setUserSettings(d.user.settings || {})
          }
        })
    }
  }, [])

  // modal state for inline editors
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalInput, setModalInput] = useState('')
  const [modalMode, setModalMode] = useState('')
  const [modalPath, setModalPath] = useState(null)
  const [modalField, setModalField] = useState(null)
  const [modalArea, setModalArea] = useState(null)
  const [modalIsAudience, setModalIsAudience] = useState(false)
  const [dropdownPath, setDropdownPath] = useState(null)

  const audienceOptions = [
    'Public · Toutes les personnes',
    'Amis · Uniquement vos amis',
    'Privé · Vous seul',
    'Liste personnalisée',
    'Personnes spécifiques',
    'Groupes personnalisés'
  ]

  const modalSave = () => {
    if (modalMode === 'profile') {
      if (modalField === 'name') {
        const parts = (modalInput || '').split(' ').filter(Boolean)
        const prenom = parts.shift() || ''
        const nom = parts.join(' ')
        saveUser({ prenom, nom })
      } else {
        const upd = {}
        upd[modalField] = modalInput
        saveUser(upd)
      }
    } else if (modalMode === 'setting') {
      const updated = { ...(userSettings || {}) }
      let node = updated
      const path = modalPath || []
      for (let i = 0; i < path.length - 1; i++) { const p = path[i]; if (!node[p]) node[p] = {}; node = node[p] }
      // if input looks like a list, split
      const val = modalInput && modalInput.includes(',') ? modalInput.split(',').map(s=>s.trim()).filter(Boolean) : modalInput
      node[path[path.length - 1]] = val
      saveUser({ settings: updated })
    } else if (modalMode === 'manage') {
      const updated = { ...(userSettings || {}) }
      if (modalArea === 'ads') {
        if (!updated.ads) updated.ads = {}
        updated.ads.interests = modalInput.split(',').map(s=>s.trim()).filter(Boolean)
      } else if (modalArea === 'blocked') {
        if (!updated.blocking) updated.blocking = {}
        updated.blocking.blockedUsers = modalInput.split(',').map(s=>s.trim()).filter(Boolean)
      }
      saveUser({ settings: updated })
    } else if (modalMode === 'verify') {
      const updated = { ...(userSettings || {}) }
      let node = updated
      const path = modalPath || []
      for (let i = 0; i < path.length - 1; i++) { const p = path[i]; if (!node[p]) node[p] = {}; node = node[p] }
      node[path[path.length - 1]] = modalInput
      saveUser({ settings: updated })
    } else if (modalMode === '2fa') {
      const updated = { ...(userSettings || {}) }
      if (!updated.security) updated.security = {}
      updated.security.twoFactor = String(modalInput).toLowerCase().includes('activ') || String(modalInput) === 'true'
      saveUser({ settings: updated })
    } else if (modalMode === 'changePassword') {
      console.log('Password change requested (server implementation needed)')
    }
    setModalOpen(false)
  }

  return (
    <div className="settings-layout" style={{padding:'16px'}}>
      <div className="settings-sidebar">
        <h2>Paramètres</h2>
        <div className={`settings-nav-item ${active==='privacy'?'active':''}`} onClick={()=>setActive('privacy')}><div className="settings-nav-icon"><i className="fas fa-lock"></i></div><span>Confidentialité</span></div>
        <div className={`settings-nav-item ${active==='personal'?'active':''}`} onClick={()=>setActive('personal')}><div className="settings-nav-icon"><i className="fas fa-user-circle"></i></div><span>Informations personnelles</span></div>
        <div className={`settings-nav-item ${active==='security'?'active':''}`} onClick={()=>setActive('security')}><div className="settings-nav-icon"><i className="fas fa-shield-alt"></i></div><span>Sécurité et connexion</span></div>
        <div className={`settings-nav-item ${active==='notifications'?'active':''}`} onClick={()=>setActive('notifications')}><div className="settings-nav-icon"><i className="fas fa-bell"></i></div><span>Notifications</span></div>
        <div className={`settings-nav-item ${active==='ads'?'active':''}`} onClick={()=>setActive('ads')}><div className="settings-nav-icon"><i className="fas fa-ad"></i></div><span>Préférences publicitaires</span></div>
        <div className={`settings-nav-item ${active==='profile'?'active':''}`} onClick={()=>setActive('profile')}><div className="settings-nav-icon"><i className="fas fa-users"></i></div><span>Profil et marquage</span></div>
        <div className={`settings-nav-item ${active==='blocking'?'active':''}`} onClick={()=>setActive('blocking')}><div className="settings-nav-icon"><i className="fas fa-ban"></i></div><span>Blocage</span></div>
        <div className={`settings-nav-item ${active==='language'?'active':''}`} onClick={()=>setActive('language')}><div className="settings-nav-icon"><i className="fas fa-language"></i></div><span>Langue et région</span></div>
      </div>
      <div className="settings-content">
        {active === 'privacy' && (
          <div className="settings-section">
            <h3>Confidentialité du compte</h3>
            <div className="settings-item" style={{position:'relative'}}>
              <div className="settings-item-info">
                <h4>Qui peut voir vos futures publications ?</h4>
                <p>{getSetting(['privacy','futurePosts'],'Public · Toutes les personnes')}</p>
              </div>
              <div style={{position:'relative'}}>
                <button className="btn-secondary" onClick={() => setDropdownPath(dropdownPath && dropdownPath[0]==='privacy' && dropdownPath[1]==='futurePosts' ? null : ['privacy','futurePosts'])}>
                  Modifier
                </button>
                {dropdownPath && dropdownPath[0]==='privacy' && dropdownPath[1]==='futurePosts' && (
                  <div style={{position:'absolute',right:0,top:'100%',marginTop:8,width:'320px',background:'white',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',padding:0,zIndex:9999,overflow:'visible',display:'flex',flexDirection:'column'}}>
                    {audienceOptions.map(opt => (
                      <div key={opt} onClick={() => {
                        const updated = { ...(userSettings || {}) }
                        if (!updated.privacy) updated.privacy = {}
                        updated.privacy.futurePosts = opt
                        saveUser({ settings: updated })
                        setDropdownPath(null)
                      }} style={{padding:'12px 16px',borderBottom:'1px solid #E4E6EB',cursor:'pointer',fontSize:13,transition:'background 0.15s',backgroundColor: getSetting(['privacy','futurePosts'],'') === opt ? '#F0F2F5' : 'white'}} onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'} onMouseLeave={(e) => e.currentTarget.style.background = getSetting(['privacy','futurePosts'],'') === opt ? '#F0F2F5' : 'white'}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Vérifier toutes vos publications</h4>
                <p>{getSetting(['privacy','reviewPosts'],'Examinez vos publications et ce dans lequel vous êtes identifié')}</p>
              </div>
              <button className="btn-secondary" onClick={() => handleVerify(['privacy','reviewPosts'],'Texte de vérification des publications')}>
                Vérifier
              </button>
            </div>
            <div className="settings-item" style={{position:'relative'}}>
              <div className="settings-item-info">
                <h4>Qui peut vous envoyer des demandes d'amis ?</h4>
                <p>{getSetting(['privacy','friendRequests'],'Tout le monde')}</p>
              </div>
              <div style={{position:'relative'}}>
                <button className="btn-secondary" onClick={() => setDropdownPath(dropdownPath && dropdownPath[0]==='privacy' && dropdownPath[1]==='friendRequests' ? null : ['privacy','friendRequests'])}>
                  Modifier
                </button>
                {dropdownPath && dropdownPath[0]==='privacy' && dropdownPath[1]==='friendRequests' && (
                  <div style={{position:'absolute',right:0,top:'100%',marginTop:8,width:'320px',background:'white',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',padding:0,zIndex:9999,overflow:'visible',display:'flex',flexDirection:'column'}}>
                    {audienceOptions.map(opt => (
                      <div key={opt} onClick={() => {
                        const updated = { ...(userSettings || {}) }
                        if (!updated.privacy) updated.privacy = {}
                        updated.privacy.friendRequests = opt
                        saveUser({ settings: updated })
                        setDropdownPath(null)
                      }} style={{padding:'12px 16px',borderBottom:'1px solid #E4E6EB',cursor:'pointer',fontSize:13,transition:'background 0.15s',backgroundColor: getSetting(['privacy','friendRequests'],'') === opt ? '#F0F2F5' : 'white'}} onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'} onMouseLeave={(e) => e.currentTarget.style.background = getSetting(['privacy','friendRequests'],'') === opt ? '#F0F2F5' : 'white'}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="settings-item" style={{position:'relative'}}>
              <div className="settings-item-info">
                <h4>Qui peut voir votre liste d'amis ?</h4>
                <p>{getSetting(['privacy','friendList'],'Amis')}</p>
              </div>
              <div style={{position:'relative'}}>
                <button className="btn-secondary" onClick={() => setDropdownPath(dropdownPath && dropdownPath[0]==='privacy' && dropdownPath[1]==='friendList' ? null : ['privacy','friendList'])}>
                  Modifier
                </button>
                {dropdownPath && dropdownPath[0]==='privacy' && dropdownPath[1]==='friendList' && (
                  <div style={{position:'absolute',right:0,top:'100%',marginTop:8,width:'320px',background:'white',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',padding:0,zIndex:9999,overflow:'visible',display:'flex',flexDirection:'column'}}>
                    {audienceOptions.map(opt => (
                      <div key={opt} onClick={() => {
                        const updated = { ...(userSettings || {}) }
                        if (!updated.privacy) updated.privacy = {}
                        updated.privacy.friendList = opt
                        saveUser({ settings: updated })
                        setDropdownPath(null)
                      }} style={{padding:'12px 16px',borderBottom:'1px solid #E4E6EB',cursor:'pointer',fontSize:13,transition:'background 0.15s',backgroundColor: getSetting(['privacy','friendList'],'') === opt ? '#F0F2F5' : 'white'}} onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'} onMouseLeave={(e) => e.currentTarget.style.background = getSetting(['privacy','friendList'],'') === opt ? '#F0F2F5' : 'white'}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {active === 'personal' && (
          <div className="settings-section">
            <h3>Informations personnelles</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Votre nom</h4>
                <p>{userInfo.prenom ? `${userInfo.prenom} ${userInfo.nom || ''}` : ''}</p>
              </div>
              <button className="btn-secondary" onClick={() => handleModifyProfile('name','nom')}>
                Modifier
              </button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Adresse e-mail</h4>
                <p>{userInfo.email}</p>
              </div>
              <button className="btn-secondary" disabled>
                Modifier
              </button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Numéro de téléphone</h4>
                <p>{userInfo.phone || ''}</p>
              </div>
              <button className="btn-secondary" onClick={() => handleModifyProfile('phone','numéro de téléphone')}>
                Modifier
              </button>
            </div>
          </div>
        )}
        {active === 'security' && (
          <div className="settings-section">
            <h3>Sécurité et connexion</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Changer le mot de passe</h4>
                <p>Changez régulièrement votre mot de passe</p>
              </div>
              <button className="btn-secondary" onClick={handleChangePassword}>Modifier</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Authentification à deux facteurs</h4>
                <p>Activée</p>
              </div>
              <button className="btn-secondary" onClick={handleManage2FA}>Gérer</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Vérifier vos appareils</h4>
                <p>Consultez les appareils d'où vous êtes connecté</p>
              </div>
              <button className="btn-secondary" onClick={handleVerifyDevices}>Vérifier</button>
            </div>
          </div>
        )}
        {active === 'notifications' && (
          <div className="settings-section">
            <h3>Notifications</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>J'aime et réactions</h4>
                <p>Recevoir des notifications quand quelqu'un réagit à vos publications</p>
              </div>
              <div className={`toggle ${getSetting(['notifications','likes'], true) ? 'on' : ''}`} onClick={() => toggleSetting('notifications','likes')}></div>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Commentaires</h4>
                <p>Recevoir des notifications pour les nouveaux commentaires</p>
              </div>
              <div className={`toggle ${getSetting(['notifications','comments'], true) ? 'on' : ''}`} onClick={() => toggleSetting('notifications','comments')}></div>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Partages</h4>
                <p>Recevoir des notifications quand quelqu'un partage votre contenu</p>
              </div>
              <div className={`toggle ${getSetting(['notifications','shares'], true) ? 'on' : ''}`} onClick={() => toggleSetting('notifications','shares')}></div>
            </div>
          </div>
        )}
        {active === 'ads' && (
          <div className="settings-section">
            <h3>Préférences publicitaires</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Centres d'intérêt</h4>
                <p>Gérez vos intérêts publicitaires</p>
              </div>
              <button className="btn-secondary" onClick={() => handleManage('ads')}>Gérer</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Annonceurs</h4>
                <p>Consultez les annonces que vous avez vues</p>
              </div>
              <button className="btn-secondary" onClick={() => handleConsult('ads')}>Consulter</button>
            </div>
          </div>
        )}
        {active === 'profile' && (
          <div className="settings-section">
            <h3>Profil et marquage</h3>
            <div className="settings-item" style={{position:'relative'}}>
              <div className="settings-item-info">
                <h4>Qui peut vous envoyer des demandes d'amis ?</h4>
                <p>{getSetting(['profile','friendRequests'],'Tout le monde')}</p>
              </div>
              <div style={{position:'relative'}}>
                <button className="btn-secondary" onClick={() => setDropdownPath(dropdownPath && dropdownPath[0]==='profile' && dropdownPath[1]==='friendRequests' ? null : ['profile','friendRequests'])}>
                  Modifier
                </button>
                {dropdownPath && dropdownPath[0]==='profile' && dropdownPath[1]==='friendRequests' && (
                  <div style={{position:'absolute',right:0,top:'100%',marginTop:8,width:'320px',background:'white',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',padding:0,zIndex:9999,overflow:'visible',display:'flex',flexDirection:'column'}}>
                    {audienceOptions.map(opt => (
                      <div key={opt} onClick={() => {
                        const updated = { ...(userSettings || {}) }
                        if (!updated.profile) updated.profile = {}
                        updated.profile.friendRequests = opt
                        saveUser({ settings: updated })
                        setDropdownPath(null)
                      }} style={{padding:'12px 16px',borderBottom:'1px solid #E4E6EB',cursor:'pointer',fontSize:13,transition:'background 0.15s',backgroundColor: getSetting(['profile','friendRequests'],'') === opt ? '#F0F2F5' : 'white'}} onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'} onMouseLeave={(e) => e.currentTarget.style.background = getSetting(['profile','friendRequests'],'') === opt ? '#F0F2F5' : 'white'}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Avis sur les photos</h4>
                <p>Approuver les photos avant qu'elles ne soient publiées</p>
              </div>
              <div className={`toggle ${getSetting(['profile','approvePhotos'], false) ? 'on' : ''}`} onClick={() => toggleSetting('profile','approvePhotos')}></div>
            </div>
          </div>
        )}
        {active === 'blocking' && (
          <div className="settings-section">
            <h3>Blocage</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Personnes bloquées</h4>
                <p>Aucune personne bloquée</p>
              </div>
              <button className="btn-secondary" onClick={() => handleManage('blocked')}>Modifier</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Pages bloquées</h4>
                <p>Aucune page bloquée</p>
              </div>
              <button className="btn-secondary" onClick={() => handleManage('blocked')}>Modifier</button>
            </div>
          </div>
        )}
        {active === 'language' && (
          <div className="settings-section">
            <h3>Langue et région</h3>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Langue</h4>
                <p>Français (France)</p>
              </div>
              <button className="btn-secondary" onClick={() => handleModifySetting(['language','lang'],'Modifier la langue')}>Modifier</button>
            </div>
            <div className="settings-item">
              <div className="settings-item-info">
                <h4>Région</h4>
                <p>France</p>
              </div>
              <button className="btn-secondary" onClick={() => handleModifySetting(['language','region'],'Modifier la région')}>Modifier</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={modalTitle} footer={(
        <div style={{display:'flex',gap:8}}>
          <button className="btn-secondary" onClick={()=>setModalOpen(false)}>Annuler</button>
          <button className="btn-primary" onClick={modalSave}>Enregistrer</button>
        </div>
      )}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {modalMode === 'consult' && (<div style={{whiteSpace:'pre-wrap'}}>{modalInput}</div>)}
          {(modalMode === 'manage' || modalMode === 'profile' || modalMode === 'verify') && (
            <textarea value={modalInput} onChange={(e)=>setModalInput(e.target.value)} rows={6} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid var(--fb-border)'}} />
          )}
          {modalMode === 'verify' && (<div style={{fontSize:13,color:'var(--fb-text-secondary)'}}>Cliquez sur Enregistrer pour marquer la vérification.</div>)}
        </div>
      </Modal>

    </div>
  )
}

