import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook pour vérifier que l'utilisateur est authentifié
 * Retourne null pendant le chargement pour éviter l'affichage d'une page vide
 * Redirige vers login si pas authentifié
 */
export function useRequireAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Retourne null pendant le chargement - prévient l'affichage d'une page vide/grise
  if (status === 'loading') {
    return { isReady: false, session: null, status };
  }

  // Redirige si pas de session
  if (!session) {
    return { isReady: false, session: null, status };
  }

  return { isReady: true, session, status };
}
