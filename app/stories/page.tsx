'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Stories } from '@/components/Stories';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function StoriesPage() {
  const { translation } = useLanguage();

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Stories</h1>
        <p className="text-gray-600 mb-8">Découvrez les stories de vos amis</p>

        <Stories />
      </motion.div>
    </MainLayout>
  );
}