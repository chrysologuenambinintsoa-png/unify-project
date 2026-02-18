'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { LogOut, CheckCircle } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = React.useState<'logging-out' | 'success'>('logging-out');

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
      
      // Show success state
      setStep('success');
      
      // Attendre avant redir
      setTimeout(() => {
        // Rediriger vers la page login pour afficher l'historique avec le profil
        router.push('/auth/login');
      }, 1500);
    };

    performLogout();
  }, [router, session]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-dark via-blue-900 to-primary-dark flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 80%, #3b82f6 0%, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-md"
      >
        {/* Icon Container */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="relative"
        >
          {step === 'logging-out' ? (
            <>
              {/* Rotating outer circle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 w-24 h-24 border-2 border-transparent border-t-white border-r-blue-300 rounded-full"
              />
              {/* Inner icon */}
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                <LogOut className="w-10 h-10 text-white" />
              </div>
            </>
          ) : (
            /* Success state */
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
              className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-400"
            >
              <CheckCircle className="w-12 h-12 text-green-400" />
            </motion.div>
          )}
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-3">
            {step === 'logging-out' ? 'Déconnexion...' : 'Au revoir!'}
          </h1>
          <p className="text-white/70 text-lg">
            {step === 'logging-out' 
              ? 'Vous allez être redirigé vers la page de connexion'
              : 'À bientôt sur Unify!'
            }
          </p>
        </motion.div>

        {/* Loading dots (show during logging out) */}
        {step === 'logging-out' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3 mt-4"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
