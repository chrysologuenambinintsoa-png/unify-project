import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function SidebarLeft(){
  const [showMore, setShowMore] = useState(false)
  const [user, setUser] = useState(null)
  const [myGroups, setMyGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)

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
    // load joined groups when user changes
    async function load() {
      if (!user || !user.email) return;
      setLoadingGroups(true);
      try {
        const res = await fetch(`/api/groupes?userEmail=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        const joined = (data.groupes || []).filter(g=>g.joined);
        setMyGroups(joined);
      } catch(e){console.error(e)}
      finally{ setLoadingGroups(false) }
    }
    load();
  }, [user])

  function getInitials(){
    if (!user) return 'U'
    const first = user.prenom ? user.prenom[0] : ''
    const last = user.nom ? user.nom[0] : ''
    return (first+last).toUpperCase() || 'U'
  }

  return (
    <aside className="left-sidebar">
      <Link href="/profile">
        <div className="sidebar-profile" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 8px',borderRadius:8,cursor:'pointer',textDecoration:'none',transition:'background .15s'}} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
          <div className="avatar-placeholder icon" style={{width:56,height:56,fontSize:24,marginBottom:8}}>{getInitials()}</div>
          <div className="sidebar-profile-info">
            <div className="sidebar-username">{user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}</div>
            {/* optional secondary info could go here */}
          </div>
        </div>
      </Link>
      <div className="sidebar-divider" style={{height:1,background:'var(--fb-bg)',margin:'8px 0'}} />
      <Link href="/amis">
        <div className="sidebar-link"><div className="icon sidebar-icon-blue"><i className="fas fa-users"></i></div><span>Amis</span></div>
      </Link>
      <Link href="/groupes">
        <div className="sidebar-link"><div className="icon sidebar-icon-purple"><i className="fas fa-people-group"></i></div><span>Groupes</span></div>
      </Link>
      {myGroups.length > 0 && (
        <div style={{paddingLeft:16,marginTop:4}}>
          <div style={{fontSize:12,color:'var(--fb-text-secondary)',marginBottom:4}}>Mes groupes</div>
          {loadingGroups ? (
            <GroupSkeleton />
          ) : myGroups.slice(0,3).map(g => (
            <Link key={g.id} href={`/groupes?id=${g.id}`}>
              <div className="sidebar-link" style={{paddingLeft:8,fontSize:14}}>{g.name}</div>
            </Link>
          ))}
        </div>
      )}
      <Link href="/page">
        <div className="sidebar-link"><div className="icon sidebar-icon-green"><i className="fas fa-flag"></i></div><span>Pages</span></div>
      </Link>
      {showMore && (
        <>
          <Link href="/evenements">
            <div className="sidebar-link"><div className="icon sidebar-icon-red"><i className="fas fa-calendar-alt"></i></div><span>Événements</span></div>
          </Link>
          <Link href="/sauvegarde">
            <div className="sidebar-link"><div className="icon sidebar-icon-blue"><i className="fas fa-bookmark"></i></div><span>Sauvegarde</span></div>
          </Link>
          <Link href="/souvenirs">
            <div className="sidebar-link"><div className="icon sidebar-icon-purple"><i className="fas fa-history"></i></div><span>Souvenirs</span></div>
          </Link>
        </>
      )}
      <Link href="/marketplace">
        <div className="sidebar-link"><div className="icon sidebar-icon-orange"><i className="fas fa-store"></i></div><span>Marketplace</span></div>
      </Link>
      <Link href="/videos">
        <div className="sidebar-link"><div className="icon sidebar-icon-red"><i className="fas fa-play-circle"></i></div><span>Vidéos</span></div>
      </Link>
      <div className="sidebar-link sidebar-see-more" onClick={() => setShowMore(!showMore)}><div className="icon" style={{background:'var(--fb-bg)'}}><i className="fas fa-chevron-down"></i></div><span>{showMore ? 'Voir moins' : 'Voir plus'}</span></div>
      {showMore && (
        <>
          <div style={{height:1,background:'var(--fb-bg)',margin:'8px 0'}} />
          <div className="sidebar-section-title">Raccourcis</div>
          <Link href="/jeux">
            <div className="sidebar-link"><div className="icon sidebar-icon-blue" style={{borderRadius:8}}><i className="fas fa-gamepad"></i></div><span>Jeux instantanés</span></div>
          </Link>
          <div className="sidebar-section-title" style={{marginTop:8}}>Explorer</div>
          <Link href="/actualites">
            <div className="sidebar-link"><div className="icon" style={{background:'var(--fb-bg)'}}><i className="fas fa-newspaper"></i></div><span>Actualités</span></div>
          </Link>
          <Link href="/collectes">
            <div className="sidebar-link"><div className="icon" style={{background:'var(--fb-bg)'}}><i className="fas fa-hand-holding-heart"></i></div><span>Collectes de fonds</span></div>
          </Link>
        </>
      )}
    </aside>
  )
}
