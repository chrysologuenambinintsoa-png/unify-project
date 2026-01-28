'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, Users, Share2, Zap, Shield, Settings } from 'lucide-react';

export default function HelpPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { translation } = useLanguage();

  // Rediriger vers welcome si pas connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/welcome');
    }
  }, [status, router]);

  const guides = [
    {
      icon: MessageCircle,
      title: 'Messagerie',
      description: 'Envoyez des messages privés à vos amis en temps réel',
    },
    {
      icon: Users,
      title: 'Amis',
      description: 'Trouvez et connectez-vous avec d\'autres utilisateurs',
    },
    {
      icon: Share2,
      title: 'Partage',
      description: 'Partagez photos, vidéos et vos pensées avec la communauté',
    },
    {
      icon: Zap,
      title: 'Stories',
      description: 'Créez des stories éphémères qui disparaissent après 24h',
    },
    {
      icon: Shield,
      title: 'Confidentialité',
      description: 'Contrôlez vos paramètres de sécurité et de confidentialité',
    },
    {
      icon: Settings,
      title: 'Paramètres',
      description: 'Personnalisez votre profil et vos préférences',
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
            Bienvenue sur Unify ! 👋
          </h1>
          <p className="text-white/80 text-lg">
            Découvrez comment utiliser toutes les fonctionnalités
          </p>
        </motion.div>

        {/* Guide Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-colors h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-br from-primary-dark to-accent-dark p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg mb-2">
                          {guide.title}
                        </h3>
                        <p className="text-white/70">{guide.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Quelques conseils pour bien commencer 💡
          </h2>
          <ul className="space-y-4 text-white/80">
            <li className="flex items-start space-x-3">
              <span className="text-accent-dark text-xl mt-1">✓</span>
              <span>Complétez votre profil avec une photo et une bio intéressante</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-accent-dark text-xl mt-1">✓</span>
              <span>Trouvez vos amis en les recherchant par nom d'utilisateur</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-accent-dark text-xl mt-1">✓</span>
              <span>Respectez les règles de communauté et soyez bienveillant</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-accent-dark text-xl mt-1">✓</span>
              <span>Explorez les différentes sections de l'application</span>
            </li>
          </ul>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-white/10 border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
          >
            Retour
          </button>
          <Link href="/terms">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-xl"
            >
              <span>Conditions d'utilisation</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
