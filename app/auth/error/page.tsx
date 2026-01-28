'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const { translation } = useLanguage();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-accent flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4"
            >
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">
              {translation.common.error}
            </h1>
          </CardHeader>

          <CardContent className="text-center">
            <p className="text-white/80 mb-6">
              {getErrorMessage(error)}
            </p>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                {translation.auth.signIn}
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/welcome">
                {translation.common.back}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}