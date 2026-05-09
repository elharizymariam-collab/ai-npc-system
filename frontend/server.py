from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            text = data.get('text', '').strip()

            if not text:
                self.send_error(400, "No text provided")
                return

            # المفتاح والـ Voice ID الجديد
            MUNSIT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlfaWQiOiI4OGJiYTUyMy1iYTAxLTRlZmEtYmQ4Ny0xYzM4Mjc2YzMzZGMiLCJpYXQiOjE3NzgzNTE2MjAsImV4cCI6MjA5MzcxMTYyMH0._BSIctMY54WPSsH5_ITVWlQwcFPgO1Zotj2vhoEy1Ws"
            VOICE_ID = "WcxyRPjVQcpVYmceBQO4Helb"

            url = "https://api.munsit.com/api/v1/text-to-speech/faseeh-v1-preview"

            headers = {
                "Accept": "audio/wav",
                "Content-Type": "application/json",
                "x-api-key": MUNSIT_API_KEY
            }

            body = {
                "voice_id": VOICE_ID,
                "text": text,
                "speed": 0.96,
                "pitch": 1.03,
                "stability": 0.88,
                "clarity": 0.90
            }

            print(f"🎤 Using Voice ID: {VOICE_ID}")
            print(f"Text: {text[:60]}...")

            req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers, method='POST')

            with urllib.request.urlopen(req) as response:
                audio = response.read()

            print(f"✅ Voice Success: {len(audio)} bytes")

            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'audio/wav')
            self.send_header('Content-Length', len(audio))
            self.end_headers()
            self.wfile.write(audio)

        except Exception as e:
            print(f"❌ Munsit Error: {str(e)}")
            self.send_error(500, f"Munsit Error: {str(e)}")

    def do_GET(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Munsit TTS Server is running")

print("🚀 Munsit TTS Server running on http://localhost:8000")
HTTPServer(('localhost', 8000), Handler).serve_forever()