'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  useEffect(() => {
    if (userId) {
      // Redirect to the profile page
      router.push(`/users/${userId}/profile`);
    }
  }, [userId, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <></>
    </div>
  );
}
