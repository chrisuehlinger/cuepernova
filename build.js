#!/usr/bin/env node

/**
 * Build script for Cuepernova TypeScript compilation
 * Compiles both backend and frontend TypeScript files
 */

import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();

// Clean dist directories
console.log('🧹 Cleaning previous build...');
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
}

// Clean compiled frontend files
if (existsSync('static/js')) {
  ['control.js', 'orbital.js', 'mapping.js'].forEach(file => {
    const filePath = join('static/js', file);
    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  });
}

// Create dist directories
mkdirSync('dist', { recursive: true });

// Build backend TypeScript
console.log('🔨 Building backend TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ Backend TypeScript compiled successfully');
} catch (error) {
  console.error('❌ Backend TypeScript compilation failed');
  process.exit(1);
}

// Build frontend TypeScript
console.log('🔨 Building frontend TypeScript...');
try {
  execSync('npx tsc -p tsconfig.frontend.json', { stdio: 'inherit' });
  
  // Move compiled files to correct location
  ['control.js', 'orbital.js', 'mapping.js'].forEach(file => {
    const srcPath = join('static/static-src/js', file);
    const destPath = join('static/js', file);
    if (existsSync(srcPath)) {
      cpSync(srcPath, destPath);
    }
  });
  
  // Clean up temp directory
  if (existsSync('static/static-src')) {
    rmSync('static/static-src', { recursive: true });
  }
  
  console.log('✅ Frontend TypeScript compiled successfully');
} catch (error) {
  console.error('❌ Frontend TypeScript compilation failed');
  process.exit(1);
}

// Copy non-TypeScript files to dist
console.log('📦 Copying additional files...');

// Copy views (Pug templates)
if (existsSync('views')) {
  cpSync('views', 'dist/views', { recursive: true });
  console.log('✅ Copied views');
}

// Make CLI executable
if (existsSync('dist/cli.js')) {
  execSync('chmod +x dist/cli.js');
  console.log('✅ Made CLI executable');
}

console.log('🎉 Build completed successfully!');