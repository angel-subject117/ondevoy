from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        ahora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        print(f"[OnDeVoy] Robot OK: {ahora}")
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "message": "OnDeVoy robot funcionando",
            "ultima_actualizacion": ahora
        }).encode())
