'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { CopyrighFooter } from '@/components/CopyrighFooter';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [accepted, setAccepted] = React.useState(false);

  // Rediriger vers welcome si pas connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/welcome');
    }
  }, [status, router]);

  const sections = [
    {
      title: '1. Utilisation responsable',
      content:
        'Vous acceptez d\'utiliser Unify de manière responsable et respectueuse. Toute utilisation abusive, notamment le spam, le harcèlement ou la propagation de contenu offensant est strictement interdite. Les violations peuvent entraîner la suppression de votre compte.',
    },
    {
      title: '2. Confidentialité des données',
      content:
        'Vos données personnelles sont protégées et ne seront jamais partagées avec des tiers sans votre consentement explicite. Nous utilisons le chiffrement SSL/TLS pour sécuriser vos informations en transit. Consultez notre politique de confidentialité pour plus de détails.',
    },
    {
      title: '3. Contenu utilisateur',
      content:
        'Vous êtes responsable du contenu que vous partagez. Unify se réserve le droit de supprimer tout contenu violant ces conditions, y compris le contenu haineux, violent, diffamatoire ou illégal. Vous conservez les droits d\'auteur sur votre contenu.',
    },
    {
      title: '4. Propriété intellectuelle',
      content:
        'Tous les droits de propriété intellectuelle liés à Unify, y compris le code source, les logos, les designs et les fonctionnalités, appartiennent à l\'entreprise Unify. Vous conservez tous les droits sur le contenu que vous créez et publiez.',
    },
    {
      title: '5. Limitation de responsabilité',
      content:
        'Unify est fourni "tel quel" sans garantie expresse ou implicite. Nous ne serions pas responsables des dommages directs ou indirects, des pertes de données ou des interruptions de service résultant de l\'utilisation de notre service. Votre utilisation du service est à vos propres risques.',
    },
    {
      title: '6. Modification des conditions',
      content:
        'Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications importantes seront communiquées aux utilisateurs par email ou par notification dans l\'application. Votre utilisation continue du service après les modifications constitue votre acceptation.',
    },
    {
      title: '7. Comptes et authentification',
      content:
        'Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion. Vous acceptez de ne pas partager votre mot de passe et d\'être responsable de toutes les activités qui se produisent sous votre compte. Vous devez signaler tout accès non autorisé immédiatement.',
    },
    {
      title: '8. Résiliation et suspension',
      content:
        'Nous nous réservons le droit de suspendre ou de supprimer votre compte si vous violez ces conditions ou nos politiques communautaires. Vous pouvez supprimer votre compte à tout moment dans les paramètres de votre profil.',
    },
    {
      title: '9. Contenu généré par les utilisateurs',
      content:
        'En publiant du contenu sur Unify, vous accordez à Unify une licence mondiale, non exclusive et gratuite pour afficher et reproduire votre contenu. Cela ne s\'applique qu\'au contenu que vous rendez public.',
    },
    {
      title: '10. Droit applicable et juridiction',
      content:
        'Ces conditions sont régies par les lois applicables. Toute dispute découlant de ces conditions sera soumise aux tribunaux compétents. En utilisant Unify, vous acceptez cette juridiction.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-amber-900 to-primary-dark">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Conditions d'utilisation 📋
          </h1>
          <p className="text-white/80 text-lg">
            Veuillez lire et accepter nos conditions avant de continuer
          </p>
          <p className="text-white/60 text-sm mt-2">
            Dernière mise à jour : Février 2026
          </p>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-4 mb-12">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-colors">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold text-lg mb-3">
                    {section.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Acceptance Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8"
        >
          <label className="flex items-center space-x-4 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-6 h-6 rounded border-2 border-white/30 bg-white/10 cursor-pointer"
            />
            <span className="text-white text-lg">
              J'accepte les conditions d'utilisation et je comprends que je dois respecter les règles de la communauté
            </span>
          </label>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-white/10 border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
          >
            Retour
          </button>
          <Link href={accepted ? '/' : '#'}>
            <motion.button
              whileHover={accepted ? { scale: 1.05 } : {}}
              whileTap={accepted ? { scale: 0.95 } : {}}
              disabled={!accepted}
              className={`flex items-center justify-center space-x-2 px-8 py-3 rounded-xl font-bold transition-colors shadow-xl ${
                accepted
                  ? 'bg-white text-gray-900 hover:bg-gray-100 cursor-pointer'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
            >
              <span>Acceder à Unify</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Info Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 mb-12"
        >
          <p className="text-white/60 text-sm">
            ✓ Vous pouvez modifier vos paramètres à tout moment dans les réglages de votre compte
          </p>
        </motion.div>

        <CopyrighFooter />
      </div>
    </div>
  );
}
