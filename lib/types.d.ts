export interface CuepernovaConfig {
  server?: {
    httpPort?: number;
    httpsPort?: number;
    ssl?: {
      cert?: string;
      key?: string;
    };
  };
  osc?: {
    port?: number;
  };
  paths?: {
    cueballs?: string;
    media?: string;
    nodeModules?: string;
  };
}