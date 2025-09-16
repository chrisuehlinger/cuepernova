export interface Cue {
  id: string;
  number: string;
  name: string;
  type: 'osc' | 'cueball' | 'video' | 'image' | 'message' | 'clear';
  args: string[];
  notes?: string;
}

export interface Cuestation {
  id: string;
  name: string;
  description?: string;
  showtimeResolution: {
    width: number;
    height: number;
  };
  mapping?: {
    layers?: Array<{
      targetPoints: number[][];
      sourcePoints: number[][];
    }>;
  };
}

export interface Config {
  oscPort: number;
  httpPort: number;
  httpsPort: number;
  defaultCuestation?: string;
}