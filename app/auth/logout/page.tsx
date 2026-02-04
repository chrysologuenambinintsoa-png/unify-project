'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function LogoutPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const performLogout = async () => {
      // Enregistrer la déconnexion avant de sign out
      if (session?.user?.email) {
        try {
          await fetch('/api/auth/logout-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.user.email,
              userAgent: navigator.userAgent,
            }),
          });
        } catch (err) {
          console.error('Error recording logout:', err);
        }
      }

      // Sign out from NextAuth
      await signOut({ redirect: false });
      
      // Attendre un moment pour s'assurer que les données sont enregistrées
      setTimeout(() => {
        // Rediriger vers la page login pour afficher l'historique avec le profil
        router.push('/auth/login');
      }, 500);
    };

    performLogout();
  }, [router, session]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-dark to-primary-light">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4 border-4 border-white/20 border-t-white rounded-full"
        />
        <h1 className="text-3xl font-bold text-white mb-4">Déconnexion...</h1>
        <p className="text-gray-200">Vous allez être redirigé vers la page de connexion.</p>
      </motion.div>
    </div>
  );
}
