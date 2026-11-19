"""Local editing server for the kitchen visualizer.

Run:  python server.py
Open: http://localhost:8000/index.html?edit

Serves this folder and lets edit mode write kitchens-data.js and upload images
straight into it. Only needed while editing; the published site stays static.
"""
import hashlib
import json
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DATA_FILE = 'kitchens-data.js'
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
MAX_BYTES = 25 * 1024 * 1024


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def reply(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def origin_allowed(self):
        # Blocks other websites from posting to this local server
        origin = self.headers.get('Origin')
        if not origin:
            return True
        return origin in (f'http://localhost:{PORT}', f'http://127.0.0.1:{PORT}')

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0 or length > MAX_BYTES:
            return None
        return self.rfile.read(length)

    def do_GET(self):
        if urlparse(self.path).path == '/api/ping':
            return self.reply(200, {'ok': True})
        super().do_GET()

    def do_POST(self):
        url = urlparse(self.path)
        if not self.origin_allowed():
            return self.reply(403, {'error': 'Forbidden origin'})
        body = self.read_body()
        if body is None:
            return self.reply(400, {'error': 'Missing or too large body'})

        if url.path == '/api/save-data':
            text = body.decode('utf-8')
            if not text.lstrip().startswith('//') or 'const savedPhotoKitchens' not in text:
                return self.reply(400, {'error': 'Unexpected data file content'})
            with open(os.path.join(ROOT, DATA_FILE), 'w', encoding='utf-8', newline='\n') as f:
                f.write(text)
            return self.reply(200, {'ok': True, 'file': DATA_FILE})

        if url.path == '/api/upload-image':
            raw = parse_qs(url.query).get('name', [''])[0]
            name = re.sub(r'[^A-Za-z0-9._-]', '_', os.path.basename(raw))
            stem, ext = os.path.splitext(name)
            if not stem or ext.lower() not in IMAGE_EXTENSIONS:
                return self.reply(400, {'error': 'Unsupported image name or type'})
            # Never overwrite a different file: identical content reuses it, otherwise add a suffix
            candidate, n = name, 1
            while os.path.exists(os.path.join(ROOT, candidate)):
                with open(os.path.join(ROOT, candidate), 'rb') as f:
                    if hashlib.sha256(f.read()).digest() == hashlib.sha256(body).digest():
                        return self.reply(200, {'ok': True, 'name': candidate, 'existing': True})
                candidate = f'{stem}-{n}{ext}'
                n += 1
            with open(os.path.join(ROOT, candidate), 'wb') as f:
                f.write(body)
            return self.reply(200, {'ok': True, 'name': candidate, 'existing': False})

        self.reply(404, {'error': 'Not found'})


if __name__ == '__main__':
    print(f'Kitchen editor server: http://localhost:{PORT}/index.html?edit  (Ctrl+C to stop)')
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
