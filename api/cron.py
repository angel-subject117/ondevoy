from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
import urllib.request, re

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            url = "https://www.epec.com.ar/actualidad/trabajos-mejoras"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            html = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', errors='ignore')
            # Limpieza básica
            cortes = re.findall(r'(\d{2}-\d{2}hs[^<]{10,120})', html)[:15]
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "fecha": datetime.now().strftime("%d/%m/%Y %H:%M"),
                "cortes": cortes,
                "fuente": url
            }).encode())
        except Exception as e:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status":"error","error":str(e)}).encode())
