/**
 * Centralized data access layer with validation and caching
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import crypto from 'node:crypto';
const uuidv4 = () => crypto.randomUUID();
import { 
  DatabaseSchema, 
  Cue, 
  Cuestation, 
  Config,
  AsyncResult
} from '../types/index';
import { 
  validateDatabase, 
  safeValidate,
  DatabaseSchema as ZodDatabaseSchema,
  CueSchema,
  CuestationSchema,
  ConfigSchema
} from '../types/validation';

export interface DataStoreOptions {
  projectDir: string;
  cacheEnabled?: boolean;
  cacheTTL?: number; // milliseconds
  autoSave?: boolean;
}

export class DataStore {
  private projectDir: string;
  private dbPath: string;
  private cache: DatabaseSchema | null = null;
  private cacheTimestamp = 0;
  private cacheTTL: number;
  private cacheEnabled: boolean;
  private autoSave: boolean;
  private saveQueue: Promise<void> = Promise.resolve();
  private isDirty = false;

  constructor(options: DataStoreOptions) {
    this.projectDir = options.projectDir;
    this.dbPath = path.join(options.projectDir, 'db.json');
    this.cacheEnabled = options.cacheEnabled ?? true;
    this.cacheTTL = options.cacheTTL ?? 5000; // 5 seconds default
    this.autoSave = options.autoSave ?? true;
  }

  // ============================================
  // Core Database Operations
  // ============================================

  private async loadDatabase(): Promise<DatabaseSchema> {
    // Check cache first
    if (this.cacheEnabled && this.cache && this.isCacheValid()) {
      return this.cache;
    }

    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Migrate old cuestations to include showtimeResolution
      if (parsed.cuestations) {
        parsed.cuestations = parsed.cuestations.map((c: any) => {
          if (!c.showtimeResolution) {
            return {
              ...c,
              showtimeResolution: { width: 1920, height: 1080 }
            };
          }
          return c;
        });
      }
      
      // Validate with Zod
      const validated = validateDatabase(parsed);
      
      // Update cache
      if (this.cacheEnabled) {
        this.cache = validated;
        this.cacheTimestamp = Date.now();
      }
      
      return validated;
    } catch (error) {
      // Return default database if file doesn't exist or is invalid
      const defaultDb: DatabaseSchema = {
        cues: [],
        cuestations: [],
        config: {
          oscPort: 57121,
          httpPort: 8080,
          httpsPort: 8443
        }
      };
      
      // Create the file if it doesn't exist
      await this.saveDatabase(defaultDb);
      return defaultDb;
    }
  }

  private async saveDatabase(data: DatabaseSchema): Promise<void> {
    // Validate before saving
    const validated = validateDatabase(data);
    
    // Update cache immediately
    if (this.cacheEnabled) {
      this.cache = validated;
      this.cacheTimestamp = Date.now();
    }
    
    // Queue the save operation to prevent concurrent writes
    this.saveQueue = this.saveQueue.then(async () => {
      await fs.writeFile(this.dbPath, JSON.stringify(validated, null, 2));
      this.isDirty = false;
    });
    
    await this.saveQueue;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.cacheTTL;
  }

  public invalidateCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  // ============================================
  // Cue Operations
  // ============================================

  public async getCues(): Promise<Cue[]> {
    const db = await this.loadDatabase();
    return db.cues;
  }

  public async getCue(id: string): Promise<Cue | null> {
    const cues = await this.getCues();
    return cues.find(c => c.id === id) || null;
  }

  public async saveCues(cues: Cue[]): Promise<void> {
    // Validate each cue
    const validatedCues = cues.map(cue => CueSchema.parse(cue));
    
    const db = await this.loadDatabase();
    db.cues = validatedCues;
    await this.saveDatabase(db);
  }

  public async addCue(cue: Omit<Cue, 'id'>): Promise<Cue> {
    const newCue: Cue = {
      ...cue,
      id: uuidv4()
    };
    
    // Validate
    const validated = CueSchema.parse(newCue);
    
    const db = await this.loadDatabase();
    db.cues.push(validated);
    await this.saveDatabase(db);
    
    return validated;
  }

  public async updateCue(id: string, updates: Partial<Cue>): Promise<Cue | null> {
    const db = await this.loadDatabase();
    const index = db.cues.findIndex(c => c.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updated = { ...db.cues[index], ...updates };
    const validated = CueSchema.parse(updated);
    
    db.cues[index] = validated;
    await this.saveDatabase(db);
    
    return validated;
  }

  public async deleteCue(id: string): Promise<boolean> {
    const db = await this.loadDatabase();
    const initialLength = db.cues.length;
    db.cues = db.cues.filter(c => c.id !== id);
    
    if (db.cues.length < initialLength) {
      await this.saveDatabase(db);
      return true;
    }
    
    return false;
  }

  // ============================================
  // Cuestation Operations
  // ============================================

  public async getCuestations(): Promise<Cuestation[]> {
    const db = await this.loadDatabase();
    return db.cuestations;
  }

  public async getCuestation(id: string): Promise<Cuestation | null> {
    const cuestations = await this.getCuestations();
    return cuestations.find(c => c.id === id) || null;
  }

  public async saveCuestations(cuestations: Cuestation[]): Promise<void> {
    // Validate each cuestation
    const validatedCuestations = cuestations.map(cs => CuestationSchema.parse(cs));
    
    const db = await this.loadDatabase();
    db.cuestations = validatedCuestations;
    await this.saveDatabase(db);
  }

  public async addCuestation(cuestation: Omit<Cuestation, 'id'>): Promise<Cuestation> {
    const newCuestation: Cuestation = {
      ...cuestation,
      id: uuidv4()
    };
    
    // Validate
    const validated = CuestationSchema.parse(newCuestation);
    
    const db = await this.loadDatabase();
    db.cuestations.push(validated);
    await this.saveDatabase(db);
    
    return validated;
  }

  public async updateCuestation(id: string, updates: Partial<Cuestation>): Promise<Cuestation | null> {
    const db = await this.loadDatabase();
    const index = db.cuestations.findIndex(c => c.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updated = { ...db.cuestations[index], ...updates };
    const validated = CuestationSchema.parse(updated);
    
    db.cuestations[index] = validated;
    await this.saveDatabase(db);
    
    return validated;
  }

  public async deleteCuestation(id: string): Promise<boolean> {
    const db = await this.loadDatabase();
    const initialLength = db.cuestations.length;
    db.cuestations = db.cuestations.filter(c => c.id !== id);
    
    if (db.cuestations.length < initialLength) {
      await this.saveDatabase(db);
      return true;
    }
    
    return false;
  }

  // ============================================
  // Config Operations
  // ============================================

  public async getConfig(): Promise<Config> {
    const db = await this.loadDatabase();
    return db.config;
  }

  public async saveConfig(config: Config): Promise<void> {
    const validated = ConfigSchema.parse(config);
    
    const db = await this.loadDatabase();
    db.config = validated;
    await this.saveDatabase(db);
  }

  public async updateConfig(updates: Partial<Config>): Promise<Config> {
    const db = await this.loadDatabase();
    const updated = { ...db.config, ...updates };
    const validated = ConfigSchema.parse(updated);
    
    db.config = validated;
    await this.saveDatabase(db);
    
    return validated;
  }

  // ============================================
  // Batch Operations
  // ============================================

  public async batchUpdate(updates: {
    cues?: Cue[];
    cuestations?: Cuestation[];
    config?: Config;
  }): Promise<void> {
    const db = await this.loadDatabase();
    
    if (updates.cues) {
      db.cues = updates.cues.map(cue => CueSchema.parse(cue));
    }
    
    if (updates.cuestations) {
      db.cuestations = updates.cuestations.map(cs => CuestationSchema.parse(cs));
    }
    
    if (updates.config) {
      db.config = ConfigSchema.parse(updates.config);
    }
    
    await this.saveDatabase(db);
  }

  // ============================================
  // Utility Methods
  // ============================================

  public async exportDatabase(): Promise<string> {
    const db = await this.loadDatabase();
    return JSON.stringify(db, null, 2);
  }

  public async importDatabase(jsonData: string): Promise<AsyncResult<void>> {
    try {
      const parsed = JSON.parse(jsonData);
      const validated = validateDatabase(parsed);
      await this.saveDatabase(validated);
      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      };
    }
  }

  public async validateDatabaseFile(): Promise<AsyncResult<DatabaseSchema>> {
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const parsed = JSON.parse(data);
      const validated = validateDatabase(parsed);
      return { success: true, data: validated };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  }

  public async backup(backupPath?: string): Promise<void> {
    const db = await this.loadDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalPath = backupPath || path.join(this.projectDir, `db-backup-${timestamp}.json`);
    await fs.writeFile(finalPath, JSON.stringify(db, null, 2));
  }
}