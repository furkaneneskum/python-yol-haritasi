import re
import subprocess
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import (
    add_daily_minutes,
    add_xp,
    get_activity_map,
    get_connection,
    get_user_stats,
    init_db,
    row_to_dict,
    stats_to_dict,
)

TOPIC_COLUMNS = "id, title, is_completed, notes, duration, time_spent, resources"

app = FastAPI(title="Python Öğrenme Yol Haritası")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BLOCKED_PATTERNS = [
    r"\bimport\s+os\b",
    r"\bimport\s+subprocess\b",
    r"\bimport\s+shutil\b",
    r"\bimport\s+sys\b",
    r"\b__import__\s*\(",
    r"\beval\s*\(",
    r"\bexec\s*\(",
    r"\bopen\s*\(",
    r"\bcompile\s*\(",
    r"\bos\.",
    r"\bsubprocess\.",
]


class CompletionUpdate(BaseModel):
    is_completed: bool


class NotesUpdate(BaseModel):
    notes: str


class TimeUpdate(BaseModel):
    seconds: int = Field(ge=0)
    mode: str = "add"


class CodeRunRequest(BaseModel):
    code: str = Field(max_length=4000)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/topics")
def list_topics() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            f"SELECT {TOPIC_COLUMNS} FROM topics ORDER BY id"
        ).fetchall()
    return [row_to_dict(row) for row in rows]


@app.get("/api/stats")
def get_stats() -> dict:
    with get_connection() as conn:
        return stats_to_dict(get_user_stats(conn))


@app.get("/api/activity")
def get_activity() -> list[dict]:
    with get_connection() as conn:
        return get_activity_map(conn, 30)


@app.put("/api/topics/{topic_id}/completion")
def update_completion(topic_id: int, payload: CompletionUpdate) -> dict:
    with get_connection() as conn:
        old = conn.execute(
            f"SELECT is_completed FROM topics WHERE id = ?", (topic_id,)
        ).fetchone()
        if not old:
            raise HTTPException(status_code=404, detail="Konu bulunamadı")

        conn.execute(
            "UPDATE topics SET is_completed = ? WHERE id = ?",
            (int(payload.is_completed), topic_id),
        )

        xp_gained = 0
        if payload.is_completed and not old["is_completed"]:
            stats = add_xp(conn, 100)
            xp_gained = 100
        else:
            stats = stats_to_dict(get_user_stats(conn))

        conn.commit()
        row = conn.execute(
            f"SELECT {TOPIC_COLUMNS} FROM topics WHERE id = ?",
            (topic_id,),
        ).fetchone()

    result = row_to_dict(row)
    result["xp_gained"] = xp_gained
    result["stats"] = stats
    return result


@app.put("/api/topics/{topic_id}/notes")
def update_notes(topic_id: int, payload: NotesUpdate) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE topics SET notes = ? WHERE id = ?",
            (payload.notes, topic_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Konu bulunamadı")
        conn.commit()
        row = conn.execute(
            f"SELECT {TOPIC_COLUMNS} FROM topics WHERE id = ?",
            (topic_id,),
        ).fetchone()
    return row_to_dict(row)


@app.put("/api/topics/{topic_id}/time")
def update_time(topic_id: int, payload: TimeUpdate) -> dict:
    if payload.mode not in ("add", "set"):
        raise HTTPException(status_code=400, detail="mode 'add' veya 'set' olmalı")

    with get_connection() as conn:
        if payload.mode == "add":
            cursor = conn.execute(
                "UPDATE topics SET time_spent = time_spent + ? WHERE id = ?",
                (payload.seconds, topic_id),
            )
        else:
            cursor = conn.execute(
                "UPDATE topics SET time_spent = ? WHERE id = ?",
                (payload.seconds, topic_id),
            )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Konu bulunamadı")

        xp_gained = 0
        if payload.mode == "add" and payload.seconds > 0:
            minutes = payload.seconds // 60
            if minutes > 0:
                xp_gained = minutes * 10
                add_xp(conn, xp_gained)
                add_daily_minutes(conn, minutes)
            elif payload.seconds >= 30:
                add_daily_minutes(conn, 1)

        stats = stats_to_dict(get_user_stats(conn))
        conn.commit()
        row = conn.execute(
            f"SELECT {TOPIC_COLUMNS} FROM topics WHERE id = ?",
            (topic_id,),
        ).fetchone()

    result = row_to_dict(row)
    result["xp_gained"] = xp_gained
    result["stats"] = stats
    return result


@app.post("/api/run-code")
def run_code(payload: CodeRunRequest) -> dict:
    code = payload.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Kod boş olamaz")

    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            raise HTTPException(
                status_code=400,
                detail="Güvenlik: Bu kod güvenlik nedeniyle çalıştırılamaz.",
            )

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            result = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=5,
                cwd=tmpdir,
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
                "success": result.returncode == 0,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "⏱️ Zaman aşımı: Kod 5 saniyede tamamlanmadı.",
                "exit_code": -1,
                "success": False,
            }
        except Exception as exc:
            return {
                "stdout": "",
                "stderr": f"Hata: {exc}",
                "exit_code": -1,
                "success": False,
            }


frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
