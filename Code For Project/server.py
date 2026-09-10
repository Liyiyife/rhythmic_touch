from __future__ import annotations

import hashlib
import hmac
import json
import mimetypes
import base64
import csv
import io
import os
import secrets
import socket
import sqlite3
import sys
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("RHYTHMTOUCH_DB", ROOT / "rhythmtouch.sqlite3"))
SCHEMA_PATH = ROOT / "schema.sql"
HOST = os.environ.get("RHYTHMTOUCH_HOST", "0.0.0.0")
PORT = int(os.environ.get("RHYTHMTOUCH_PORT", "3000"))
ADMIN_USERNAME = os.environ.get("RHYTHMTOUCH_ADMIN_USERNAME", "").strip()
ADMIN_PASSWORD = os.environ.get("RHYTHMTOUCH_ADMIN_PASSWORD", "")
ADMIN_TOKEN_LIFETIME = 12 * 60 * 60
FORMAL_TRIAL_COUNT = 14

TOKEN_SECRET = secrets.token_bytes(32)
ADMIN_LOGIN_FAILURES: dict[str, list[float]] = {}

TABLES = {
    "trials": (
        "trial_id",
        [
            "trial_id", "user_id", "block_id", "block_number", "trial_number",
            "sub_block_order", "pattern_order", "repetition_number",
            "pattern_id", "rhythmic_complexity", "input_action_type",
            "feedback_modality", "target_action_sequence",
            "target_rhythm_intervals", "task_success", "trial_start_time",
            "trial_end_time",
        ],
    ),
    "attempts": (
        "attempt_id",
        [
            "attempt_id", "trial_id", "attempt_number", "similarity_score",
            "attempt_success", "action_count_correct", "action_type_correct",
            "action_order_correct", "overall_action_correct", "preview_end_time",
            "attempt_start_time", "attempt_end_time",
        ],
    ),
    "actions": (
        "action_id",
        [
            "action_id", "attempt_id", "action_index", "action_type", "timestamp",
        ],
    ),
    "survey_responses": (
        "survey_response_id",
        [
            "survey_response_id", "user_id", "survey_type", "block_id",
            "block_number", "responses", "submitted_at",
        ],
    ),
}

JSON_COLUMNS = {
    "target_action_sequence",
    "target_rhythm_intervals",
    "responses",
}

BOOLEAN_COLUMNS = {
    "task_success",
    "attempt_success",
    "action_count_correct",
    "action_type_correct",
    "action_order_correct",
    "overall_action_correct",
}

ALLOWED_SURVEY_TYPES = {"NASA_TLX", "SUB_BLOCK_RATING"}

ADMIN_TABLES = {
    "users": {
        "from": "users u",
        "columns": [
            "u.user_id", "u.username", "u.participant_number", "u.created_at",
        ],
        "order": "u.created_at DESC",
    },
    "trials": {
        "from": "trials t JOIN users u ON u.user_id = t.user_id",
        "columns": [
            "t.trial_id", "t.user_id", "u.username", "t.block_id",
            "t.block_number", "t.sub_block_order", "t.pattern_order",
            "t.trial_number", "t.repetition_number", "t.pattern_id",
            "t.rhythmic_complexity", "t.input_action_type",
            "t.feedback_modality", "t.target_action_sequence",
            "t.target_rhythm_intervals", "t.task_success",
            "t.trial_start_time", "t.trial_end_time",
        ],
        "order": "t.trial_start_time DESC",
    },
    "attempts": {
        "from": (
            "attempts a JOIN trials t ON t.trial_id = a.trial_id "
            "JOIN users u ON u.user_id = t.user_id"
        ),
        "columns": [
            "a.attempt_id", "a.trial_id", "t.user_id", "u.username",
            "t.block_number", "t.pattern_id", "a.attempt_number",
            "a.similarity_score", "a.attempt_success",
            "a.action_count_correct", "a.action_type_correct",
            "a.action_order_correct", "a.overall_action_correct",
            "a.preview_end_time", "a.attempt_start_time",
            "a.attempt_end_time",
        ],
        "order": "a.attempt_start_time DESC",
    },
    "actions": {
        "from": (
            "actions ac JOIN attempts a ON a.attempt_id = ac.attempt_id "
            "JOIN trials t ON t.trial_id = a.trial_id "
            "JOIN users u ON u.user_id = t.user_id"
        ),
        "columns": [
            "ac.action_id", "ac.attempt_id", "t.user_id", "u.username",
            "t.block_number", "t.pattern_id", "a.attempt_number",
            "ac.action_index", "ac.action_type", "ac.timestamp",
        ],
        "order": "ac.timestamp DESC",
    },
    "survey_responses": {
        "from": (
            "survey_responses s JOIN users u ON u.user_id = s.user_id"
        ),
        "columns": [
            "s.survey_response_id", "s.user_id", "u.username",
            "s.survey_type", "s.block_id", "s.block_number",
            "s.responses", "s.submitted_at",
        ],
        "order": "s.submitted_at DESC",
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def local_network_ip() -> str | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as connection:
            connection.connect(("8.8.8.8", 80))
            return connection.getsockname()[0]
    except OSError:
        try:
            return socket.gethostbyname(socket.gethostname())
        except OSError:
            return None


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialise_database() -> None:
    with connect() as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        user_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(users)")
        }
        if "participant_number" not in user_columns:
            connection.execute(
                "ALTER TABLE users ADD COLUMN participant_number INTEGER"
            )
            existing_users = connection.execute(
                "SELECT user_id FROM users ORDER BY created_at, rowid"
            ).fetchall()
            for participant_number, existing_user in enumerate(existing_users, 1):
                connection.execute(
                    "UPDATE users SET participant_number = ? WHERE user_id = ?",
                    (participant_number, existing_user["user_id"]),
                )
            connection.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_participant_number "
                "ON users(participant_number)"
            )
        trial_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(trials)")
        }
        if "sub_block_order" not in trial_columns:
            connection.execute(
                "ALTER TABLE trials ADD COLUMN sub_block_order INTEGER"
            )
        if "pattern_order" not in trial_columns:
            connection.execute(
                "ALTER TABLE trials ADD COLUMN pattern_order INTEGER"
            )
        survey_schema = connection.execute(
            """
            SELECT sql FROM sqlite_master
            WHERE type = 'table' AND name = 'survey_responses'
            """
        ).fetchone()
        if survey_schema and "CHECK" in survey_schema["sql"].upper():
            connection.executescript(
                """
                ALTER TABLE survey_responses RENAME TO survey_responses_legacy;

                CREATE TABLE survey_responses (
                    survey_response_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(user_id)
                        ON DELETE CASCADE,
                    survey_type TEXT NOT NULL,
                    block_id TEXT,
                    block_number INTEGER,
                    responses TEXT NOT NULL,
                    submitted_at TEXT NOT NULL
                );

                INSERT INTO survey_responses (
                    survey_response_id,
                    user_id,
                    survey_type,
                    block_id,
                    block_number,
                    responses,
                    submitted_at
                )
                SELECT
                    survey_response_id,
                    user_id,
                    survey_type,
                    block_id,
                    block_number,
                    responses,
                    submitted_at
                FROM survey_responses_legacy;

                DROP TABLE survey_responses_legacy;
                CREATE INDEX IF NOT EXISTS idx_surveys_user
                    ON survey_responses(user_id);
                """
            )
        connection.commit()


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return digest.hex(), salt.hex()


def verify_password(password: str, stored_hash: str, stored_salt: str) -> bool:
    candidate, _ = hash_password(password, bytes.fromhex(stored_salt))
    return hmac.compare_digest(candidate, stored_hash)


def create_token(user_id: str) -> str:
    encoded_user = base64.urlsafe_b64encode(user_id.encode()).decode().rstrip("=")
    signature = hmac.new(
        TOKEN_SECRET, encoded_user.encode(), hashlib.sha256
    ).hexdigest()
    return f"{encoded_user}.{signature}"


def read_token(token: str) -> str | None:
    try:
        encoded_user, signature = token.split(".", 1)
        expected = hmac.new(
            TOKEN_SECRET, encoded_user.encode(), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        padding = "=" * (-len(encoded_user) % 4)
        return base64.urlsafe_b64decode(
            encoded_user + padding
        ).decode()
    except (ValueError, UnicodeDecodeError):
        return None


def create_admin_token() -> str:
    issued_at = int(time.time())
    nonce = secrets.token_hex(12)
    payload = f"{issued_at}:{nonce}"
    encoded = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    signature = hmac.new(
        TOKEN_SECRET, f"admin:{encoded}".encode(), hashlib.sha256
    ).hexdigest()
    return f"{encoded}.{signature}"


def read_admin_token(token: str) -> bool:
    try:
        encoded, signature = token.split(".", 1)
        expected = hmac.new(
            TOKEN_SECRET, f"admin:{encoded}".encode(), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return False
        padding = "=" * (-len(encoded) % 4)
        payload = base64.urlsafe_b64decode(encoded + padding).decode()
        issued_at_text, _ = payload.split(":", 1)
        issued_at = int(issued_at_text)
        age = int(time.time()) - issued_at
        return 0 <= age <= ADMIN_TOKEN_LIFETIME
    except (ValueError, UnicodeDecodeError):
        return False


def decode_row(row: sqlite3.Row) -> dict:
    item = dict(row)
    for key in JSON_COLUMNS:
        if key in item and item[key] is not None:
            item[key] = json.loads(item[key])
    for key in BOOLEAN_COLUMNS:
        if key in item and item[key] is not None:
            item[key] = bool(item[key])
    return item


class RhythmTouchHandler(SimpleHTTPRequestHandler):
    server_version = "RhythmTouch/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def send_json(self, status: int, payload: dict | list) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_csv(self, filename: str, rows: list[dict]) -> None:
        stream = io.StringIO(newline="")
        columns = list(rows[0].keys()) if rows else []
        writer = csv.DictWriter(stream, fieldnames=columns)
        if columns:
            writer.writeheader()
            for row in rows:
                writer.writerow({
                    key: (
                        json.dumps(value, ensure_ascii=False)
                        if isinstance(value, (dict, list))
                        else value
                    )
                    for key, value in row.items()
                })
        body = ("\ufeff" + stream.getvalue()).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header(
            "Content-Disposition",
            f'attachment; filename="{filename}"',
        )
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 2_000_000:
            raise ValueError("Invalid request body")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def current_user_id(self) -> str | None:
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None
        return read_token(header.removeprefix("Bearer ").strip())

    def require_user(self) -> str | None:
        user_id = self.current_user_id()
        if not user_id:
            self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Sign in first"})
        return user_id

    def require_admin(self) -> bool:
        header = self.headers.get("Authorization", "")
        token = (
            header.removeprefix("Bearer ").strip()
            if header.startswith("Bearer ")
            else ""
        )
        if not token or not read_admin_token(token):
            self.send_json(
                HTTPStatus.UNAUTHORIZED,
                {"error": "Administrator sign-in required"},
            )
            return False
        return True

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/health":
            self.send_json(HTTPStatus.OK, {
                "ok": True,
                "database": DB_PATH.name,
                "time": utc_now(),
            })
            return
        if path == "/api/admin/summary":
            if self.require_admin():
                self.admin_summary()
            return
        if path == "/api/admin/data":
            if self.require_admin():
                self.admin_data(parse_qs(parsed.query))
            return
        if path == "/api/admin/export":
            if self.require_admin():
                self.admin_export(parse_qs(parsed.query))
            return
        if path in {"/admin", "/admin/"}:
            self.path = "/admin.html"
        super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            payload = self.read_json()
            if path == "/api/register":
                self.register(payload)
            elif path == "/api/login":
                self.login(payload)
            elif path == "/api/admin/login":
                self.admin_login(payload)
            elif path == "/api/sync":
                self.sync_record(payload)
            else:
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint"})
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except sqlite3.IntegrityError as error:
            message = str(error)
            if "users.username" in message:
                message = "That username is already in use"
            self.send_json(HTTPStatus.CONFLICT, {"error": message})
        except Exception as error:
            print(f"API error: {error}", file=sys.stderr)
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {
                "error": "Server error"
            })

    def register(self, payload: dict) -> None:
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", ""))
        if not username or not password:
            raise ValueError("Enter a username and password")
        user_id = f"U_{secrets.token_hex(8)}"
        password_hash, password_salt = hash_password(password)
        token = create_token(user_id)
        with connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            participant_number = connection.execute(
                "SELECT COALESCE(MAX(participant_number), 0) + 1 FROM users"
            ).fetchone()[0]
            connection.execute(
                """
                INSERT INTO users
                (user_id, username, participant_number, password_hash,
                 password_salt, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, username, participant_number, password_hash,
                 password_salt, utc_now()),
            )
            connection.commit()
        self.send_json(HTTPStatus.CREATED, {
            "token": token,
            "user": {
                "user_id": user_id,
                "username": username,
                "participant_number": participant_number,
            },
        })

    def login(self, payload: dict) -> None:
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", ""))
        with connect() as connection:
            row = connection.execute(
                """
                SELECT user_id, username, participant_number,
                       password_hash, password_salt
                FROM users WHERE username = ?
                """,
                (username,),
            ).fetchone()
            if not row or not verify_password(
                password, row["password_hash"], row["password_salt"]
            ):
                self.send_json(
                    HTTPStatus.UNAUTHORIZED,
                    {"error": "Incorrect username or password"},
                )
                return
            token = create_token(row["user_id"])
        self.send_json(HTTPStatus.OK, {
            "token": token,
            "user": {
                "user_id": row["user_id"],
                "username": row["username"],
                "participant_number": row["participant_number"],
            },
        })

    def admin_login(self, payload: dict) -> None:
        if not ADMIN_USERNAME or not ADMIN_PASSWORD:
            self.send_json(
                HTTPStatus.SERVICE_UNAVAILABLE,
                {"error": "Administrator access has not been configured"},
            )
            return
        client = self.client_address[0]
        current_time = time.monotonic()
        recent_failures = [
            failed_at
            for failed_at in ADMIN_LOGIN_FAILURES.get(client, [])
            if current_time - failed_at < 60
        ]
        ADMIN_LOGIN_FAILURES[client] = recent_failures
        if len(recent_failures) >= 5:
            self.send_json(
                HTTPStatus.TOO_MANY_REQUESTS,
                {"error": "Too many attempts. Try again in one minute."},
            )
            return
        username = str(payload.get("username", ""))
        password = str(payload.get("password", ""))
        valid = (
            hmac.compare_digest(username, ADMIN_USERNAME)
            and hmac.compare_digest(password, ADMIN_PASSWORD)
        )
        if not valid:
            recent_failures.append(current_time)
            ADMIN_LOGIN_FAILURES[client] = recent_failures
            self.send_json(
                HTTPStatus.UNAUTHORIZED,
                {"error": "Incorrect administrator username or password"},
            )
            return
        ADMIN_LOGIN_FAILURES.pop(client, None)
        self.send_json(HTTPStatus.OK, {
            "token": create_admin_token(),
            "expires_in": ADMIN_TOKEN_LIFETIME,
        })

    def admin_summary(self) -> None:
        with connect() as connection:
            counts = {
                table: connection.execute(
                    f"SELECT COUNT(*) AS total FROM {table}"
                ).fetchone()["total"]
                for table in ADMIN_TABLES
            }
            ended_trials = connection.execute(
                "SELECT COUNT(*) AS total FROM trials WHERE trial_end_time IS NOT NULL"
            ).fetchone()["total"]
            successful_trials = connection.execute(
                "SELECT COUNT(*) AS total FROM trials WHERE task_success = 1"
            ).fetchone()["total"]
            average_similarity = connection.execute(
                """
                SELECT ROUND(AVG(similarity_score), 1) AS average
                FROM attempts
                WHERE similarity_score IS NOT NULL
                """
            ).fetchone()["average"]
            participants = [
                dict(row)
                for row in connection.execute(
                    """
                    SELECT
                        u.user_id,
                        u.username,
                        u.created_at,
                        (
                            SELECT COUNT(*)
                            FROM trials t
                            WHERE t.user_id = u.user_id
                        ) AS trial_count,
                        (
                            SELECT COUNT(*)
                            FROM trials t
                            WHERE t.user_id = u.user_id
                              AND t.trial_end_time IS NOT NULL
                        ) AS completed_trials,
                        (
                            SELECT COUNT(*)
                            FROM trials t
                            WHERE t.user_id = u.user_id
                              AND t.task_success = 1
                        ) AS successful_trials,
                        (
                            SELECT ROUND(AVG(a.similarity_score), 1)
                            FROM attempts a
                            JOIN trials t ON t.trial_id = a.trial_id
                            WHERE t.user_id = u.user_id
                              AND a.similarity_score IS NOT NULL
                        ) AS average_similarity,
                        (
                            SELECT MAX(activity_time)
                            FROM (
                                SELECT MAX(t.trial_start_time) AS activity_time
                                FROM trials t
                                WHERE t.user_id = u.user_id
                                UNION ALL
                                SELECT MAX(a.attempt_start_time)
                                FROM attempts a
                                JOIN trials t ON t.trial_id = a.trial_id
                                WHERE t.user_id = u.user_id
                            )
                        ) AS last_activity
                    FROM users u
                    ORDER BY COALESCE(last_activity, 0) DESC, u.created_at DESC
                    """
                ).fetchall()
            ]
        for participant in participants:
            participant["progress_percent"] = min(
                100,
                round(
                    participant["completed_trials"]
                    / FORMAL_TRIAL_COUNT
                    * 100
                ),
            )
        self.send_json(HTTPStatus.OK, {
            "counts": counts,
            "ended_trials": ended_trials,
            "successful_trials": successful_trials,
            "success_rate": (
                round(successful_trials / ended_trials * 100, 1)
                if ended_trials else 0
            ),
            "average_similarity": average_similarity,
            "formal_trial_count": FORMAL_TRIAL_COUNT,
            "participants": participants,
            "updated_at": utc_now(),
        })

    def admin_query_rows(
        self,
        query: dict[str, list[str]],
        for_export: bool = False,
    ) -> tuple[str, int, list[dict]]:
        table = query.get("table", ["trials"])[0]
        if table not in ADMIN_TABLES:
            raise ValueError("Invalid data table")
        user_id = query.get("user_id", [""])[0].strip()
        block_number = query.get("block_number", [""])[0].strip()
        search = query.get("search", [""])[0].strip()
        spec = ADMIN_TABLES[table]
        clauses = []
        parameters: list[object] = []
        user_columns = {
            "users": "u.user_id",
            "trials": "t.user_id",
            "attempts": "t.user_id",
            "actions": "t.user_id",
            "survey_responses": "s.user_id",
        }
        block_columns = {
            "trials": "t.block_number",
            "attempts": "t.block_number",
            "actions": "t.block_number",
            "survey_responses": "s.block_number",
        }
        search_columns = {
            "users": ["u.username", "u.user_id"],
            "trials": ["u.username", "t.trial_id", "t.pattern_id"],
            "attempts": ["u.username", "a.attempt_id", "t.pattern_id"],
            "actions": ["u.username", "ac.action_id", "t.pattern_id"],
            "survey_responses": [
                "u.username", "s.survey_response_id", "s.survey_type",
            ],
        }
        if user_id:
            clauses.append(f"{user_columns[table]} = ?")
            parameters.append(user_id)
        if block_number and table in block_columns:
            try:
                parsed_block = int(block_number)
            except ValueError as error:
                raise ValueError("Invalid block number") from error
            if parsed_block not in {1, 2, 3}:
                raise ValueError("Invalid block number")
            clauses.append(f"{block_columns[table]} = ?")
            parameters.append(parsed_block)
        if search:
            expressions = [
                f"{column} LIKE ?" for column in search_columns[table]
            ]
            clauses.append(f"({' OR '.join(expressions)})")
            parameters.extend([f"%{search}%"] * len(expressions))
        where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
        try:
            requested_limit = int(query.get("limit", ["100"])[0])
            offset = max(0, int(query.get("offset", ["0"])[0]))
        except ValueError as error:
            raise ValueError("Invalid pagination parameters") from error
        limit = 100_000 if for_export else min(max(requested_limit, 1), 500)
        columns = ", ".join(spec["columns"])
        with connect() as connection:
            total = connection.execute(
                f"SELECT COUNT(*) AS total FROM {spec['from']}{where}",
                parameters,
            ).fetchone()["total"]
            rows = [
                decode_row(row)
                for row in connection.execute(
                    (
                        f"SELECT {columns} FROM {spec['from']}{where} "
                        f"ORDER BY {spec['order']} LIMIT ? OFFSET ?"
                    ),
                    [*parameters, limit, offset],
                ).fetchall()
            ]
        return table, total, rows

    def admin_data(self, query: dict[str, list[str]]) -> None:
        table, total, rows = self.admin_query_rows(query)
        self.send_json(HTTPStatus.OK, {
            "table": table,
            "total": total,
            "rows": rows,
        })

    def admin_export(self, query: dict[str, list[str]]) -> None:
        table, _, rows = self.admin_query_rows(query, for_export=True)
        date = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        self.send_csv(f"{table}-{date}.csv", rows)

    def sync_record(self, payload: dict) -> None:
        user_id = self.require_user()
        if not user_id:
            return
        table = str(payload.get("table", ""))
        record = payload.get("record")
        if table not in TABLES or not isinstance(record, dict):
            raise ValueError("Invalid table or record")
        if (
            table == "survey_responses"
            and record.get("survey_type") not in ALLOWED_SURVEY_TYPES
        ):
            raise ValueError("Invalid questionnaire type")
        self.authorise_record(user_id, table, record)
        primary_key, columns = TABLES[table]
        values = []
        for column in columns:
            value = record.get(column)
            if column in JSON_COLUMNS and value is not None:
                value = json.dumps(value, ensure_ascii=False)
            if column in BOOLEAN_COLUMNS and value is not None:
                value = int(bool(value))
            values.append(value)
        update_columns = [column for column in columns if column != primary_key]
        assignments = ", ".join(f"{column} = excluded.{column}" for column in update_columns)
        placeholders = ", ".join("?" for _ in columns)
        sql = (
            f"INSERT INTO {table} ({', '.join(columns)}) "
            f"VALUES ({placeholders}) "
            f"ON CONFLICT({primary_key}) DO UPDATE SET {assignments}"
        )
        with connect() as connection:
            connection.execute(sql, values)
            connection.commit()
        self.send_json(HTTPStatus.OK, {"ok": True})

    def authorise_record(self, user_id: str, table: str, record: dict) -> None:
        if table in {
            "trials", "survey_responses",
        }:
            if record.get("user_id") != user_id:
                raise ValueError("Record does not belong to the signed-in user")
            return
        with connect() as connection:
            if table == "attempts":
                owner = connection.execute(
                    "SELECT user_id FROM trials WHERE trial_id = ?",
                    (record.get("trial_id"),),
                ).fetchone()
            else:
                owner = connection.execute(
                    """
                    SELECT t.user_id
                    FROM attempts a
                    JOIN trials t ON t.trial_id = a.trial_id
                    WHERE a.attempt_id = ?
                    """,
                    (record.get("attempt_id"),),
                ).fetchone()
        if not owner or owner["user_id"] != user_id:
            raise ValueError("Related record does not belong to the signed-in user")

def main() -> None:
    mimetypes.add_type("text/javascript", ".js")
    initialise_database()
    server = ThreadingHTTPServer((HOST, PORT), RhythmTouchHandler)
    print(f"RhythmTouch is running at http://localhost:{PORT}")
    network_ip = local_network_ip()
    if network_ip and not network_ip.startswith("127."):
        print(f"Mobile access: http://{network_ip}:{PORT}")
    print(f"SQLite database: {DB_PATH}")
    print("Connect the phone and computer to the same Wi-Fi network.")
    print("Keep this window open. Press Ctrl+C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
