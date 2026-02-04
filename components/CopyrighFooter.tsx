'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export const CopyrighFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { translation } = useLanguage();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-16 pt-8 border-t border-white/10"
    >
      <div className="text-center space-y-2">
        <p className="text-white/60 text-sm">
          © {currentYear} Unify. {translation.copyright.allRights}
        </p>
        <p className="text-white/40 text-xs">
          {translation.copyright.socialPlatform}
        </p>
        <div className="flex justify-center gap-4 text-white/50 text-xs pt-2">
          <a href="/privacy" className="hover:text-white/80 transition-colors">
            {translation.copyright.privacyLink}
          </a>
          <span>•</span>
          <a href="/terms" className="hover:text-white/80 transition-colors">
            {translation.copyright.termsLink}
          </a>
          <span>•</span>
          <a href="/help" className="hover:text-white/80 transition-colors">
            {translation.copyright.helpLink}
          </a>
        </div>
      </div>
    </motion.footer>
  );
};
