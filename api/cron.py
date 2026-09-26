from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        data = {
            "status": "ok",
            "fecha": datetime.now().isoformat(),
            "cortes": [{"zona": "PRUEBA", "detalle": "Si lees esto, ya anda!", "horario": "07-22hs"}],
            "total": 1
        }
        self.wfile.write(json.dumps(data).encode())
