declare module 'osc' {
  export interface UDPPortOptions {
    localAddress: string;
    localPort: number;
  }

  export class UDPPort {
    options: UDPPortOptions;
    constructor(options: UDPPortOptions);
    on(event: string, callback: Function): void;
    open(): void;
    close(): void;
    send(buffer: Buffer, address: string, port: number): void;
  }

  export interface OSCMessage {
    address: string;
    args: any[];
  }
}