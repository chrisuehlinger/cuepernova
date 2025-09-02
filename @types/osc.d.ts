declare module 'osc' {
  interface UDPPort {
    open(): void;
    close(): void;
    send(packet: any, address: string, port: number): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  interface UDPPortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
  }

  export class UDPPort {
    constructor(options: UDPPortOptions);
  }
}