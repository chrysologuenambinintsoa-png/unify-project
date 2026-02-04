'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { CopyrighFooter } from '@/components/CopyrighFooter';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const { translation } = useLanguage();

  const sections = [
    {
      title: '1. Collecte des Données',
      content: `Chez Unify, nous collectons les données suivantes pour améliorer votre expérience :`,
      items: [
        'Informations de compte (nom, email, nom d\'utilisateur)',
        'Contenu que vous publiez (textes, images, vidéos)',
        'Informations de profil (photo de profil, bio, localisation)',
        'Données d\'utilisation et de navigation',
        'Informations de localisation (avec votre consentement)',
        'Adresse IP et identifiants d\'appareil',
        'Cookies et données de session',
        'Historique des interactions (likes, commentaires, partages)',
      ]
    },
    {
      title: '2. Utilisation des Données',
      content: `Nous utilisons vos données pour :`,
      items: [
        'Fournir et améliorer nos services',
        'Personnaliser votre expérience utilisateur',
        'Faciliter les communications entre utilisateurs',
        'Assurer la sécurité de votre compte',
        'Envoyer des notifications importantes',
        'Analyser les tendances d\'utilisation',
        'Prévenir les fraudes et abus',
        'Respecter nos obligations légales',
      ]
    },
    {
      title: '3. Partage des Données',
      content: `Nous ne partageons vos données personnelles que dans les cas suivants :`,
      items: [
        'Avec votre consentement explicite',
        'Pour se conformer aux obligations légales',
        'Pour protéger nos droits et notre sécurité',
        'Avec nos partenaires de service (dans le cadre strict de nos services)',
        'En cas de fusion ou d\'acquisition de notre entreprise',
      ]
    },
    {
      title: '4. Sécurité des Données',
      content: `Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre tout accès non autorisé, modification ou destruction. Nous utilisons le chiffrement SSL/TLS, les pare-feu, et des contrôles d'accès rigoureux. Cependant, aucune méthode de transmission sur Internet n'est 100% sécurisée.`,
      items: []
    },
    {
      title: '5. Vos Droits (RGPD)',
      content: `Conformément au Règlement Général sur la Protection des Données (RGPD), vous avez le droit de :`,
      items: [
        'Accéder à vos données personnelles',
        'Demander la correction de vos données inexactes',
        'Demander la suppression de votre compte et de vos données',
        'Vous opposer au traitement de vos données',
        'Retirer votre consentement à tout moment',
        'Obtenir une copie de vos données',
        'Demander la limitation du traitement',
        'Demander la portabilité des données',
      ]
    },
    {
      title: '6. Cookies et Suivi',
      content: `Unify utilise des cookies pour améliorer votre expérience, analyser l'utilisation du site et afficher des publicités pertinentes. Les types de cookies utilisés sont :`,
      items: [
        'Cookies essentiels : Nécessaires au fonctionnement du site',
        'Cookies de performance : Analysent comment vous utilisez le site',
        'Cookies de fonctionnalité : Mémorisent vos préférences',
        'Cookies de publicité : Pour vous montrer des contenus pertinents',
      ]
    },
    {
      title: '7. Rétention des Données',
      content: `Nous conservons vos données aussi longtemps que nécessaire pour vous fournir nos services. Vous pouvez demander la suppression de votre compte à tout moment, ce qui entraînera la suppression de vos données personnelles (sauf si la loi exige leur conservation).`,
      items: []
    },
    {
      title: '8. Modifications de cette Politique',
      content: `Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications importantes seront communiquées aux utilisateurs par email ou par notification dans l'application. Votre utilisation continue du service après les modifications constitue votre acceptation.`,
      items: []
    },
    {
      title: '9. Contrôle Parental',
      content: `Unify s'engage à protéger la vie privée des enfants. Les mineurs de moins de 13 ans ne peuvent pas créer de compte. Pour les utilisateurs de 13 à 18 ans, nous appliquons des restrictions supplémentaires.`,
      items: []
    },
    {
      title: '10. Contact et Réclamations',
      content: `Si vous avez des questions concernant cette politique ou si vous souhaitez exercer vos droits, veuillez nous contacter à :`,
      items: [
        'Email : privacy@unify.com',
        'Adresse : [Adresse de l\'entreprise]',
        'Vous avez également le droit de déposer une plainte auprès de votre autorité de protection des données locale.',
      ]
    },
  ];

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            🔒 {translation.pages.privacy}
          </motion.h1>
          <p className="text-gray-500 text-lg mb-8">
            Dernière mise à jour : Février 2026
          </p>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 leading-relaxed mb-8 text-base">
              Chez Unify, nous prenons votre vie privée très au sérieux. Cette politique de confidentialité explique comment nous collectons, utilisons, protégeons et partageons vos données personnelles. En utilisant Unify, vous acceptez les pratiques décrites dans cette politique.
            </p>

            {sections.map((section, index) => (
              <motion.section 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {section.content}
                </p>
                {section.items.length > 0 && (
                  <ul className="list-disc pl-6 text-gray-600 space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                )}
              </motion.section>
            ))}

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 pt-8 border-t border-gray-200"
            >
              <p className="text-gray-500 text-sm">
                Politique de confidentialité de Unify © 2026. Tous droits réservés.
              </p>
            </motion.section>
          </div>
        </div>

        <CopyrighFooter />
      </motion.div>
    </MainLayout>
  );
}