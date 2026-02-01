'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface SavedDevice {
  id: string;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export default function SavedDevicesView({ userId }: { userId: string | undefined | null }) {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<SavedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchDevices = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/saved-devices`);
        if (res.ok) {
          const data = await res.json();
          setDevices(data.devices || []);
        }
      } catch (e) {
        console.error('Failed to fetch saved devices', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [userId]);

  const handleRemove = async (id: string) => {
    if (!userId) return;
    setRemoving(id);
    try {
      const res = await fetch(`/api/users/${userId}/saved-devices?deviceId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDevices((d) => d.filter((x) => x.id !== id));
      }
    } catch (e) {
      console.error('Failed to remove device', e);
    } finally {
      setRemoving(null);
    }
  };

  if (!session || session.user?.id !== userId) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Appareils enregistrés</h2>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="animate-spin" /> Chargement...</div>
      ) : devices.length === 0 ? (
        <p className="text-sm text-gray-600">Aucun appareil enregistré.</p>
      ) : (
        <div className="space-y-3">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{d.deviceName || new Date(d.createdAt).toLocaleString()}</div>
                <div className="text-sm text-gray-600">{d.userAgent || ''}</div>
              </div>
              <div>
                <Button size="sm" variant="outline" onClick={() => handleRemove(d.id)} disabled={removing === d.id}>
                  {removing === d.id ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
