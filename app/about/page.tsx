'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const { translation } = useLanguage();

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-primary-dark rounded-3xl flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-white font-bold text-5xl">U</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {translation.pages.welcome}
          </h1>
          <p className="text-xl text-gray-600">
            La plateforme de réseau social moderne qui vous connecte avec le monde
          </p>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notre Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Unify est née de la volonté de créer une plateforme de réseau sociale moderne, 
              intuitive et respectueuse de la vie privée. Notre mission est de connecter les 
              personnes du monde entier de manière simple et élégante.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nos Valeurs</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-primary-dark mr-2">✓</span>
                <span>Respect de la vie privée et des données personnelles</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-dark mr-2">✓</span>
                <span>Innovation continue et technologies modernes</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-dark mr-2">✓</span>
                <span>Expérience utilisateur fluide et intuitive</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-dark mr-2">✓</span>
                <span>Communauté diverse et inclusive</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-dark mr-2">✓</span>
                <span>Transparence et honnêteté</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Fonctionnalités</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-primary-dark mb-2">Publications</h3>
                <p className="text-sm text-gray-600">Partagez vos pensées, photos et vidéos avec votre communauté</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-primary-dark mb-2">Stories</h3>
                <p className="text-sm text-gray-600">Partagez des moments éphémères avec vos amis</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-primary-dark mb-2">Messages</h3>
                <p className="text-sm text-gray-600">Discutez en temps réel avec vos contacts</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-primary-dark mb-2">Groupes</h3>
                <p className="text-sm text-gray-600">Créez et rejoignez des communautés partageant vos intérêts</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Link href="/">
              <button className="px-8 py-3 bg-primary-dark text-white rounded-xl font-medium hover:bg-primary-light transition-colors shadow-lg">
                Commencer
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
}