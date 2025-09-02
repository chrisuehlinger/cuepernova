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
  mappings?: any; // Projection mapping data
  description?: string;
}

export interface Config {
  oscPort: number;
  httpPort: number;
  httpsPort: number;
  defaultCuestation?: string;
}