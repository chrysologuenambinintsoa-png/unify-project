/* eslint-disable react/no-unknown-property */
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import useLive from '@/hooks/useLive';
import { useLanguage } from '@/contexts/LanguageContext';

type Role = 'host' | 'participant' | 'viewer';

type Props = {
  roomId?: string;
  displayName?: string;
  role?: Role;
  myId?: string;
  onClose?: () => void;
  autoStart?: boolean;
};

export default function LiveStreamer({ roomId: initialRoomId, displayName = 'Guest', role = 'participant', myId: initialMyId, onClose, autoStart = false }: Props) {
  const { send, onMessage, rooms } = useLive();
  const { translation } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);

  // State
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [myId, setMyId] = useState(initialMyId || null);
  const [step, setStep] = useState<'setup' | 'streaming'>('setup');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamOn, setStreamOn] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [messages, setMessages] = useState<Array<{ id: string; from: string; text: string }>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; timestamp: number }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [canPreview, setCanPreview] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<{ video: boolean; audio: boolean }>({ video: false, audio: false });
  const [chatOpen, setChatOpen] = useState(true);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [pinnedComment, setPinnedComment] = useState<{ id: string; from: string; text: string } | null>(null);

  // Handle microphone toggle - auto-enable camera when mic is enabled
  useEffect(() => {
    if (micOn && !camOn && step === 'setup') {
      // Auto-enable camera when mic is turned on
      console.log('[LiveStreamer] Auto-enabling camera when mic is activated');
      setCamOn(true);
    }
  }, [micOn, camOn, step]);


  // Check available devices on component mount
  useEffect(() => {
    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === 'videoinput' && d.deviceId);
        const hasAudio = devices.some(d => d.kind === 'audioinput' && d.deviceId);
        console.log('[LiveStreamer] Available devices:', { hasVideo, hasAudio, totalDevices: devices.length });
        setAvailableDevices({ video: hasVideo, audio: hasAudio });
      } catch (e) {
        console.warn('[LiveStreamer] Could not enumerate devices:', e);
      }
    })();
  }, []);

  // Setup camera preview for modal or broadcast setup
  useEffect(() => {
    console.log('[LiveStreamer] Camera effect triggered:', { step, canPreview, role, cameraError });
    
    // Only setup if: in streaming mode OR in setup mode with preview enabled AND not a viewer
    if (step === 'setup' && !canPreview) {
      console.log('[LiveStreamer] Skipping: setup mode without preview requested');
      return;
    }
    if (role === 'viewer') {
      console.log('[LiveStreamer] Skipping: user is viewer');
      return;
    }
    
    let mounted = true;

    async function setupPreview() {
      try {
        console.log('[LiveStreamer] Starting camera with:', { camOn, micOn });
        
        // Build constraints - start simple
        const constraints: any = {};
        
        if (camOn) {
          constraints.video = true; // Start with true, no constraints
        }
        if (micOn) {
          constraints.audio = true;
        }
        
        console.log('[LiveStreamer] getUserMedia constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[LiveStreamer] Camera stream obtained:', stream);
        
        if (!mounted) {
          console.log('[LiveStreamer] Component unmounted, stopping tracks');
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('[LiveStreamer] Video ref updated with stream');
        } else {
          console.warn('[LiveStreamer] Video ref is null');
        }
      } catch (e: any) {
        console.error('[LiveStreamer] Camera access failed in setupPreview:', e.name, e.message);
        if (mounted) {
          // Don't block — just log the error and continue with black screen
          console.log('[LiveStreamer] Proceeding without camera');
        }
      }
    }

    setupPreview();

    const cleanup = () => {
      console.log('[LiveStreamer] Cleaning up camera');
      mounted = false;
      try { 
        localStreamRef.current?.getTracks().forEach((t) => {
          console.log('[LiveStreamer] Stopping track:', t.kind);
          t.stop();
        }); 
      } catch (e) {
        console.warn('[LiveStreamer] Cleanup error:', e);
      }
    };

    return cleanup;
  }, [canPreview, camOn, micOn, role, step]);

  // WebRTC signaling and message handling
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    const unsub = onMessage((m: any) => {
      if (!m || m.roomId !== roomId) return;

      if (m.type === 'comment') {
        setMessages((prev) => [...prev.slice(-9), { id: `c_${Date.now()}`, from: m.payload?.from || 'Guest', text: m.payload?.text || '' }]);
      }

      if (m.type === 'reaction') {
        const reactId = `react_${Date.now()}_${Math.random()}`;
        const emoji = m.payload?.reaction || '❤️';
        setReactions((prev) => [...prev, { id: reactId, emoji, timestamp: Date.now() }]);
        
        // Remove reaction animation after 2 seconds
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reactId));
        }, 2000);
      }

      if (m.type === 'offer') {
        const from = m.payload?.from;
        const sdp = m.payload?.sdp;
        if (from && sdp) handleOffer(from, sdp);
      }

      if (m.type === 'answer') {
        const from = m.payload?.from;
        const sdp = m.payload?.sdp;
        if (from && sdp && pcsRef.current[from]) {
          pcsRef.current[from].setRemoteDescription(new RTCSessionDescription(sdp)).catch(() => {});
        }
      }

      if (m.type === 'ice') {
        const from = m.payload?.from;
        const candidate = m.payload?.candidate;
        if (from && candidate && pcsRef.current[from]) {
          pcsRef.current[from].addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
      }

      if (m.type === 'viewerJoined') {
        const p = m.payload?.participant;
        if (p && (role === 'host' || role === 'participant')) {
          createPeerAndOffer(p.id);
        }
      }
    });

    return () => {
      unsub();
    };
  }, [roomId, role, onMessage]);

  function getIceServers() {
    return [{ urls: 'stun:stun.l.google.com:19302' }];
  }

  function createPeerAndOffer(remoteId: string) {
    if (pcsRef.current[remoteId]) return;
    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    pcsRef.current[remoteId] = pc;

    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) pc.addTrack(track, localStreamRef.current);
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate && roomId && myId) send({ type: 'ice', roomId, to: remoteId, payload: { from: myId, candidate: ev.candidate } });
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams?.[0];
      if (stream) setRemoteStreams((prev) => ({ ...prev, [remoteId]: stream }));
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        if (roomId && myId) send({ type: 'offer', roomId, to: remoteId, payload: { from: myId, sdp: pc.localDescription } });
      })
      .catch((e) => console.warn('createOffer failed', e));
  }

  async function handleOffer(from: string, sdp: any) {
    let pc = pcsRef.current[from];
    if (!pc) {
      pc = new RTCPeerConnection({ iceServers: getIceServers() });
      pcsRef.current[from] = pc;

      pc.onicecandidate = (ev) => {
        if (ev.candidate && roomId && myId) send({ type: 'ice', roomId, to: from, payload: { from: myId, candidate: ev.candidate } });
      };

      pc.ontrack = (ev) => {
        const stream = ev.streams?.[0];
        if (stream) setRemoteStreams((prev) => ({ ...prev, [from]: stream }));
      };

      if (role !== 'viewer' && localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) pc.addTrack(track, localStreamRef.current);
      }
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (roomId && myId) send({ type: 'answer', roomId, to: from, payload: { from: myId, sdp: pc.localDescription } });
    } catch (e) {
      console.warn('handleOffer error', e);
    }
  }

  const startSession = async () => {
    console.log('[LiveStreamer] startSession clicked', { availableDevices });
    
    // Don't block if no camera — just attempt to preview
    if (availableDevices.video) {
      console.log('[LiveStreamer] Camera available, attempting to access...');
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        console.log('[LiveStreamer] ✅ Video access successful!');
        testStream.getTracks().forEach(t => t.stop());
        setCameraError(null);
      } catch (e: any) {
        console.error('[LiveStreamer] Camera access failed:', e.name, e.message);
        setCameraError(`Camera blocked: ${e.message}. Proceeding without camera.`);
      }
    } else {
      console.log('[LiveStreamer] No camera detected. Proceeding without camera.');
      setCameraError('No camera detected. Proceeding with audio/streaming only.');
    }
    
    // Always allow preview, even without camera
    setCanPreview(true);
  };

  // Auto-start preview when `autoStart` is enabled and a camera is available
  useEffect(() => {
    if (!autoStart) return;
    if (role === 'viewer') return;
    if (!availableDevices.video) return;
    if (canPreview) return;

    // fire-and-forget; startSession shows diagnostics and requests permission
    startSession().catch((e) => {
      console.warn('[LiveStreamer] autoStart startSession failed', e);
    });
  }, [autoStart, role, availableDevices.video, canPreview]);

  const goLive = async () => {
    try {
      // Create room via HTTP
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: streamTitle || 'Live Stream', hostId: displayName }),
      });
      const data = await res.json();
      if (!data?.ok || !data?.room?.id) throw new Error('Failed to create room');

      const id = data.room.id;
      const uid = `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      setRoomId(id);
      setMyId(uid);
      send({ type: 'joinRoom', roomId: id, payload: { id: uid, name: displayName, role: 'host' } });
      setStep('streaming');
      setStreamOn(true);
    } catch (e) {
      console.warn('goLive failed', e);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !roomId) return;
    const newMessage = {
      id: `msg_${Date.now()}`,
      from: displayName,
      text: messageInput.trim(),
    };
    setMessages((prev) => [...prev, newMessage]);
    send({ type: 'comment', roomId, payload: { from: displayName, text: messageInput.trim() } });
    setMessageInput('');
  };

  const sendReaction = (emoji: string = '❤️') => {
    if (!roomId) return;
    const reactionId = `react_${Date.now()}_${Math.random()}`;
    setReactions((prev) => [...prev, { id: reactionId, emoji, timestamp: Date.now() }]);
    send({ type: 'reaction', roomId, payload: { from: myId || displayName, reaction: emoji } });
    
    // Remove reaction animation after 2 seconds
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 2000);
  };

  // Handle fullscreen change (including Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle fullscreen request when fullscreen container is ready
  useEffect(() => {
    if (isFullscreen && fullscreenContainerRef.current && !document.fullscreenElement) {
      console.log('[Fullscreen] Requesting fullscreen on fullscreen container');
      fullscreenContainerRef.current.requestFullscreen({ navigationUI: 'hide' }).catch((err) => {
        console.error('[Fullscreen] Request failed on fullscreen container:', err);
      });
    }
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Request fullscreen - will be handled by useEffect
      setIsFullscreen(true);
    } else {
      // Exiting fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error('[Fullscreen] Exit failed:', err);
        });
      }
      setIsFullscreen(false);
    }
  };

  const sendInvite = () => {
    if (!roomId || !myId) return;
    const inviteLink = `${window.location.origin}/live?roomId=${roomId}&role=participant`;
    
    // Try to copy invite link to clipboard
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        alert(`Invite link copied: ${inviteLink}`);
      })
      .catch((e) => {
        console.error('Failed to copy to clipboard:', e);
        alert(`Invite link: ${inviteLink}`);
      });
  };

  const endStream = async () => {
    try {
      // stop local tracks
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (e) {}

    if (roomId) send({ type: 'leaveRoom', roomId });
    setRoomId(null);
    setMyId(null);
    setStep('setup');
    setStreamOn(false);
    onClose?.();
  };

  // mediasoup client setup for producing local tracks
  async function setupMediasoupProducer(roomIdParam: string, localStream: MediaStream) {
    try {
      const res = await fetch(`/api/live/${roomIdParam}/mediasoup/create-transport`, { method: 'POST' });
      const data = await res.json();
      if (!data.ok || !data.transport) throw new Error(data.error || 'create transport failed');

      const transportParams = data.transport;
      const routerRtpCapabilities = data.transport.routerRtpCapabilities;

      // dynamic import to avoid SSR issues
      const { Device } = await import('mediasoup-client');
      const device = new Device();
      await device.load({ routerRtpCapabilities });

      const sendTransport = device.createSendTransport(transportParams as any);

      // connect event
      sendTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
        try {
          const r = await fetch(`/api/live/${roomIdParam}/mediasoup/connect-transport`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transportId: transportParams.id, dtlsParameters }),
          });
          const j = await r.json();
          if (j.ok) callback(); else errback(new Error(j.error || 'connect failed'));
        } catch (err) { errback(err); }
      });

      // produce event
      sendTransport.on('produce', async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
        try {
          const r = await fetch(`/api/live/${roomIdParam}/mediasoup/produce`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transportId: transportParams.id, kind, rtpParameters }),
          });
          const j = await r.json();
          if (j.ok) callback({ id: j.producerId }); else errback(new Error(j.error || 'produce failed'));
        } catch (err) { errback(err); }
      });

      // produce local tracks
      for (const track of localStream.getTracks()) {
        try {
          await sendTransport.produce({ track });
        } catch (e) {
          console.warn('produce track failed', e);
        }
      }
    } catch (err) {
      console.warn('setupMediasoupProducer error', err);
      throw err;
    }
  }

  // mediasoup client setup for consuming remote producers (viewer)
  async function setupMediasoupConsumer(roomIdParam: string) {
    try {
      const res = await fetch(`/api/live/${roomIdParam}/mediasoup/create-transport`, { method: 'POST' });
      const data = await res.json();
      if (!data.ok || !data.transport) throw new Error(data.error || 'create transport failed');

      const transportParams = data.transport;
      const routerRtpCapabilities = data.transport.routerRtpCapabilities;

      const { Device } = await import('mediasoup-client');
      const device = new Device();
      await device.load({ routerRtpCapabilities });

      // create a recv transport
      // @ts-ignore
      const recvTransport = (device as any).createRecvTransport(transportParams as any);

      recvTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
        try {
          const r = await fetch(`/api/live/${roomIdParam}/mediasoup/connect-transport`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transportId: transportParams.id, dtlsParameters }),
          });
          const j = await r.json();
          if (j.ok) callback(); else errback(new Error(j.error || 'connect failed'));
        } catch (err) { errback(err); }
      });

      // get list of producers from server
      const p = await fetch(`/api/live/${roomIdParam}/mediasoup/producers`);
      const pj = await p.json();
      if (!pj.ok || !Array.isArray(pj.producers)) return;

      for (const prod of pj.producers) {
        try {
          const consumeRes = await fetch(`/api/live/${roomIdParam}/mediasoup/consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transportId: transportParams.id, producerId: prod.id, rtpCapabilities: (device as any).rtpCapabilities }),
          });
          const cj = await consumeRes.json();
          if (!cj.ok || !cj.consumer) continue;

          // consume on recvTransport
          // @ts-ignore
          const consumer = await (recvTransport as any).consume(cj.consumer);
          const track = consumer.track;
          const ms = new MediaStream([track]);
          setRemoteStreams((prev) => ({ ...prev, [cj.consumer.producerId]: ms }));

          // resume if supported
          try { if (consumer.resume) await consumer.resume(); } catch (e) {}
        } catch (e) {
          console.warn('consume failed', e);
        }
      }
    } catch (err) {
      console.warn('setupMediasoupConsumer error', err);
      throw err;
    }
  }

  // If user is a viewer and a roomId exists, attempt to set up mediasoup consumer
  useEffect(() => {
    if (role !== 'viewer') return;
    if (!roomId) return;

    let mounted = true;
    (async () => {
      try {
        await setupMediasoupConsumer(roomId);
      } catch (e) {
        if (mounted) console.warn('viewer mediasoup setup failed', e);
      }
    })();

    return () => { mounted = false; };
  }, [role, roomId]);
  // Setup Step
  if (step === 'setup') {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-blue-900 via-sky-800 to-indigo-900 text-white overflow-hidden">
            {/* Decorative Gradient - Behind Content */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-400 opacity-15 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header Content - On Top */}
            <div className="relative flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xl font-bold">{translation.live.goLive}</h2>
              </div>
              <button 
                type="button"
                onClick={() => {
                  console.log('[LiveStreamer] Close button clicked');
                  if (onClose) {
                    onClose();
                  } else {
                    setCanPreview(false);
                    setStep('setup');
                  }
                }} 
                className="p-2 hover:bg-white/20 rounded-lg transition text-white text-2xl font-bold cursor-pointer flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center" 
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">{translation.live.streamTitle}</label>
              <input value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} placeholder={translation.live.streamTitlePlaceholder} className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>

            {canPreview ? (
              <div className="space-y-3">
                <div className="bg-black rounded-lg overflow-hidden h-64 flex items-center justify-center">
                  {cameraError ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                      <div className="text-4xl mb-3">❌</div>
                    <div className="text-red-400 text-sm">{translation.live.cameraError}: {cameraError}</div>
                      <div className="flex flex-col gap-2 w-full">
                        <button 
                          onClick={() => { 
                            setCameraError(null); 
                            setCanPreview(false); 
                          }}
                          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 w-full"
                        >
                          {translation.live.tryAgain}
                        </button>
                        <button 
                          onClick={() => {
                            // Force reset and retry
                            setCameraError(null);
                            setCanPreview(false);
                            setMicOn(false); // Disable audio to test video only
                            setTimeout(() => {
                              setCanPreview(true);
                            }, 100);
                          }}
                          className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-medium hover:bg-blue-700 w-full"
                        >
                          {translation.live.cameraOnly}
                        </button>
                        <button
                          onClick={() => setCanPreview(false)}
                          className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 w-full"
                        >
                          {translation.live.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  )}
                </div>

                {!cameraError && (
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setCamOn((v) => !v)} className={`px-4 py-2 rounded-lg font-medium transition ${camOn ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      📹 {camOn ? translation.live.cameraOn : translation.live.cameraOff}
                    </button>
                    <button onClick={() => setMicOn((v) => !v)} className={`px-4 py-2 rounded-lg font-medium transition ${micOn ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      🎙️ {micOn ? translation.live.micOn : translation.live.micOff}
                    </button>
                  </div>
                )}

                {!cameraError && (
                  <div className="flex gap-3">
                    <button onClick={() => setCanPreview(false)} className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition">
                      {translation.live.cancel}
                    </button>
                    <button onClick={goLive} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105">
                      {translation.live.startBroadcasting}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={startSession} className="w-full px-4 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:shadow-lg transition">
                  {translation.live.previewCamera}
                </button>
                <p className="text-xs text-slate-500 text-center">{translation.live.cameraAccessNeeded}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Streaming Step (refactored UI: central video, floating controls, participants strip, collapsible chat)
  if (step === 'streaming' && roomId) {
    const viewerCount = 1 + Object.keys(remoteStreams).length;

    if (isFullscreen) {
      return (
        <div ref={fullscreenContainerRef} className="fixed inset-0 z-50 bg-black">
          <div className="w-full h-full flex items-center justify-center relative">
            {role === 'viewer' && Object.keys(remoteStreams).length ? (
              <video autoPlay playsInline className="w-full h-full object-contain" ref={(el) => { if (el && Object.values(remoteStreams)[0]) el.srcObject = Object.values(remoteStreams)[0]; }} />
            ) : (
              <video autoPlay muted playsInline className="w-full h-full object-contain" ref={(el) => { if (el && localStreamRef.current) el.srcObject = localStreamRef.current; }} />
            )}

            {/* Fullscreen Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-4 py-2 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="font-semibold">{translation.live.liveBadge}</span>
                </div>
                <div className="bg-black/60 text-white px-4 py-2 rounded-lg">👁️ {viewerCount}</div>
              </div>

              <button 
                onClick={toggleFullscreen} 
                title={isFullscreen ? translation.live.exitFullscreen : translation.live.fullscreen}
                className="pointer-events-auto absolute bottom-4 right-4 p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
              >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-slate-900">{translation.live.liveNow}</h1>
            <div className="text-sm text-slate-500">{streamTitle || translation.live.liveStream}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600 mr-2">👁️ {viewerCount}</div>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">{translation.live.share}</button>
            <button onClick={endStream} className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg">{translation.live.endStream}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
          {/* Main column: video + controls + participants */}
          <div>
            <div ref={videoContainerRef} className="relative bg-black rounded-xl overflow-hidden h-[60vh] lg:h-[70vh]">
              {role === 'viewer' && Object.keys(remoteStreams).length ? (
                <video autoPlay playsInline className="w-full h-full object-cover" ref={(el) => { if (el && Object.values(remoteStreams)[0]) el.srcObject = Object.values(remoteStreams)[0]; }} />
              ) : (
                <video autoPlay muted playsInline className="w-full h-full object-cover" ref={(el) => { if (el && localStreamRef.current) el.srcObject = localStreamRef.current; }} />
              )}

              {/* Floating reactions */}
              <div className="absolute inset-0 pointer-events-none">
                {reactions.map((r) => {
                  const ref = React.useRef<HTMLDivElement>(null);
                  const left = Math.random() * 80 + 10;
                  const bottom = Math.random() * 30 + 10;
                  
                  React.useEffect(() => {
                    if (ref.current) {
                      ref.current.style.left = `${left}%`;
                      ref.current.style.bottom = `${bottom}%`;
                    }
                  }, [left, bottom]);

                  return (
                    <div 
                      ref={ref}
                      key={r.id} 
                      className="absolute text-4xl floating-reaction"
                    >
                      {r.emoji}
                    </div>
                  );
                })}
              </div>

              <style>{`@keyframes float-up { 0%{ transform: translateY(0) scale(1); opacity:1 } 100%{ transform: translateY(-140px) scale(.6); opacity:0 } } .floating-reaction { animation: float-up 2s ease-out forwards; }`}</style>

              {/* Top-left live badge */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-semibold">{translation.live.liveBadge}</span>
                </div>
                <div className="bg-black/50 text-white px-3 py-1 rounded-lg text-sm">👁️ {viewerCount}</div>
              </div>

              {/* Floating control bar (center bottom) */}
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-5 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full">
                <button onClick={() => setMicOn((v) => !v)} className={`px-3 py-2 rounded-full ${micOn ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}>{micOn ? '🎙' : '🔇'}</button>
                <button onClick={() => setCamOn((v) => !v)} className={`px-3 py-2 rounded-full ${camOn ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}>{camOn ? '📷' : '🚫'}</button>
                <button onClick={() => sendReaction('❤️')} className="px-3 py-2 rounded-full bg-white text-red-600">❤️</button>
                <button onClick={sendInvite} title="Copy invite link for guests" className="px-3 py-2 rounded-full bg-white text-slate-900">👥</button>
                <button onClick={toggleFullscreen} className="px-3 py-2 rounded-full bg-white text-slate-900">⤢</button>
              </div>
            </div>

            {/* Participants strip */}
            <div className="mt-3 flex items-center gap-3 overflow-x-auto py-2">
              {/* Host thumbnail */}
              <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">{displayName?.charAt(0) || 'H'}</div>
                <div className="text-sm">
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-xs text-slate-500">{role}</div>
                </div>
              </div>
              {Object.keys(remoteStreams).map((id) => (
                <div key={id} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2">
                  <div className="w-9 h-9 bg-slate-200 rounded-full" />
                  <div className="text-sm">
                    <div className="font-semibold truncate">{id}</div>
                    <div className="text-xs text-slate-500">particip</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: chat / stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">{translation.live.chat}</h3>
                <span className="text-xs text-slate-500">({messages.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setChatOpen((s) => !s)} className="px-2 py-1 bg-slate-100 rounded-md text-sm">{chatOpen ? 'Fermer' : 'Ouvrir'}</button>
                <button onClick={() => setParticipantsOpen((s) => !s)} className="px-2 py-1 bg-slate-100 rounded-md text-sm">Participants</button>
              </div>
            </div>

            {chatOpen && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col h-[60vh] overflow-hidden">
                {pinnedComment && (
                  <div className="mb-2 p-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-md border-l-4 border-indigo-500">
                    <div className="text-xs text-slate-500">Pinned</div>
                    <div className="font-medium">{pinnedComment.from}</div>
                    <div className="text-sm text-slate-700">{pinnedComment.text}</div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-3 p-1">
                  {messages.length ? (
                    messages.map((m) => (
                      <div key={m.id} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-800 truncate">{m.from}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">just now</span>
                            <button onClick={() => setPinnedComment(m)} className="text-xs text-blue-600">Pin</button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 mt-1">{m.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">{translation.live.noMessagesYet}</p>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder={translation.live.saySomething} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                  <button onClick={sendMessage} className="px-3 py-2 bg-gradient-to-r from-indigo-700 to-blue-700 text-white rounded-lg">{translation.live.send}</button>
                </div>
              </div>
            )}

            {/* Stats / reactions */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{translation.live.stats}</div>
                <div className="text-sm text-slate-500">👁️ {viewerCount}</div>
              </div>
              <div className="text-sm"><span className="font-semibold text-red-600">{reactions.length}</span> <span className="text-slate-600">{translation.live.reactions}</span></div>
              <div className="text-sm"><span className="font-semibold">{messages.length}</span> <span className="text-slate-600">{translation.live.messages}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
