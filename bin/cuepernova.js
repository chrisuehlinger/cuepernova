#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const program = new Command();

program
  .name('cuepernova')
  .description('Theater projection control system')
  .version(packageJson.version);

// Start command
program
  .command('start')
  .description('Start the Cuepernova server')
  .option('-p, --port <port>', 'HTTP port', '8080')
  .option('-s, --https-port <port>', 'HTTPS port', '8443')
  .option('-o, --osc-port <port>', 'OSC UDP port', '57121')
  .option('--cert <path>', 'SSL certificate path')
  .option('--key <path>', 'SSL key path')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    const { startServer } = await import('../lib/commands/start.js');
    await startServer(options);
  });

// Init command
program
  .command('init')
  .description('Initialize a new Cuepernova project')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (options) => {
    const { initProject } = await import('../lib/commands/init.js');
    await initProject(options);
  });

// Cueball command
program
  .command('cueball <name>')
  .description('Create a new cueball')
  .action(async (name) => {
    const { createCueball } = await import('../lib/commands/cueball.js');
    await createCueball(name);
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}