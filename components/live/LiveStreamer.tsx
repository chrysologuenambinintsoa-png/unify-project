"use client";

import React, { useEffect, useRef, useState } from 'react';
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

  console.log('[LiveStreamer] Render:', { step, canPreview, role, camOn, micOn });

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

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;
    try {
      if (!isFullscreen) {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('fullscreen error', err);
    }
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
                className="p-2 hover:bg-white/20 rounded-lg transition text-white text-2xl font-bold cursor-pointer flex-shrink-0" 
                title="Close"
                style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

  // Streaming Step
  if (step === 'streaming' && roomId) {
    const viewerCount = 1 + Object.keys(remoteStreams).length;

    if (isFullscreen) {
      return (
        <div ref={videoContainerRef} className="fixed inset-0 z-50 bg-black">
          <div className="w-full h-full flex items-center justify-center relative">
            {role === 'viewer' && Object.keys(remoteStreams).length ? (
              <video autoPlay playsInline className="w-full h-full object-contain" ref={(el) => { if (el) el.srcObject = Object.values(remoteStreams)[0]; }} />
            ) : (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
            )}

            {/* Fullscreen Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="font-semibold">{translation.live.liveBadge}</span>
                </div>
                <div className="bg-black/60 text-white px-4 py-2 rounded-lg">👁️ {viewerCount}</div>
              </div>

              <button onClick={toggleFullscreen} className="pointer-events-auto absolute bottom-4 right-4 px-3 py-2 bg-white/20 text-white rounded-lg">{translation.live.exitFullscreen}</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-slate-900">{translation.live.liveNow}</h1>
            <div className="text-sm text-slate-500">{roomId}</div>
          </div>

          <button onClick={endStream} className="px-4 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition">
            {translation.live.endStream}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Area */}
          <div className="lg:col-span-2 space-y-4">
            <div ref={videoContainerRef} className="bg-black rounded-xl overflow-hidden relative group h-96">
              {role === 'viewer' && Object.keys(remoteStreams).length ? (
                <video autoPlay playsInline className="w-full h-full object-cover" ref={(el) => { if (el) el.srcObject = Object.values(remoteStreams)[0]; }} />
              ) : (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              )}

              {/* Floating Reactions */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {reactions.map((reaction) => (
                  <div
                    key={reaction.id}
                    className="absolute text-3xl font-bold"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      bottom: `${Math.random() * 30 + 10}%`,
                      animation: `float-up 2s ease-out forwards`,
                      opacity: 0.9,
                    }}
                  >
                    {reaction.emoji}
                  </div>
                ))}
              </div>

              <style>{`
                @keyframes float-up {
                  0% {
                    transform: translateY(0) scale(1);
                    opacity: 0.9;
                  }
                  100% {
                    transform: translateY(-150px) scale(0.5);
                    opacity: 0;
                  }
                }
              `}</style>

              {/* Video Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-semibold">{translation.live.liveBadge}</span>
                </div>
                <div className="bg-black/60 text-white px-3 py-1 rounded-lg text-sm">👁️ {viewerCount}</div>
              </div>

              {/* Fullscreen Button */}
              {role === 'viewer' && (
                <button onClick={toggleFullscreen} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition px-3 py-2 bg-white/20 text-white rounded-lg text-sm">
                  {translation.live.fullscreen}
                </button>
              )}

              {/* Decorative Gradient */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-pink-400 to-indigo-400 opacity-20 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">{streamTitle || translation.live.liveStream}</p>
            </div>
          </div>

          {/* Chat/Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">{translation.live.stats}</h3>
              <div className="text-sm">
                <span className="font-semibold text-red-600 animate-pulse">{reactions.length}</span>
                <span className="text-slate-600"> {translation.live.reactions}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{messages.length}</span>
                <span className="text-slate-600"> {translation.live.messages}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{viewerCount}</span>
                <span className="text-slate-600"> {translation.live.viewers}</span>
              </div>
            </div>

            {/* Reaction Buttons */}
            {role === 'viewer' && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">{translation.live.reactions}</p>
                <div className="grid grid-cols-5 gap-2">
                  {['❤️', '👍', '😂', '😍', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition transform active:scale-90 text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col h-80 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">{translation.live.chat} ({messages.length})</h3>
              <div className="flex-1 overflow-y-auto space-y-3">
                {messages.length ? (
                  messages.map((m) => (
                    <div key={m.id} className="bg-white rounded-lg p-2 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800 truncate">{m.from}</p>
                        <span className="text-xs text-slate-400">just now</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 word-break">{m.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">{translation.live.noMessagesYet}</p>
                )}
              </div>

              {/* Input */}
              <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
                <input 
                  value={messageInput} 
                  onChange={(e) => setMessageInput(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={translation.live.saySomething} 
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900" 
                />
                <button 
                  onClick={sendMessage} 
                  className="px-3 py-2 bg-blue-900 text-white rounded-lg text-xs font-medium hover:bg-blue-800 transition active:scale-95"
                >
                  {translation.live.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
