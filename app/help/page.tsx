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

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row justify-center gap-6 mb-12"
        >
          <Link href="/settings">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-xl"
            >
              <span>Accéder aux paramètres</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>

          <Link href="/privacy">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-colors border border-white/30 shadow-xl"
            >
              <span>Politique de confidentialité</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Questions Fréquemment Posées</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Comment puis-je créer une publication ?',
                a: 'Sur la page d\'accueil, cliquez sur le champ "Quoi de neuf ?" et composez votre message. Vous pouvez ajouter des images, des vidéos et du contenu riche.'
              },
              {
                q: 'Comment puis-je ajouter des amis ?',
                a: 'Utilisez l\'onglet Explore pour rechercher des utilisateurs, puis cliquez sur "Ajouter comme ami" pour envoyer une demande d\'amitié.'
              },
              {
                q: 'Mes données sont-elles sécurisées ?',
                a: 'Oui, nous utilisons le chiffrement SSL/TLS et nous nous conformons aux normes RGPD pour protéger vos données personnelles.'
              },
              {
                q: 'Comment puis-je supprimer mon compte ?',
                a: 'Allez dans Paramètres → Compte et cliquez sur "Supprimer le compte". Toutes vos données seront supprimées définitivement.'
              },
            ].map((faq, index) => (
              <div key={index} className="border-b border-white/10 pb-6 last:border-b-0">
                <h3 className="text-white font-bold mb-2">❓ {faq.q}</h3>
                <p className="text-white/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer with CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-8"
        >
          <h3 className="text-white text-lg font-bold mb-4">Vous avez d'autres questions ?</h3>
          <Link href="mailto:support@unify.com">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
            >
              Nous contacter
            </motion.button>
          </Link>
        </motion.div>

        <CopyrighFooter />
      </div>
    </div>
  );
}
