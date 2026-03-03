import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function TestMessages() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Add animation styles
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const testUsers = [
    {
      id: 1,
      email: 'alice@example.com',
      nom: 'Alice',
      prenom: 'Alice',
      nomUtilisateur: 'alice_test',
      avatar: 'A'
    },
    {
      id: 2,
      email: 'bob@example.com',
      nom: 'Bob',
      prenom: 'Bob',
      nomUtilisateur: 'bob_test',
      avatar: 'B'
    },
    {
      id: 3,
      email: 'charlie@example.com',
      nom: 'Charlie',
      prenom: 'Charlie',
      nomUtilisateur: 'charlie_test',
      avatar: 'C'
    },
    {
      id: 4,
      email: 'diana@example.com',
      nom: 'Diana',
      prenom: 'Diana',
      nomUtilisateur: 'diana_test',
      avatar: 'D'
    }
  ]

  async function initializeTestData(userId) {
    setLoading(true)
    setMessage('Initialisation des données de test...')
    
    try {
      const user = testUsers.find(u => u.id === userId)
      
      // Sauvegarder l'utilisateur dans localStorage
      localStorage.setItem('user', JSON.stringify(user))
      
      // Initialiser les données de test via API
      const res = await fetch('/api/messages/init-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userName: `${user.prenom} ${user.nom}`
        })
      })

      if (res.ok) {
        setMessage('✅ Données de test créées avec succès!')
        setTimeout(() => {
          router.push('/messages')
        }, 1000)
      } else {
        const error = await res.json()
        setMessage(`❌ Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage(`❌ Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🧪 Test - Système de Messages</h1>
        <p style={styles.description}>
          Sélectionnez un utilisateur de test pour voir le système de messages en action
        </p>

        <div style={styles.usersGrid}>
          {testUsers.map(user => (
            <button
              key={user.id}
              onClick={() => initializeTestData(user.id)}
              disabled={loading}
              style={styles.userCard}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div style={styles.avatar}>{user.avatar}</div>
              <div style={styles.userName}>{user.prenom} {user.nom}</div>
              <div style={styles.userEmail}>{user.email}</div>
              <span style={styles.username}>@{user.nomUtilisateur}</span>
            </button>
          ))}
        </div>

        {message && (
          <div style={{
            ...styles.message,
            background: message.includes('✅') ? '#D4EDDA' : message.includes('❌') ? '#F8D7DA' : '#D1ECF1',
            color: message.includes('✅') ? '#155724' : message.includes('❌') ? '#721C24' : '#0C5460',
            borderColor: message.includes('✅') ? '#C3E6CB' : message.includes('❌') ? '#F5C6CB' : '#BEE5EB'
          }}>
            {message}
          </div>
        )}

        <div style={styles.info}>
          <h3>📋 Informations de test :</h3>
          <ul>
            <li><strong>4 utilisateurs de test</strong> avec emails différents</li>
            <li><strong>Conversations multiples</strong> entre les utilisateurs</li>
            <li><strong>Messages de test</strong> pré-remplis pour voir le résultat</li>
            <li><strong>Avatars personnalisés</strong> avec les initiales</li>
            <li>Les utilisateurs peuvent <strong>communiquer entre eux</strong></li>
          </ul>
        </div>

        <div style={styles.features}>
          <h3>✨ Fonctionnalités testées :</h3>
          <div style={styles.featureGrid}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>💬</span>
              <div>
                <strong>Liste des conversations</strong>
                <p>Voir toutes les conversations avec aperçus</p>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>💌</span>
              <div>
                <strong>Modale de chat</strong>
                <p>Ouvrir et fermer les chats facilement</p>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>⏱️</span>
              <div>
                <strong>Horodatages</strong>
                <p>Voir l'heure des messages</p>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓✓</span>
              <div>
                <strong>Double confirmations</strong>
                <p>Marquer les messages comme lus</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0B3D91 0%, #764ba2 100%)',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    background: '#FFF',
    borderRadius: 16,
    padding: 40,
    maxWidth: 900,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.5s ease-out'
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: '0 0 12px 0',
    color: '#1F2937'
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    margin: '0 0 32px 0',
    lineHeight: 1.6
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 32
  },
  userCard: {
    background: '#F9FAFB',
    border: '2px solid #E5E7EB',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: 'inherit',
    fontSize: 14
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0B3D91, #764ba2)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12
  },
  userName: {
    fontWeight: 700,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  username: {
    fontSize: 11,
    color: '#9CA3AF'
  },
  message: {
    padding: 16,
    borderRadius: 8,
    border: '1px solid',
    marginBottom: 24,
    animation: 'slideDown 0.3s ease-out'
  },
  info: {
    background: '#F0F4FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    border: '1px solid #E0E7FF'
  },
  features: {
    background: '#FFFBEB',
    padding: 20,
    borderRadius: 12,
    border: '1px solid #FEE3B0'
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginTop: 12
  },
  feature: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start'
  },
  featureIcon: {
    fontSize: 24,
    minWidth: 32,
    textAlign: 'center'
  }
}
