declare module 'ws' {
  export class WebSocketServer {
    constructor(options?: any);
    on(event: string, listener: (...args: any[]) => void): this;
    close(cb?: () => void): void;
  }

  export class WebSocket {
    constructor(address?: any, protocols?: any);
    on(event: string, listener: (...args: any[]) => void): this;
    send(data: any, cb?: (err?: any) => void): void;
    close(code?: number, reason?: string): void;
  }

  export { WebSocketServer, WebSocket };
  export default WebSocket;
}
