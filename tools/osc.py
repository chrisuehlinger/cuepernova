#!/usr/bin/env python3
"""
Simple OSC command-line sender
Usage: osc /path/to/command [args...]
"""
import socket
import struct
import sys

def send_osc(address, port, path, *args):
    def pad(data):
        pad_len = (4 - len(data) % 4) % 4
        return data + b'\x00' * pad_len
    
    path_bytes = pad(path.encode('utf-8'))
    type_tags = ','
    arg_data = b''
    
    for arg in args:
        if arg.replace('.','',1).replace('-','',1).isdigit():
            # It's a number
            type_tags += 'f'
            arg_data += struct.pack('>f', float(arg))
        else:
            # It's a string
            type_tags += 's'
            arg_bytes = arg.encode('utf-8') + b'\x00'
            arg_data += pad(arg_bytes)
    
    type_tag_bytes = pad(type_tags.encode('utf-8'))
    message = path_bytes + type_tag_bytes + arg_data
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(message, (address, port))
    sock.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: osc /path/to/command [args...]")
        sys.exit(1)
    
    host = 'localhost'
    port = 57121
    path = sys.argv[1]
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    send_osc(host, port, path, *args)
    print(f"Sent: {path} {' '.join(args)}")