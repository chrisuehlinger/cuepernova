#!/usr/bin/env node

import init from '../app.js';

init().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});