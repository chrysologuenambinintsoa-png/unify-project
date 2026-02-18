/**
 * WebRTC Configuration for Production
 * Handles STUN/TURN servers based on environment
 */

export interface RTCServerConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  enableStats?: boolean;
}

/**
 * Parse STUN servers from environment variable
 * Format: "stun:server1:port,stun:server2:port"
 */
function parseStunServers(stunString: string | undefined): RTCIceServer[] {
  if (!stunString) return [];

  return stunString.split(',').map((server) => ({
    urls: [server.trim()],
  }));
}

/**
 * Parse TURN servers from environment variable
 * Format: "turn:username:password@server:port,turn:server2:port"
 */
function parseTurnServers(turnString: string | undefined): RTCIceServer[] {
  if (!turnString) return [];

  return turnString.split(',').map((server) => {
    const trimmed = server.trim();
    const urlMatch = trimmed.match(/^turn:(.*)/);

    if (!urlMatch) return { urls: [] };

    const urlPart = urlMatch[1];
    const hasAuth = urlPart.includes('@');

    if (hasAuth) {
      const [auth, hostPort] = urlPart.split('@');
      const [username, password] = auth.split(':');
      return {
        urls: [`turn:${hostPort}`],
        username,
        credential: password,
        credentialType: 'password',
      };
    }

    return {
      urls: [`turn:${urlPart}`],
    };
  });
}

/**
 * Default STUN servers when no environment config
 */
const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302'] },
  { urls: ['stun:stun1.l.google.com:19302'] },
  { urls: ['stun:stun2.l.google.com:19302'] },
  { urls: ['stun:stun3.l.google.com:19302'] },
  { urls: ['stun:stun4.l.google.com:19302'] },
];

/**
 * Get WebRTC configuration based on environment
 */
export function getWebRTCConfig(): RTCServerConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Parse STUN servers from environment (optional)
  const stunServers = parseStunServers(process.env.NEXT_PUBLIC_STUN_SERVERS);
  const iceServers: RTCIceServer[] = stunServers.length > 0 ? stunServers : DEFAULT_STUN_SERVERS;

  // Parse TURN servers from environment (optional)
  // If absent, we simply rely on STUN and P2P where possible.
  try {
    const turnServers = parseTurnServers(process.env.NEXT_PUBLIC_TURN_SERVERS);
    if (turnServers.length > 0) {
      iceServers.push(...turnServers);
    }
  } catch (e) {
    // Defensive: if parsing fails, do not throw — preserve app stability
    const errMsg = e instanceof Error ? e.message : String(e);
    console.warn('[rtc-config] Failed to parse NEXT_PUBLIC_TURN_SERVERS, continuing without TURN:', errMsg);
  }

  // In production, optionally force ICE servers only (no mDNS candidates)
  const iceTransportPolicy = isProduction
    ? (process.env.NEXT_PUBLIC_RTC_ICE_SERVERS_ONLY === 'true'
        ? 'relay' // Only TURN servers
        : 'all'   // All candidates
      )
    : 'all';

  // Enable stats collection in development
  const enableStats = isDevelopment || process.env.NEXT_PUBLIC_RTC_ENABLE_STATS === 'true';

  return {
    iceServers,
    iceTransportPolicy,
    enableStats,
  };
}

/**
 * Get call configuration from environment
 */
export function getCallConfig() {
  return {
    enabled: {
      videoCalls: process.env.NEXT_PUBLIC_ENABLE_VIDEO_CALLS !== 'false',
      audioCalls: process.env.NEXT_PUBLIC_ENABLE_AUDIO_CALLS !== 'false',
    },
    polling: {
      interval: parseInt(process.env.NEXT_PUBLIC_CALL_POLLING_INTERVAL || '2000', 10),
      timeout: parseInt(process.env.NEXT_PUBLIC_CALL_TIMEOUT || '60000', 10),
    },
    limits: {
      maxDuration: parseInt(process.env.NEXT_PUBLIC_MAX_CALL_DURATION || '3600', 10),
    },
    logging: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_CALL_LOGGING === 'true',
      level: process.env.LOG_LEVEL || 'info',
    },
  };
}

/**
 * Multi-region TURN server configuration (example)
 */
export const PRODUCTION_TURN_SERVERS: Record<string, RTCIceServer[]> = {
  // Example: Configure TURN servers per region
  'us-east': [
    {
      urls: ['turn:turnserver-us-east.example.com:3478?transport=udp'],
      username: process.env.TURN_USERNAME_US_EAST,
      credential: process.env.TURN_PASSWORD_US_EAST,
    },
  ],
  'eu-west': [
    {
      urls: ['turn:turnserver-eu-west.example.com:3478?transport=udp'],
      username: process.env.TURN_USERNAME_EU_WEST,
      credential: process.env.TURN_PASSWORD_EU_WEST,
    },
  ],
  'asia-pacific': [
    {
      urls: ['turn:turnserver-ap.example.com:3478?transport=udp'],
      username: process.env.TURN_USERNAME_AP,
      credential: process.env.TURN_PASSWORD_AP,
    },
  ],
};
