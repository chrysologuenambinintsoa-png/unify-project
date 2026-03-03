import { useState, useEffect } from 'react'
import { GroupSkeleton } from './Skeleton'

export default function Groupes(){
  const [groupes, setGroupes] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroupes()
  }, [])

  const fetchGroupes = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const localUser = userStr ? JSON.parse(userStr) : null;
      const email = localUser ? localUser.email : '';
      const res = await fetch(`/api/groupes?userEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      setGroupes(data.groupes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    const userStr = localStorage.getItem('user');
    const localUser = userStr ? JSON.parse(userStr) : null;
    const email = localUser ? localUser.email : '';
    await fetch('/api/groupes', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ name: newGroupName, userEmail: email }) 
    })
    setNewGroupName('')
    setShowCreateModal(false)
    fetchGroupes()
  }

  const handleJoinGroup = async (id) => {
    const userStr = localStorage.getItem('user');
    const localUser = userStr ? JSON.parse(userStr) : null;
    const email = localUser ? localUser.email : '';
    await fetch('/api/groupes', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ action: 'join', groupId: id, userEmail: email }) 
    })
    fetchGroupes()
  }

  return (
    <div>
      <div className="card" style={{marginBottom:12,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2>Groupes</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{padding:'8px 16px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:6}}
          >
            <i className="fas fa-plus"></i> Créer un groupe
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',gap:12}}>
          {loading ? (
            Array.from({length:4}).map((_,i)=><GroupSkeleton key={i} />)
          ) : groupes.map(groupe => (
            <div key={groupe.id} style={{border:'1px solid var(--fb-border)',borderRadius:8,overflow:'hidden'}}>
              <div style={{height:120,background:groupe.cover,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,backgroundSize:'cover'}}>
                {groupe.coverIcon}
              </div>
              <div style={{padding:12}}>
                <h4 style={{marginBottom:4,fontSize:15,fontWeight:600}}>{groupe.name}</h4>
                <p style={{fontSize:13,color:'var(--fb-text-secondary)',marginBottom:8}}>{groupe.members} membres</p>
                <p style={{fontSize:13,color:'var(--fb-text-secondary)',marginBottom:12}}>{groupe.description}</p>
                {groupe.joined ? (
                  <button style={{width:'100%',padding:'8px',background:'var(--fb-bg)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13}}>
                    Consulter le groupe
                  </button>
                ) : (
                  <button 
                    onClick={() => handleJoinGroup(groupe.id)}
                    style={{width:'100%',padding:'8px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13}}
                  >
                    Rejoindre
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500}}>
          <div style={{background:'white',borderRadius:8,padding:24,maxWidth:400,width:'90%'}}>
            <h2 style={{marginBottom:16}}>Créer un nouveau groupe</h2>
            <input 
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nom du groupe"
              style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:6,marginBottom:16,fontSize:15}}
            />
            <div style={{display:'flex',gap:8}}>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{flex:1,padding:'10px',background:'var(--fb-bg)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
              >
                Annuler
              </button>
              <button 
                onClick={handleCreateGroup}
                style={{flex:1,padding:'10px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
