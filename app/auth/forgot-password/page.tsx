'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSubmitted(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-center text-gray-600 text-sm mb-6">
            Enter your email address and we'll send you a link to reset your password
          </p>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                Check your email for password reset instructions. If you don't see it, check your spam folder.
              </p>
            </div>
          ) : null}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                disabled={loading || submitted}
              />
            </div>

            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : submitted ? 'Email Sent' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Back to Login
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/auth/register"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
