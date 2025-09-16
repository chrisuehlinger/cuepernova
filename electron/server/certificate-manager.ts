import forge from 'node-forge';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as net from 'node:net';

export class CertificateManager {
  private caKey: forge.pki.PrivateKey | null = null;
  private caCert: forge.pki.Certificate | null = null;

  async initializeCA(projectDir: string): Promise<void> {
    const caDir = path.join(projectDir, '.cuepernova');
    const caCertPath = path.join(caDir, 'ca-cert.pem');
    const caKeyPath = path.join(caDir, 'ca-key.pem');

    // Create directory if it doesn't exist
    await fs.mkdir(caDir, { recursive: true });

    // Check if CA already exists
    try {
      const certPem = await fs.readFile(caCertPath, 'utf-8');
      const keyPem = await fs.readFile(caKeyPath, 'utf-8');
      this.caCert = forge.pki.certificateFromPem(certPem);
      this.caKey = forge.pki.privateKeyFromPem(keyPem);
      console.log('Loaded existing CA certificate');
      return;
    } catch (error) {
      // CA doesn't exist, create new one
      console.log('Creating new CA certificate');
    }

    // Generate CA key pair
    const keys = forge.pki.rsa.generateKeyPair(2048);
    this.caKey = keys.privateKey;

    // Create CA certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10); // 10 years validity

    const attrs = [
      { name: 'commonName', value: 'Cuepernova CA' },
      { name: 'countryName', value: 'US' },
      { name: 'organizationName', value: 'Cuepernova' },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: true,
        critical: true,
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
        critical: true,
      },
    ]);

    // Self-sign the certificate
    cert.sign(this.caKey, forge.md.sha256.create());
    this.caCert = cert;

    // Save CA certificate and key
    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(this.caKey);

    await fs.writeFile(caCertPath, certPem);
    await fs.writeFile(caKeyPath, keyPem, { mode: 0o600 }); // Secure key file

    console.log('CA certificate created and saved');
  }

  async getServerCertificates(projectDir: string): Promise<{ cert: string; key: string }> {
    // Initialize CA if not already done
    if (!this.caCert || !this.caKey) {
      await this.initializeCA(projectDir);
    }

    // Get all local IP addresses
    const addresses = this.getLocalAddresses();
    
    // Generate server certificate
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    
    cert.publicKey = keys.publicKey;
    cert.serialNumber = Date.now().toString();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1); // 1 year validity

    const attrs = [
      { name: 'commonName', value: 'localhost' },
      { name: 'countryName', value: 'US' },
      { name: 'organizationName', value: 'Cuepernova' },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(this.caCert!.subject.attributes);

    // Add Subject Alternative Names for all addresses
    const altNames = [
      { type: 2, value: 'localhost' }, // DNS
      { type: 2, value: '*.localhost' }, // DNS wildcard
      { type: 7, ip: '127.0.0.1' }, // IP
      { type: 7, ip: '::1' }, // IPv6
    ];

    // Add all local IP addresses
    addresses.forEach(addr => {
      if (addr.includes(':')) {
        // IPv6
        altNames.push({ type: 7, ip: addr });
      } else {
        // IPv4
        altNames.push({ type: 7, ip: addr });
      }
    });

    // Add hostname
    const hostname = os.hostname();
    altNames.push({ type: 2, value: hostname });
    altNames.push({ type: 2, value: `${hostname}.local` });

    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false,
        critical: true,
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
        critical: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
      },
      {
        name: 'subjectAltName',
        altNames,
      },
    ]);

    // Sign with CA (cast to rsa.PrivateKey for forge compatibility)
    cert.sign(this.caKey! as forge.pki.rsa.PrivateKey, forge.md.sha256.create());

    // Return PEM strings
    return {
      cert: forge.pki.certificateToPem(cert),
      key: forge.pki.privateKeyToPem(keys.privateKey),
    };
  }

  private getLocalAddresses(): string[] {
    const addresses: string[] = [];
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        // Skip internal (loopback) addresses
        if (!iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
    
    return addresses;
  }

  async getCACertificate(projectDir: string): Promise<string> {
    if (!this.caCert) {
      await this.initializeCA(projectDir);
    }
    return forge.pki.certificateToPem(this.caCert!);
  }
}