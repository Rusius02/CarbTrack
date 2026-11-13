from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import logging
import mimetypes
from pathlib import Path
from urllib.parse import unquote, urlsplit

from backend.carbtrack.domain.workspace import ValidationError

LOGGER = logging.getLogger("carbtrack.http")
MAX_REQUEST_SIZE = 1_000_000


class CarbTrackRequestHandler(BaseHTTPRequestHandler):
    service = None
    static_root = None

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/workspace":
            self._get_workspace()
            return
        if path == "/api/health":
            self._send_json(HTTPStatus.OK, {"status": "ok", "storage": "sqlite"})
            return
        self._serve_static_file(path)

    def do_PUT(self):
        if urlsplit(self.path).path != "/api/workspace":
            self._send_error(HTTPStatus.NOT_FOUND, "Route introuvable.")
            return
        self._put_workspace()

    def do_OPTIONS(self):
        self._send_error(HTTPStatus.METHOD_NOT_ALLOWED, "Méthode non autorisée.")

    def _get_workspace(self):
        try:
            self._send_json(HTTPStatus.OK, self.service.get_workspace())
        except Exception:
            LOGGER.exception("Échec du chargement du workspace.")
            self._send_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Impossible de lire la base SQLite locale.")

    def _put_workspace(self):
        try:
            payload = self._read_json_body()
            workspace = self.service.save_workspace(payload)
            self._send_json(HTTPStatus.OK, workspace)
        except ValidationError as error:
            self._send_error(HTTPStatus.BAD_REQUEST, str(error))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_error(HTTPStatus.BAD_REQUEST, "Le corps de la requête doit être un JSON UTF-8 valide.")
        except ValueError as error:
            self._send_error(HTTPStatus.BAD_REQUEST, str(error))
        except Exception:
            LOGGER.exception("Échec de l’enregistrement du workspace.")
            self._send_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Impossible d’enregistrer dans la base SQLite locale.")

    def _read_json_body(self):
        raw_length = self.headers.get("Content-Length", "")
        try:
            length = int(raw_length)
        except ValueError as error:
            raise ValueError("En-tête Content-Length invalide.") from error
        if length < 0 or length > MAX_REQUEST_SIZE:
            raise ValueError("La requête est vide ou dépasse la taille maximale autorisée.")
        body = self.rfile.read(length)
        if not body:
            raise ValueError("Le corps JSON est obligatoire.")
        return json.loads(body.decode("utf-8"))

    def _serve_static_file(self, url_path):
        try:
            relative_path = unquote(url_path).lstrip("/") or "index.html"
            candidate = (self.static_root / relative_path).resolve()
            candidate.relative_to(self.static_root.resolve())
            if not candidate.is_file():
                raise FileNotFoundError
            content = candidate.read_bytes()
        except (ValueError, FileNotFoundError, OSError):
            self._send_error(HTTPStatus.NOT_FOUND, "Fichier introuvable.")
            return

        content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        if candidate.suffix == ".js":
            content_type = "text/javascript; charset=utf-8"
        if candidate.suffix in {".html", ".css", ".js"}:
            content_type = f"{content_type}; charset=utf-8"
        self._send_bytes(HTTPStatus.OK, content, content_type)

    def _send_json(self, status, payload):
        content = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self._send_bytes(status, content, "application/json; charset=utf-8")

    def _send_error(self, status, message):
        self._send_json(status, {"error": message})

    def _send_bytes(self, status, content, content_type):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format_string, *args):
        LOGGER.info("%s - %s", self.address_string(), format_string % args)


def create_server(host, port, workspace_service, static_root):
    handler = type(
        "ConfiguredCarbTrackRequestHandler",
        (CarbTrackRequestHandler,),
        {"service": workspace_service, "static_root": Path(static_root)},
    )
    return ThreadingHTTPServer((host, port), handler)
