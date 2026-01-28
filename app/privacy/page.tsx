'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const { translation } = useLanguage();

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {translation.pages.privacy}
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Collecte des Données</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Chez Unify, nous collectons les données suivantes pour améliorer votre expérience :
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Informations de compte (nom, email, nom d'utilisateur)</li>
                <li>Contenu que vous publiez (textes, images, vidéos)</li>
                <li>Informations de profil (photo de profil, bio)</li>
                <li>Données d'utilisation et de navigation</li>
                <li>Informations de localisation (avec votre consentement)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Utilisation des Données</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous utilisons vos données pour :
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Fournir et améliorer nos services</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Faciliter les communications entre utilisateurs</li>
                <li>Assurer la sécurité de votre compte</li>
                <li>Envoyer des notifications importantes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Partage des Données</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous ne partageons vos données personnelles que dans les cas suivants :
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Avec votre consentement explicite</li>
                <li>Pour se conformer aux obligations légales</li>
                <li>Pour protéger nos droits et notre sécurité</li>
                <li>Avec nos partenaires de service (dans le cadre strict de nos services)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sécurité des Données</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données
                contre tout accès non autorisé, modification ou destruction. Cependant, aucune méthode
                de transmission sur Internet n'est 100% sécurisée.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Vos Droits</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Vous avez le droit de :
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Accéder à vos données personnelles</li>
                <li>Demander la correction de vos données</li>
                <li>Demander la suppression de votre compte et de vos données</li>
                <li>Vous opposer au traitement de vos données</li>
                <li>Retirer votre consentement à tout moment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Unify utilise des cookies pour améliorer votre expérience, analyser l'utilisation du site
                et afficher des publicités pertinentes. Vous pouvez gérer vos préférences en matière de
                cookies dans les paramètres de votre navigateur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Modifications</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous pouvons mettre à jour cette politique de confidentialité de temps à autre.
                Nous vous informerons de toute modification importante par email ou via notre plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                Pour toute question concernant cette politique de confidentialité ou vos données
                personnelles, veuillez nous contacter à : privacy@unify.com
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Link href="/">
            <button className="px-8 py-3 bg-primary-dark text-white rounded-xl font-medium hover:bg-primary-light transition-colors shadow-lg">
              Retour à l'accueil
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}