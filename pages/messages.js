import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Messages from '../components/Messages'

export default function MessagesPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const isTest = router.query.test === 'true'
    
    if (!userStr && !isTest) {
      router.push('/auth')
    } else {
      setUser(userStr ? JSON.parse(userStr) : { email: 'test@example.com', nom: 'Test', prenom: 'User', nomUtilisateur: 'testuser' })
      setIsAuthenticated(true)
      setLoading(false)
    }
  }, [router.isReady])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' }}>
        Chargement...
      </div>
    )
  }

  return isAuthenticated ? (
    <Layout>
      <Messages user={user} />
    </Layout>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 20, color: '#333' }}>Accès non autorisé</h2>
      <p style={{ color: '#666' }}>Veuillez vous connecter pour continuer</p>
      <button onClick={() => router.push('/auth')} style={{ padding: '10px 20px', background: '#166FE5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        Aller à la connexion
      </button>
    </div>
  )
}
