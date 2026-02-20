"use client";

import React, { useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import useLive from '@/hooks/useLive';
import LiveStreamer from '@/components/live/LiveStreamer';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { LiveSkeleton } from '@/components/skeletons/LiveSkeleton';

export default function LivePage() {
  const { isReady } = useRequireAuth();
  const { rooms } = useLive();
  const { translation } = useLanguage();
  const [displayName, setDisplayName] = useState('Guest');
  const [role, setRole] = useState<'host' | 'participant' | 'viewer'>('participant');
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Simulate loading - rooms data comes from useLive hook
    if (rooms) {
      setLoading(false);
    }
  }, [rooms]);

  // Conditional rendering (after all hooks)
  if (!isReady) {
    return <LiveSkeleton />;
  }

  if (loading) {
    return (
      <MainLayout>
        <LiveSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{translation.live.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{translation.live.subtitle}</p>
          </div>
          <button
            onClick={() => setShowLiveModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            {translation.live.goLive}
          </button>
        </div>

        {/* User Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-900 mb-2">{translation.live.displayName}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
              placeholder={translation.live.displayNamePlaceholder}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <label htmlFor="role-select" className="block text-sm font-medium text-slate-900 mb-2">{translation.live.joinAs}</label>
            <select
              id="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="participant">{translation.live.broadcaster}</option>
              <option value="viewer">{translation.live.spectator}</option>
            </select>
          </div>
        </div>

        {/* Active Rooms */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">{translation.live.activeStreams}</h2>
            <span className="text-sm text-slate-500">{rooms?.length || 0} {translation.live.live}</span>
          </div>

          {rooms && rooms.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room: any) => (
                <div
                  key={room.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1 overflow-hidden border border-slate-200"
                >
                  {/* Thumbnail */}
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 h-40 flex items-center justify-center">
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                    <div className="text-4xl">📹</div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">{room.title}</h3>
                    <p className="text-xs text-slate-500 mt-2">�️ {room.participantCount || 0} {translation.live.watching}</p>

                    <button
                      onClick={() => setSelectedRoomId(room.id)}
                      className="w-full mt-3 px-3 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                    >
                      {translation.live.join}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-12 text-center border border-slate-200">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-slate-600 mb-4">{translation.live.noActiveStreams}</p>
              <button
                onClick={() => setShowLiveModal(true)}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium"
              >
                {translation.live.startOneNow}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Streamer Modal / Component */}
      {showLiveModal && (
        <LiveStreamer displayName={displayName} role={role === 'host' ? 'host' : role} autoStart={true} onClose={() => setShowLiveModal(false)} />
      )}

      {/* Viewer Mode: Open Selected Room */}
      {selectedRoomId && role === 'viewer' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <LiveStreamer
              roomId={selectedRoomId}
              displayName={displayName}
              role="viewer"
              autoStart={true}
              onClose={() => setSelectedRoomId(null)}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
