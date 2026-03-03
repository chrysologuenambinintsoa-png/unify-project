import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function WelcomePage(){
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth')
    } else {
      setUser(JSON.parse(userData))
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [loading])

  const slides = [
    {
      icon: '💬',
      title: 'Connectez-vous avec vos amis',
      description: 'Partagez vos moments, vos pensées et vos sentiments en temps réel',
      color: '#E3F2FD'
    },
    {
      icon: '🎥',
      title: 'Partagez vos souvenirs',
      description: 'Publiez des photos, vidéos et créez des souvenirs inoubliables',
      color: '#FFF3E0'
    },
    {
      icon: '👥',
      title: 'Rejoignez des communautés',
      description: 'Découvrez des groupes basés sur vos intérêts et passions',
      color: '#F3E5F5'
    },
    {
      icon: '🔔',
      title: 'Restez informé',
      description: 'Recevez des notifications sur les activités de vos proches',
      color: '#E8F5E9'
    }
  ]

  const features = [
    { icon: '💬', title: 'Messagerie', description: 'Conversations privées et sécurisées' },
    { icon: '📰', title: 'Fil d\'actualité', description: 'Suivez l\'activité de vos amis' },
    { icon: '👥', title: 'Groupes', description: 'Créez et rejoignez des groupes' },
    { icon: '🎉', title: 'Événements', description: 'Organisez des événements mémorables' }
  ]

  const guide = [
    { step: 1, title: 'Complétez votre profil', description: 'Ajoutez votre photo et vos informations' },
    { step: 2, title: 'Trouvez vos amis', description: 'Recherchez et ajoutez vos amis' },
    { step: 3, title: 'Partagez votre contenu', description: 'Publiez vos photos et vos pensées' },
    { step: 4, title: 'Interagissez', description: 'Aimez, commentez et partagez' }
  ]

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/auth')
  }

  if (loading) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg, #0A2342, #166FE5)'}}>
        <div style={{textAlign:'center',color:'white'}}>
          <div style={{fontSize:48,marginBottom:16,animation:'bounce 1s infinite'}}>✨</div>
          <p style={{fontSize:16}}>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#F5F7FA'}}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        
        .welcome-header { animation: fadeIn 0.6s ease-out; }
        .slide-container { animation: fadeIn 0.8s ease-out; }
        .feature-card { transition: all 0.3s ease; }
        .feature-card:hover { transform: translateY(-8px); box-shadow: 0 12px 32px rgba(22, 111, 229, 0.2); }
        .guide-step { animation: slideIn 0.6s ease-out; }
        .guide-step:nth-child(1) { animation-delay: 0.1s; }
        .guide-step:nth-child(2) { animation-delay: 0.2s; }
        .guide-step:nth-child(3) { animation-delay: 0.3s; }
        .guide-step:nth-child(4) { animation-delay: 0.4s; }
        
        .logo-animated { animation: pulse 2s infinite; }
        .slide-dot { transition: all 0.3s ease; cursor: pointer; }
        .slide-dot.active { transform: scale(1.2); }
        
        @media (max-width: 768px) {
          .welcome-container { padding: 12px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .guide-grid { grid-template-columns: 1fr !important; }
          .hero-section { padding: 24px 16px !important; }
        }
      `}</style>

      {/* Hero Section avec Logo et Titre */}
      <div style={{background:'linear-gradient(135deg, #0A2342 0%, #166FE5 100%)',padding:'60px 20px 40px',color:'white',textAlign:'center'}}>
        <div className="welcome-header" style={{maxWidth:800,margin:'0 auto'}}>
          <div className="logo-animated" style={{fontSize:80,marginBottom:20,display:'inline-block'}}>
            <img src="/logo.svg" alt="Unify Logo" style={{width:80,height:80}} />
          </div>
          <h1 style={{fontSize:48,fontWeight:800,margin:'0 0 12px 0',letterSpacing:'-0.5px'}}>Unify</h1>
          <p style={{fontSize:18,opacity:0.9,margin:'0 0 8px 0'}}>Connectez-vous, partagez, découvrez</p>
          <p style={{fontSize:14,opacity:0.8,margin:0}}>La plateforme sociale pour tisser des liens authentiques</p>
        </div>
      </div>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'40px 20px'}}>
        {/* Carousel/Slides */}
        <div className="slide-container" style={{background:'white',borderRadius:16,padding:40,marginBottom:40,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
          <div style={{textAlign:'center',minHeight:300,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
            <div style={{fontSize:80,marginBottom:20,animation:'bounce 1s infinite'}}>{slides[currentSlide].icon}</div>
            <h2 style={{fontSize:32,fontWeight:700,margin:'0 0 12px 0',color:'#0A2342'}}>{slides[currentSlide].title}</h2>
            <p style={{fontSize:16,color:'#65676B',margin:'0 0 24px 0',maxWidth:500}}>{slides[currentSlide].description}</p>
          </div>
          
          {/* Dots */}
          <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:24}}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                className={`slide-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: idx === currentSlide ? 32 : 12,
                  height: 12,
                  borderRadius: 6,
                  background: idx === currentSlide ? '#166FE5' : '#CED0D4',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div style={{background:'white',borderRadius:16,padding:40,marginBottom:40,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 20px 0',color:'#0A2342',textAlign:'center'}}>À propos d'Unify</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'center'}}>
            <div>
              <p style={{fontSize:16,color:'#333',lineHeight:1.7,marginBottom:16}}>
                <strong>Unify</strong> est une plateforme sociale révolutionnaire conçue pour vous connecter avec les personnes qui comptent vraiment.
              </p>
              <p style={{fontSize:16,color:'#333',lineHeight:1.7,marginBottom:16}}>
                Que vous souhaitiez rester en contact avec vos amis, avoir des discussions significatives ou découvrir de nouvelles communautés, Unify met la connexion authentique au cœur de tout.
              </p>
              <p style={{fontSize:16,color:'#333',lineHeight:1.7}}>
                Bienvenue dans une plateforme où votre voix compte et où chaque interaction a du sens.
              </p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{background:'#E3F2FD',borderRadius:12,padding:20,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:8}}>🌍</div>
                <p style={{fontSize:14,fontWeight:600,color:'#0A2342',margin:0}}>Mondial</p>
              </div>
              <div style={{background:'#F3E5F5',borderRadius:12,padding:20,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:8}}>🔒</div>
                <p style={{fontSize:14,fontWeight:600,color:'#0A2342',margin:0}}>Sécurisé</p>
              </div>
              <div style={{background:'#FFF3E0',borderRadius:12,padding:20,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:8}}>⚡</div>
                <p style={{fontSize:14,fontWeight:600,color:'#0A2342',margin:0}}>Rapide</p>
              </div>
              <div style={{background:'#E8F5E9',borderRadius:12,padding:20,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:8}}>💚</div>
                <p style={{fontSize:14,fontWeight:600,color:'#0A2342',margin:0}}>Éthique</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{marginBottom:40}}>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 24px 0',color:'#0A2342',textAlign:'center'}}>Fonctionnalités principales</h2>
          <div className="features-grid" style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:16}}>
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card" style={{background:'white',borderRadius:12,padding:24,textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                <div style={{fontSize:48,marginBottom:12}}>{feature.icon}</div>
                <h3 style={{fontSize:16,fontWeight:700,margin:'0 0 8px 0',color:'#0A2342'}}>{feature.title}</h3>
                <p style={{fontSize:13,color:'#65676B',margin:0}}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guide de démarrage */}
        <div style={{background:'white',borderRadius:16,padding:40,marginBottom:40,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 32px 0',color:'#0A2342',textAlign:'center'}}>Guide de démarrage</h2>
          <div className="guide-grid" style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:20}}>
            {guide.map((item, idx) => (
              <div key={idx} className="guide-step" style={{textAlign:'center'}}>
                <div style={{
                  width: 60,
                  height: 60,
                  background: 'linear-gradient(135deg, #166FE5, #0A2342)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 16px',
                  color: 'white',
                  fontWeight: 700
                }}>
                  {item.step}
                </div>
                <h3 style={{fontSize:16,fontWeight:700,margin:'0 0 8px 0',color:'#0A2342'}}>{item.title}</h3>
                <p style={{fontSize:13,color:'#65676B',margin:0}}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profil utilisateur */}
        <div style={{background:'white',borderRadius:16,padding:32,marginBottom:40,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
          <h2 style={{fontSize:20,fontWeight:700,margin:'0 0 20px 0',color:'#0A2342'}}>Votre profil</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:20,marginBottom:24}}>
            <div style={{padding:16,background:'#F5F7FA',borderRadius:12}}>
              <p style={{color:'#65676B',fontSize:12,margin:'0 0 6px 0',textTransform:'uppercase',fontWeight:600}}>Prénom</p>
              <p style={{fontSize:16,fontWeight:600,margin:0,color:'#0A2342'}}>{user?.prenom || 'N/A'}</p>
            </div>
            <div style={{padding:16,background:'#F5F7FA',borderRadius:12}}>
              <p style={{color:'#65676B',fontSize:12,margin:'0 0 6px 0',textTransform:'uppercase',fontWeight:600}}>Nom</p>
              <p style={{fontSize:16,fontWeight:600,margin:0,color:'#0A2342'}}>{user?.nom || 'N/A'}</p>
            </div>
            <div style={{padding:16,background:'#F5F7FA',borderRadius:12}}>
              <p style={{color:'#65676B',fontSize:12,margin:'0 0 6px 0',textTransform:'uppercase',fontWeight:600}}>Email</p>
              <p style={{fontSize:14,fontWeight:600,margin:0,color:'#0A2342',wordBreak:'break-all'}}>{user?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <Link href="/">
              <button style={{flex:1,minWidth:200,padding:14,background:'linear-gradient(135deg, #0A2342, #166FE5)',color:'white',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:14,transition:'all 0.3s ease'}}>
                → Accéder au Feed
              </button>
            </Link>
            <button onClick={handleLogout} style={{flex:1,minWidth:200,padding:14,background:'#F5F7FA',color:'#0A2342',border:'2px solid #CED0D4',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:14,transition:'all 0.3s ease'}}>
              ← Se déconnecter
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign:'center',paddingBottom:40,color:'#65676B',fontSize:13}}>
          <p>© 2026 Unify. Tous droits réservés. | <a href="#" style={{color:'#166FE5',textDecoration:'none'}}>Politique de confidentialité</a> | <a href="#" style={{color:'#166FE5',textDecoration:'none'}}>Conditions d'utilisation</a></p>
        </div>
      </div>
    </div>
  )
}
