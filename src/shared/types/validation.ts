/**
 * Zod validation schemas for runtime type safety
 */

import { z } from 'zod';
import { CUE_TYPES, SYSTEM_COMMANDS } from './index';

// ============================================
// Core Schemas
// ============================================

export const CueArgumentSchema = z.union([
  z.string(),
  z.number(),
  z.boolean()
]);

export const CueSchema = z.object({
  id: z.string().uuid(),
  number: z.string(),
  name: z.string().min(1),
  type: z.enum(CUE_TYPES),
  args: z.array(CueArgumentSchema),
  notes: z.string().optional(),
  address: z.string().optional(),
  group: z.string().optional()
});

export const MaptasticMappingSchema = z.object({
  layers: z.array(z.object({
    targetPoints: z.array(z.array(z.number())),
    sourcePoints: z.array(z.array(z.number()))
  })).optional()
});

export const CuestationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  showtimeResolution: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }),
  mapping: MaptasticMappingSchema.optional(),
  connected: z.boolean().optional(),
  currentScreen: z.string().optional(),
  lastUpdate: z.number().optional()
});

export const ConfigSchema = z.object({
  oscPort: z.number().min(1024).max(65535).default(57121),
  httpPort: z.number().min(1024).max(65535).default(8080),
  httpsPort: z.number().min(1024).max(65535).default(8443),
  defaultCuestation: z.string().optional()
});

export const DatabaseSchema = z.object({
  cues: z.array(CueSchema),
  cuestations: z.array(CuestationSchema),
  config: ConfigSchema
});

// ============================================
// Message Schemas
// ============================================

export const WebSocketMessageSchema = z.object({
  address: z.string().regex(/^\/[\w\/]+$/),
  args: z.array(CueArgumentSchema),
  timestamp: z.number().optional(),
  source: z.enum(['osc', 'control', 'system']).optional()
});

export const SystemMessageSchema = WebSocketMessageSchema.extend({
  command: z.enum(SYSTEM_COMMANDS)
});

export const OSCMessageSchema = z.object({
  address: z.string(),
  args: z.array(z.any())
});

// ============================================
// Validation Functions
// ============================================

export function validateCue(data: unknown): z.infer<typeof CueSchema> {
  return CueSchema.parse(data);
}

export function validateCuestation(data: unknown): z.infer<typeof CuestationSchema> {
  return CuestationSchema.parse(data);
}

export function validateConfig(data: unknown): z.infer<typeof ConfigSchema> {
  return ConfigSchema.parse(data);
}

export function validateDatabase(data: unknown): z.infer<typeof DatabaseSchema> {
  return DatabaseSchema.parse(data);
}

export function validateWebSocketMessage(data: unknown): z.infer<typeof WebSocketMessageSchema> {
  return WebSocketMessageSchema.parse(data);
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: any) => e.message).join(', ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

// ============================================
// Type Guards
// ============================================

export function isCue(data: unknown): data is z.infer<typeof CueSchema> {
  return CueSchema.safeParse(data).success;
}

export function isCuestation(data: unknown): data is z.infer<typeof CuestationSchema> {
  return CuestationSchema.safeParse(data).success;
}

export function isWebSocketMessage(data: unknown): data is z.infer<typeof WebSocketMessageSchema> {
  return WebSocketMessageSchema.safeParse(data).success;
}

export function isSystemMessage(data: unknown): data is z.infer<typeof SystemMessageSchema> {
  return SystemMessageSchema.safeParse(data).success;
}