"use client";

import { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import useLive from '@/hooks/useLive';

export default function LiveIcon() {
  const { rooms } = useLive();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(rooms?.reduce((acc, r) => acc + (r.participantCount || 0), 0) || 0);
  }, [rooms]);

  return (
    <>
      <Video className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
      <Badge count={count} />
    </>
  );
}
