// Video call implementation removed — provide a minimal stub to avoid runtime errors
export const videoCallService = {
  createOffer: async (_remoteUserId?: string) => null,
  createAnswer: async (_remoteUserId?: string, _offer?: any) => null,
  addIceCandidate: async (_remoteUserId?: string, _candidate?: any) => {},
  getLocalStream: async (_constraints?: any) => null,
  closeAll: () => {},
  closePeerConnection: (_remoteUserId?: string) => {},
  toggleAudio: (_enabled?: boolean) => {},
  toggleVideo: (_enabled?: boolean) => {},
  shareScreen: async (_remoteUserId?: string) => null,
  getRemoteStream: (_remoteUserId?: string) => undefined,
  getStats: async (_remoteUserId?: string) => null,
};
