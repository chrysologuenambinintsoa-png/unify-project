'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { translation } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(translation.common.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError(translation.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      setError(translation.common.error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signIn('facebook', { callbackUrl: '/' });
    } catch (error) {
      setError(translation.common.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-amber-900 to-primary-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl bg-white/95">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-to-br from-primary-dark to-accent-dark rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <img src="/logo.svg" alt="Unify Logo" className="w-12 h-12" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900">
              {translation.pages.welcome}
            </h1>
            <p className="text-gray-600 mt-2">{translation.auth.signIn}</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <Input
                type="email"
                label={translation.auth.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />

              <Input
                type="password"
                label={translation.auth.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary-dark hover:text-accent-dark font-semibold transition-colors"
                >
                  {translation.auth.forgotPassword}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-dark to-accent-dark hover:from-primary-light hover:to-accent-light text-white"
                disabled={loading}
              >
                {loading ? translation.common.loading : translation.auth.signIn}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {translation.auth.loginWithGoogle}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleFacebookSignIn}
              >
                <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {translation.auth.loginWithFacebook}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              {translation.auth.noAccount}{' '}
              <Link
                href="/auth/register"
                className="text-primary-dark font-medium hover:text-primary-light transition-colors"
              >
                {translation.auth.createAccount}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}