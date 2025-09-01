import type { CuepernovaConfig } from 'cuepernova';

const config: CuepernovaConfig = {
  server: {
    httpPort: 8080,
    httpsPort: 8443,
    // Uncomment to enable SSL
    // ssl: {
    //   cert: './certs/cert.pem',
    //   key: './certs/key.pem'
    // }
  },
  osc: {
    port: 57121
  },
  paths: {
    cueballs: './cueballs',
    media: './media',
    nodeModules: './node_modules'
  }
};

export default config;