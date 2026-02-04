'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const purpose = (params.get('purpose') as 'signup' | 'reset') || 'signup';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{6}$/.test(code)) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      if (purpose === 'signup') {
        router.push('/auth/login?verified=true');
      } else if (purpose === 'reset') {
        // If server returned a resetToken, navigate to reset-password with it
        const token = data.resetToken;
        if (token) {
          router.push(`/auth/reset-password?token=${encodeURIComponent(token)}`);
        } else {
          router.push('/auth/login');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2">Enter verification code</h2>
        <p className="text-sm text-gray-600 mb-4">We sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            className="w-full px-4 py-3 border rounded"
          />

          <button disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded">{loading ? 'Verifying...' : 'Verify'}</button>
        </form>
      </div>
    </div>
  );
}
