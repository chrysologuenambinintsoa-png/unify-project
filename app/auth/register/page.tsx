'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { translation } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          password: formData.password,
        }),
      });

      if (response.ok) {
        // Connecter automatiquement l'utilisateur
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          // Rediriger vers la page d'accueil
          router.push('/');
        } else {
          // Si la connexion échoue, rediriger vers le login
          router.push('/auth/login?registered=true');
        }
      } else {
        const data = await response.json();
        setError(data.error || translation.common.error);
      }
    } catch (error) {
      setError(translation.common.error);
    } finally {
      setLoading(false);
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
            <p className="text-gray-600 mt-2">{translation.auth.signUp}</p>
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
                type="text"
                name="username"
                label={translation.auth.username}
                value={formData.username}
                onChange={handleChange}
                placeholder="@username"
                required
              />

              <Input
                type="text"
                name="fullName"
                label={translation.auth.fullName}
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />

              <Input
                type="date"
                name="dateOfBirth"
                label={translation.settings.dateOfBirth}
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />

              <Input
                type="email"
                name="email"
                label={translation.auth.email}
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label={translation.auth.password}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-primary-dark transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
              />

              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                label={translation.auth.confirmPassword}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-500 hover:text-primary-dark transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-dark to-accent-dark hover:from-primary-light hover:to-accent-light text-white"
                disabled={loading}
              >
                {loading ? translation.common.loading : translation.auth.signUp}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              {translation.auth.hasAccount}{' '}
              <Link
                href="/auth/login"
                className="text-primary-dark font-medium hover:text-primary-light transition-colors"
              >
                {translation.auth.signIn}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}