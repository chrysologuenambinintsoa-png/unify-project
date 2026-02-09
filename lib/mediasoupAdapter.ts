// Server-side MediaSoup adapter (minimal skeleton)
// Requires: npm install mediasoup
// This file manages MediaSoup workers, routers and room resources.

// @ts-ignore
import mediasoup from 'mediasoup';

type RouterMap = Map<string, any>;

class MediaSoupAdapter {
  workers: any[] = [];
  nextWorker = 0;
  routers: RouterMap = new Map();

  // transport map per room: roomId -> Map(transportId -> transport)
  transports: Map<string, Map<string, any>> = new Map();

  // producer map per room: roomId -> Map(producerId -> producer)
  producers: Map<string, Map<string, any>> = new Map();

  async init() {
    if (this.workers.length) return;
    const numWorkers = Math.max(1, (process.env.MEDIASOUP_WORKERS && parseInt(process.env.MEDIASOUP_WORKERS)) || 1);
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        rtcMinPort: 20000 + i * 1000,
        rtcMaxPort: 20000 + i * 1000 + 999,
      });
      worker.on('died', () => {
        console.error('mediasoup worker died, exiting');
        process.exit(1);
      });
      this.workers.push(worker);
    }
  }

  getWorker() {
    if (!this.workers.length) throw new Error('MediaSoup workers not initialized');
    const worker = this.workers[this.nextWorker];
    this.nextWorker = (this.nextWorker + 1) % this.workers.length;
    return worker;
  }

  async getRouter(roomId: string) {
    if (this.routers.has(roomId)) return this.routers.get(roomId);
    const worker = this.getWorker();
    const mediaCodecs = [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
      },
    ];
    const router = await worker.createRouter({ mediaCodecs });
    this.routers.set(roomId, router);
    return router;
  }

  async createWebRtcTransport(roomId: string) {
    const router = await this.getRouter(roomId);
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
    });

    // register transport
    if (!this.transports.has(roomId)) this.transports.set(roomId, new Map());
    this.transports.get(roomId)!.set(transport.id, transport);

    // cleanup when transport closes
    transport.on('close', () => {
      this.removeTransport(roomId, transport.id);
    });

    return transport;
  }

  getTransport(roomId: string, transportId: string) {
    return this.transports.get(roomId)?.get(transportId) || null;
  }

  removeTransport(roomId: string, transportId: string) {
    const map = this.transports.get(roomId);
    if (!map) return;
    map.delete(transportId);
    if (map.size === 0) this.transports.delete(roomId);
  }

  registerProducer(roomId: string, producer: any) {
    if (!this.producers.has(roomId)) this.producers.set(roomId, new Map());
    const map = this.producers.get(roomId)!;
    map.set(producer.id, producer);

    const cleanup = () => this.removeProducer(roomId, producer.id);
    producer.on('close', cleanup);
    producer.on('transportclose', cleanup);
  }

  removeProducer(roomId: string, producerId: string) {
    const map = this.producers.get(roomId);
    if (!map) return;
    map.delete(producerId);
    if (map.size === 0) this.producers.delete(roomId);
  }

  listProducers(roomId: string) {
    const map = this.producers.get(roomId);
    if (!map) return [];
    return Array.from(map.values()).map((p) => ({ id: p.id, kind: p.kind, appData: p.appData }));
  }
}

export const mediaAdapter = new MediaSoupAdapter();

export default mediaAdapter;
