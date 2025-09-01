import { loadConfig, mergeWithCliOptions } from '../config/loader.js';
import init from '../server/app.js';
import chalk from 'chalk';

export async function startServer(options) {
  try {
    // Load configuration
    let config = await loadConfig(options.config);
    config = mergeWithCliOptions(config, options);
    
    console.log(chalk.blue.bold('\n🎭 Starting Cuepernova Server\n'));
    
    // Initialize the server with configuration
    const { httpServer, httpsServer } = await init(config);
    
    console.log(chalk.green('\n✨ Cuepernova is ready!'));
    console.log(chalk.gray('───────────────────────────────'));
    console.log(chalk.cyan('📍 Endpoints:'));
    console.log(`   HTTP:  ${chalk.white(`http://localhost:${config.server.httpPort}`)}`);
    if (httpsServer) {
      console.log(`   HTTPS: ${chalk.white(`https://localhost:${config.server.httpsPort}`)}`);
    }
    console.log(`   OSC:   ${chalk.white(`udp://localhost:${config.osc.port}`)}`);
    console.log(chalk.gray('───────────────────────────────'));
    console.log(chalk.cyan('📋 Pages:'));
    console.log(`   Control: ${chalk.white(`http://localhost:${config.server.httpPort}/control.html`)}`);
    console.log(`   Mapping: ${chalk.white(`http://localhost:${config.server.httpPort}/mapping.html`)}`);
    console.log(`   Orbital: ${chalk.white(`http://localhost:${config.server.httpPort}/orbital.html?name=display1`)}`);
    console.log(chalk.gray('───────────────────────────────'));
    console.log(chalk.yellow('\nPress Ctrl+C to stop the server\n'));
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.red('\n\n🛑 Shutting down Cuepernova...'));
      if (httpServer) httpServer.close();
      if (httpsServer) httpsServer.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start server:'), error.message);
    process.exit(1);
  }
}