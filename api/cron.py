from http.server import BaseHTTPRequestHandler
import json
import requests
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        cortes = []
        try:
            # Intentamos raspar EPEC
            r = requests.get("https://www.epec.com.ar/cortesprogramados", timeout=10)
            # Si EPEC responde, buscamos texto - fallback simple
            if r.status_code == 200 and "Villa Maria" in r.text:
                cortes = [{"zona": "EPEC - Datos en vivo", "detalle": "Conectado a EPEC", "horario": datetime.now().strftime("%H:%M")}]
            else:
                cortes = []
        except:
            cortes = []

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        resp = {
            "status": "ok",
            "fecha": datetime.now().isoformat(),
            "cortes": cortes,
            "total": len(cortes)
        }
        self.wfile.write(json.dumps(resp).encode())
