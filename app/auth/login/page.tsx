'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface LoginHistory {
  id: string;
  userId: string;
  email: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string | null;
    email: string | null;
  };
  loginAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const { translation } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [rememberPassword, setRememberPassword] = useState(false);

  // Fetch login history on mount
  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const response = await fetch('/api/auth/login-history');
        if (response.ok) {
          const data = await response.json();
          setLoginHistory(data);
        }
      } catch (error) {
        console.error('Error fetching login history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchLoginHistory();
  }, []);

  // When a user is selected, fill email
  const handleSelectUser = (userEmail: string) => {
    setEmail(userEmail);
    setSelectedUser(userEmail);

    // If we have a saved password for this email, auto-login
    const saved = getSavedCredential(userEmail);
    if (saved) {
      setLoading(true);
      (async () => {
        try {
          const result = await signIn('credentials', {
            email: userEmail,
            password: saved,
            redirect: false,
          });

          if (result?.error) {
            setError(translation.common.error);
            setPassword('');
          } else if (result?.ok) {
            router.push('/');
            router.refresh();
          }
        } catch (err) {
          console.error('Auto sign-in failed:', err);
          setPassword('');
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    // Otherwise clear password field for manual entry
    setPassword('');
  };

  const handleDeleteLogin = async (id: string, userEmail?: string) => {
    try {
      // Optimistic update
      setLoginHistory((prev) => prev.filter((l) => l.id !== id));
      if (selectedUser === userEmail) {
        setSelectedUser(null);
        setEmail('');
      }

      await fetch('/api/auth/login-history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Failed to delete login entry:', err);
    }
  };

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
      } else if (result?.ok) {
        // Record login history
        try {
          await fetch('/api/auth/login-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              userAgent: navigator.userAgent,
            }),
          });
        } catch (err) {
          console.error('Error recording login:', err);
        }
        
        router.push('/');
        router.refresh();
        // Save credential locally if user opted in
        try {
          if (rememberPassword) saveCredential(email, password);
          else removeSavedCredential(email);
        } catch (e) {
          console.warn('Failed to save credential locally:', e);
        }
        // Register saved device server-side when opted in
        try {
          if (rememberPassword) {
            await fetch('/api/auth/saved-devices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                deviceName: typeof navigator !== 'undefined' ? navigator.platform : undefined,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
              }),
            });
          }
        } catch (e) {
          console.warn('Failed to register saved device server-side:', e);
        }
      }
    } catch (error) {
      setError(translation.common.error);
    } finally {
      setLoading(false);
    }
  };


  // Credential storage helpers (localStorage - base64 obfuscation)
  const credentialKey = (email: string) => `unify:cred:${email}`;

  function saveCredential(email: string, password: string) {
    try {
      const payload = { password: btoa(password) };
      localStorage.setItem(credentialKey(email), JSON.stringify(payload));
    } catch (e) {
      console.warn('Unable to save credential:', e);
    }
  }

  function getSavedCredential(email: string): string | null {
    try {
      const raw = localStorage.getItem(credentialKey(email));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.password ? atob(parsed.password) : null;
    } catch (e) {
      console.warn('Unable to read saved credential:', e);
      return null;
    }
  }

  function removeSavedCredential(email: string) {
    try {
      localStorage.removeItem(credentialKey(email));
    } catch (e) {
      console.warn('Unable to remove saved credential:', e);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-amber-900 to-primary-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Login History */}
          {!loadingHistory && loginHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Connexions récentes</h2>
              <div className="grid gap-4">
                {loginHistory.map((login, index) => (
                  <motion.div
                    key={login.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`relative p-4 rounded-lg backdrop-blur-md transition-all duration-300 text-left ${
                      selectedUser === (login.user.email || login.email)
                        ? 'bg-white/20 border-2 border-white'
                        : 'bg-white/10 border-2 border-transparent hover:bg-white/15'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectUser(login.user.email || login.email)}
                      className="w-full text-left flex items-center gap-4"
                      type="button"
                    >
                      {login.user.avatar ? (
                        <img
                          src={login.user.avatar}
                          alt={login.user.fullName}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-dark to-accent-dark flex items-center justify-center text-white font-bold text-lg">
                          {login.user.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold">{login.user.fullName}</p>
                        <p className="text-white/70 text-sm">@{login.user.username}</p>
                        <p className="text-white/50 text-xs mt-1">
                          {new Date(login.loginAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLogin(login.id, login.user.email || login.email);
                      }}
                      className="absolute top-3 right-3 p-1 text-white/80 hover:text-red-400"
                      aria-label="Supprimer"
                      type="button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
              <p className="text-white/60 text-sm mt-4">
                Ou connectez-vous avec un autre compte ci-contre
              </p>
            </motion.div>
          )}

          {/* Right side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center"
          >
            <Card className="shadow-2xl bg-white/95 w-full max-w-md mx-auto">
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="email@example.com"
                    required
                  />

                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label={translation.auth.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                  <div className="flex items-center gap-2">
                    <input
                      id="rememberPassword"
                      type="checkbox"
                      checked={rememberPassword}
                      onChange={(e) => setRememberPassword(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="rememberPassword" className="text-sm text-gray-600">
                      Enregistrer le mot de passe sur cet appareil
                    </label>
                  </div>

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
      </motion.div>
    </div>
  );
}