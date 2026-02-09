"use client";

import React, { useEffect, useRef, useState } from 'react';
import useLive from '@/hooks/useLive';

type Role = 'host' | 'participant' | 'viewer';

type Props = {
  roomId?: string;
  displayName?: string;
  role?: Role;
  myId?: string;
  onClose?: () => void;
};

export default function LiveStreamer({ roomId: initialRoomId, displayName = 'Guest', role = 'participant', myId: initialMyId, onClose }: Props) {
  const { send, onMessage, rooms } = useLive();
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
  const [reactions, setReactions] = useState(0);
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
    
    // Don't try to setup if there's already an error from diagnostic
    if (cameraError) {
      console.log('[LiveStreamer] Skipping setup: camera error already detected');
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
          setCameraError(`Camera setup failed: ${e.message}`);
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
  }, [canPreview, camOn, micOn, role, step, cameraError]);

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
        setReactions((r) => r + 1);
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
    
    if (!availableDevices.video) {
      alert('❌ No camera detected on your device.\n\nMake sure:\n1. A USB camera is connected\n2. Your laptop/device has a built-in camera\n3. No other app is currently using the camera');
      return;
    }
    
    // Diagnostic: test if we can access camera at all
    console.log('[LiveStreamer] Running camera diagnostic...');
    try {
      // Try video only
      console.log('[LiveStreamer] Testing video access...');
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      console.log('[LiveStreamer] ✅ Video access successful!');
      testStream.getTracks().forEach(t => t.stop());
      
      setCameraError(null); // Clear previous errors
      setCanPreview(true);
    } catch (e: any) {
      console.error('[LiveStreamer] Video diagnostic failed:', e.name, e.message);
      
      // If video fails, give detailed instructions
      let instructions = '❌ Camera access is blocked.\n\n';
      
      if (e.name === 'NotAllowedError') {
        instructions += 'SOLUTIONS:\n' +
          '1. Check if another app is using the camera (Zoom, Teams, etc.) - close it\n' +
          '2. Restart your browser\n' +
          '3. Go to browser settings and reset camera permissions:\n' +
          '   - Chrome: chrome://settings/content/camera\n' +
          '   - Firefox: about:preferences#privacy → Permissions\n' +
          '4. Or try a different browser\n\n' +
          'Error: ' + e.message;
      } else if (e.name === 'NotFoundError') {
        instructions += 'No camera found on your device.\n' +
          'Connect a USB camera or enable your webcam.';
      } else {
        instructions += 'Error: ' + e.message;
      }
      
      setCameraError(instructions);
      setCanPreview(true); // Show error message in preview area
    }
  };

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
    send({ type: 'comment', roomId, payload: { from: displayName, text: messageInput.trim() } });
    setMessageInput('');
  };

  const sendReaction = () => {
    if (!roomId) return;
    send({ type: 'reaction', roomId, payload: { from: myId || displayName, reaction: '❤️' } });
    setReactions((r) => r + 1);
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
                <h2 className="text-xl font-bold">Go Live</h2>
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
              <label className="block text-sm font-semibold text-slate-900 mb-2">Stream Title</label>
              <input value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} placeholder="e.g., My First Live Stream" className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>

            {canPreview ? (
              <div className="space-y-3">
                <div className="bg-black rounded-lg overflow-hidden h-64 flex items-center justify-center">
                  {cameraError ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                      <div className="text-4xl mb-3">❌</div>
                      <p className="text-red-400 text-sm whitespace-pre-line max-h-40 overflow-y-auto">{cameraError}</p>
                      <div className="flex flex-col gap-2 w-full">
                        <button 
                          onClick={() => { 
                            setCameraError(null); 
                            setCanPreview(false); 
                          }}
                          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 w-full"
                        >
                          🔄 Try Again
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
                          🎥 Try Cameras Only (No Mic)
                        </button>
                        <button
                          onClick={() => setCanPreview(false)}
                          className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 w-full"
                        >
                          ← Cancel
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
                      📹 {camOn ? 'Camera On' : 'Camera Off'}
                    </button>
                    <button onClick={() => setMicOn((v) => !v)} className={`px-4 py-2 rounded-lg font-medium transition ${micOn ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      🎙️ {micOn ? 'Mic On' : 'Mic Off'}
                    </button>
                  </div>
                )}

                {!cameraError && (
                  <div className="flex gap-3">
                    <button onClick={() => setCanPreview(false)} className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition">
                      ← Cancel
                    </button>
                    <button onClick={goLive} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105">
                      🔴 Start Broadcasting
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={startSession} className="w-full px-4 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:shadow-lg transition">
                  📷 Preview Camera
                </button>
                <p className="text-xs text-slate-500 text-center">You'll need to allow camera access when prompted</p>
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
                  <span className="font-semibold">LIVE</span>
                </div>
                <div className="bg-black/60 text-white px-4 py-2 rounded-lg">👥 {viewerCount}</div>
              </div>

              <button onClick={toggleFullscreen} className="pointer-events-auto absolute bottom-4 right-4 px-3 py-2 bg-white/20 text-white rounded-lg">Exit Fullscreen</button>
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
            <h1 className="text-2xl font-bold text-slate-900">Live Now</h1>
            <div className="text-sm text-slate-500">{roomId}</div>
          </div>

          <button onClick={endStream} className="px-4 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition">
            End Stream
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

              {/* Video Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-semibold">LIVE</span>
                </div>
                <div className="bg-black/60 text-white px-3 py-1 rounded-lg text-sm">👥 {viewerCount}</div>
              </div>

              {/* Fullscreen Button */}
              {role === 'viewer' && (
                <button onClick={toggleFullscreen} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition px-3 py-2 bg-white/20 text-white rounded-lg text-sm">
                  ⛶ Fullscreen
                </button>
              )}

              {/* Decorative Gradient */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-pink-400 to-indigo-400 opacity-20 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">{streamTitle || 'Live Stream'}</p>
            </div>
          </div>

          {/* Chat/Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Stats</h3>
              <div className="text-sm">
                <span className="font-semibold text-red-600 animate-pulse">{reactions}</span>
                <span className="text-slate-600"> reactions</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{messages.length}</span>
                <span className="text-slate-600"> messages</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{viewerCount}</span>
                <span className="text-slate-600"> viewers</span>
              </div>
            </div>

            {/* Reaction Button */}
            {role === 'viewer' && (
              <button onClick={sendReaction} className="w-full px-4 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition transform active:scale-95">
                ❤️ Like
              </button>
            )}

            {/* Chat */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col h-80">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Chat</h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {messages.length ? (
                  messages.map((m) => (
                    <div key={m.id} className="text-xs">
                      <p className="font-semibold text-slate-800">{m.from}</p>
                      <p className="text-slate-600">{m.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No messages yet</p>
                )}
              </div>

              {/* Input */}
              <div className="mt-3 flex gap-2">
                <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Say something..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900" />
                <button onClick={sendMessage} className="px-3 py-2 bg-blue-900 text-white rounded-lg text-xs font-medium">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
