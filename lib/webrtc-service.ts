/**
 * WebRTC Service - Handles peer-to-peer communication setup
 */

import { getWebRTCConfig } from './rtc-config';

export interface RTCConfig {
  iceServers?: RTCIceServer[];
}

const defaultIceServers: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302'] },
  { urls: ['stun:stun1.l.google.com:19302'] },
  { urls: ['stun:stun2.l.google.com:19302'] },
  { urls: ['stun:stun3.l.google.com:19302'] },
  { urls: ['stun:stun4.l.google.com:19302'] },
];

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: RTCConfig;
  private rtcConfig = getWebRTCConfig();
  private stats: { bytesSent: number; bytesReceived: number } = {
    bytesSent: 0,
    bytesReceived: 0,
  };

  constructor(config: Partial<RTCConfig> = {}) {
    this.config = {
      iceServers: config.iceServers || this.rtcConfig.iceServers,
    };
  }

  /**
   * Initialize peer connection
   */
  async initializePeerConnection(
    onRemoteStream?: (stream: MediaStream) => void,
    onIceCandidate?: (candidate: RTCIceCandidate) => void
  ): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Handle remote track
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams[0]) {
        this.remoteStream = event.streams[0];
        onRemoteStream?.(event.streams[0]);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate?.(event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
    };

    this.peerConnection = peerConnection;
    return peerConnection;
  }

  /**
   * Get local media stream
   */
  async getLocalStream(
    constraints: MediaStreamConstraints = { audio: true, video: true }
  ): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  /**
   * Add local stream to peer connection
   */
  addLocalStreamToPeerConnection(): void {
    if (!this.peerConnection || !this.localStream) {
      throw new Error('Peer connection or local stream not initialized');
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });
  }

  /**
   * Create and send offer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create and send answer
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.warn('Error adding ICE candidate:', error);
    }
  }

  /**
   * Mute/unmute audio
   */
  setAudioEnabled(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Enable/disable video
   */
  setVideoEnabled(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Get current local stream
   */
  getLocalStreamTracks() {
    return this.localStream?.getTracks() || [];
  }

  /**
   * Get current remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Close peer connection and cleanup
   */
  close(): void {
    // Stop local tracks
    this.localStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    this.peerConnection?.close();

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
  }

  /**
   * Get connection state
   */
  getConnectionState(): RTCPeerConnectionState | undefined {
    return this.peerConnection?.connectionState;
  }

  /**
   * Get ICE connection state
   */
  getIceConnectionState(): RTCIceConnectionState | undefined {
    return this.peerConnection?.iceConnectionState;
  }

  /**
   * Collect WebRTC statistics (for monitoring/debugging)
   */
  async getStats(): Promise<{
    bytesSent: number;
    bytesReceived: number;
    jitter?: number;
    roundTripTime?: number;
  }> {
    if (!this.peerConnection || !this.rtcConfig.enableStats) {
      return { bytesSent: 0, bytesReceived: 0 };
    }

    try {
      const stats = await this.peerConnection.getStats();
      let bytesSent = 0;
      let bytesReceived = 0;
      let roundTripTime = 0;
      let jitter = 0;

      stats.forEach((report) => {
        if (report.type === 'outbound-rtp') {
          bytesSent += report.bytesSent || 0;
        } else if (report.type === 'inbound-rtp') {
          bytesReceived += report.bytesReceived || 0;
          jitter = Math.max(jitter, report.jitter || 0);
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          roundTripTime = report.currentRoundTripTime || 0;
        }
      });

      this.stats = { bytesSent, bytesReceived };

      return {
        bytesSent,
        bytesReceived,
        jitter,
        roundTripTime,
      };
    } catch (error) {
      console.error('Error collecting WebRTC stats:', error);
      return this.stats;
    }
  }

  /**
   * Get current stats
   */
  getCurrentStats() {
    return this.stats;
  }
}
