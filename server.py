# Static server that tells the browser to always revalidate files.
import http.server, functools, os

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

handler = functools.partial(NoCache, directory=os.path.dirname(os.path.abspath(__file__)))
print("Japon 2027 → http://localhost:5173")
http.server.ThreadingHTTPServer(("127.0.0.1", 5173), handler).serve_forever()
