import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { ContactSkeleton, GroupSkeleton } from './Skeleton';

export default function SidebarRight(){
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // helper to format lastSeen into human string
  const formatLast = (ts) => {
    if(!ts) return '';
    const diff = Date.now() - new Date(ts);
    if(diff < 60000) return 'en ligne';
    if(diff < 3600000) return `${Math.floor(diff/60000)} mn`;
    if(diff < 86400000) return `${Math.floor(diff/3600000)} h`;
    return `${Math.floor(diff/86400000)} j`;
  };

  // load contacts from backend (reuse amis endpoint)
  const loadContacts = () => {
    setLoadingContacts(true);
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const userEmail = user?.email
      if (!userEmail) {
        setLoadingContacts(false)
        return
      }
      fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}`)
        .then(r => r.json())
        .then(d => {
          const friends = d.amis || [];
          const formatted = friends.map(f => ({
            name: `${f.prenom || ''} ${f.nom || ''}`.trim(),
            email: f.email || f.nomUtilisateur || '',
            initials: f.prenom ? `${f.prenom[0]}${(f.nom||'')[0]||''}`.toUpperCase() : (f.nomUtilisateur ? f.nomUtilisateur.slice(0,2).toUpperCase() : ''),
            color: f.color || 'linear-gradient(135deg,#667eea,#764ba2)',
            online: f.online || false,
            lastSeen: f.lastSeen,
          }));
          setContacts(formatted);
        })
        .catch(() => {})
        .finally(() => setLoadingContacts(false));
    } catch (e) {
      setLoadingContacts(false)
    }
  };

  useEffect(() => {
    loadContacts();
    loadGroups();
    const interval = setInterval(loadContacts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadGroups = () => {
    setLoadingGroups(true);
    const userStr = localStorage.getItem('user');
    const localUser = userStr ? JSON.parse(userStr) : null;
    const email = localUser ? localUser.email : '';
    fetch(`/api/groupes?userEmail=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => setGroups(d.groupes || []))
      .catch(()=>{})
      .finally(()=>setLoadingGroups(false));
  };

  const openChat = (contact) => {
    router.push(`/messages?contact=${encodeURIComponent(contact.email)}&name=${encodeURIComponent(contact.name)}`)
  };

  return (
    <aside className="right-sidebar">
      <div className="card sponsored-card">
        <div className="sponsored-title">Sponsorisé</div>
        <div className="ad-item">
          <div className="ad-image" style={{background:'linear-gradient(135deg,#43e97b,#38f9d7)'}}>🌿</div>
          <div className="ad-info">
            <h4>Nature & Bio – Produits naturels</h4>
            <p>Découvrez notre gamme de produits 100% naturels et bio pour votre bien-être quotidien.</p>
            <p className="ad-link">natureetbio.fr</p>
          </div>
        </div>
      </div>
      <div className="card contacts-section">
        <div className="contacts-header">
          <div className="contacts-title">Contacts</div>
          <div className="contacts-icons">
            <button className="nav-icon-btn" style={{width:32,height:32,fontSize:14}}><i className="fas fa-video"></i></button>
            <button className="nav-icon-btn" style={{width:32,height:32,fontSize:14}}><i className="fas fa-search"></i></button>
            <button className="nav-icon-btn" style={{width:32,height:32,fontSize:14}}><i className="fas fa-ellipsis-h"></i></button>
          </div>
        </div>
        {loadingContacts ? (
          Array.from({length:5}).map((_,i)=><ContactSkeleton key={i} />)
        ) : (
          contacts
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((c,i)=> {
              const selected = router.query.contact === c.email;
              return (
                <div
                  key={i}
                  className={`contact-item${selected ? ' selected' : ''}`}
                  onClick={()=>openChat(c)}
                  style={{cursor:'pointer'}}
                >
                  <div className="contact-avatar">
                    <div className="avatar-placeholder" style={{width:36,height:36,fontSize:14,background:c.color}}>{c.initials}</div>
                    {c.online && <div className="online-dot"></div>}
                  </div>
                  <span className="contact-name">{c.name}</span>
                  <span style={{marginLeft:'auto',fontSize:12,color:'var(--fb-text-secondary)'}}>{formatLast(c.lastSeen)}</span>
                </div>
              )
            })
        )}
      </div>
      <div className="card" style={{padding:12}}>
        <div className="contacts-title" style={{fontSize:17,fontWeight:700,marginBottom:12}}>Groupes</div>
        {loadingGroups ? (
          Array.from({length:2}).map((_,i)=><GroupSkeleton key={i} />)
        ) : (
          groups.map(g => (
            <div
              key={g.id}
              className="contact-item"
              onClick={() => router.push(`/groupes?id=${g.id}`)}
              style={{cursor:'pointer'}}
            >
              <div style={{width:36,height:36,background:g.cover || '#ccc',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                {g.coverIcon || '👥'}
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:500}}>{g.name}</div>
                {g.members !== undefined && <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{g.members} membres</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
