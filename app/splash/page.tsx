'use client';

import React, { useState, useEffect } from 'react';
import { SimpleSplashScreen } from '@/components/SimpleSplashScreen';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SplashPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSplashComplete = () => {
    // Rediriger vers la page d'accueil ou login selon l'état de la session
    if (status === 'authenticated') {
      router.push('/');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <SimpleSplashScreen
      duration={3000}
      onComplete={handleSplashComplete}
      variant="modern"
    />
  );
}
