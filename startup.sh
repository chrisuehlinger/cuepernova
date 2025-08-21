#!/bin/bash

# Cuepernova startup script
echo "Starting Cuepernova..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check for SSL certificates
if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
  echo ""
  echo "WARNING: SSL certificates not found!"
  echo "To enable HTTPS, please create certificates using mkcert:"
  echo ""
  echo "  1. Install mkcert: https://github.com/FiloSottile/mkcert#installation"
  echo "  2. Run: mkcert -install"
  echo "  3. Run: mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost $(hostname) $(hostname).local"
  echo ""
  echo "Starting HTTP-only server..."
fi

# Check if we're in development mode
if [ "$1" = "dev" ]; then
  echo "Starting in development mode with auto-restart..."
  npm run dev
else
  # Start the server in production mode
  npm start
fi