import json
import sqlite3
from datetime import date, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "roadmap.db"

DEFAULT_TOPICS: list[tuple[str, str]] = [
    ("Bölüm 1: Temel Python Objeleri ve Veri Yapıları", "2 Saat 12 Dk"),
    ("Bölüm 2: Koşullu Durumlar", "55 Dk"),
    ("Bölüm 3: Pythonda Döngü Yapıları", "1 Saat 33 Dk"),
    ("Bölüm 4: Fonksiyonlar", "1 Saat 11 Dk"),
    ("Bölüm 5: Modüller", "32 Dk"),
    ("Bölüm 6: Nesne Tabanlı Programlama", "1 Saat 24 Dk"),
    ("Bölüm 7: Hatalar ve İstisnalar", "20 Dk"),
    ("Bölüm 8: Dosya İşlemleri", "55 Dk"),
    ("Bölüm 9: Pythondaki Gömülü Fonksiyonlar", "38 Dk"),
    ("Bölüm 10: İleri Seviye Veri Yapıları ve Objeler", "58 Dk"),
    ("Bölüm 11: Sqlite Veritabanı", "1 Saat 14 Dk"),
    ("Bölüm 12: Fonksiyonların İleri Seviye Özellikleri ve Decoratorlar", "37 Dk"),
    ("Bölüm 13: Pythondaki Iteratorlar ve Generatorlar", "33 Dk"),
    ("Bölüm 14: Pythondaki İleri Seviye Modüller", "45 Dk"),
    ("Bölüm 15: PyQt5 - Arayüz Geliştirme", "2 Saat"),
    ("Bölüm 16: Python Kursu 2. Seviye Başlıyor!", "5 Dk"),
    ("Bölüm 17: Flask Framework ile Web Geliştirme Temelleri", "1 Saat 30 Dk"),
    ("Bölüm 18: Flask, ORM ve SqlAlchemy ile Todo App", "1 Saat 15 Dk"),
    ("Bölüm 19: Django Framework ile Web Geliştirme Temelleri", "2 Saat"),
    ("Bölüm 20: Flask Websitesinin Yayına Alınması", "45 Dk"),
    ("Bölüm 21: Django Websitesinin Yayına Alınması", "45 Dk"),
    ("Bölüm 22: Selenium ve Ekşi Sözlük", "34 Dk"),
    ("Bölüm 23: Selenium ve Twitter", "34 Dk"),
    ("Bölüm 24: Selenium ve Instagram", "34 Dk"),
    ("Bölüm 25: Flask ve Fixer.io ile Döviz Çevirici", "38 Dk"),
    ("Bölüm 26: Github Rest Api ile Github Finder", "36 Dk"),
    ("Bölüm 27: Scrapy Framework ve kitapyurdu.com Projesi", "1 Saat 36 Dk"),
    ("Bölüm 28: Veri Analizi - Numpy", "38 Dk"),
    ("Bölüm 29: Veri Analizi - Pandas", "2 Saat 13 Dk"),
    ("Bölüm 30: U.S Soccer Leauge Salaries Analizi", "18 Dk"),
    ("Bölüm 31: Youtube Video İstatistikleri Analizi", "29 Dk"),
    ("Bölüm 32: Veri Görselleştirme - Matplotlib", "1 Saat"),
]

UDEMY_COURSE_URL = "https://www.udemy.com/course/sifirdan-ileri-seviyeye-python/"

# Bölüm başına tek resmi dokümantasyon linki (Udemy ile birlikte gösterilir)
TOPIC_DOC_URLS: list[str] = [
    "https://docs.python.org/tr/3/tutorial/datastructures.html",
    "https://docs.python.org/tr/3/tutorial/controlflow.html",
    "https://docs.python.org/tr/3/tutorial/controlflow.html#for-statements",
    "https://docs.python.org/tr/3/tutorial/controlflow.html#defining-functions",
    "https://docs.python.org/tr/3/tutorial/modules.html",
    "https://docs.python.org/tr/3/tutorial/classes.html",
    "https://docs.python.org/tr/3/tutorial/errors.html",
    "https://docs.python.org/tr/3/tutorial/inputoutput.html",
    "https://docs.python.org/tr/3/library/functions.html",
    "https://docs.python.org/tr/3/library/collections.html",
    "https://docs.python.org/tr/3/library/sqlite3.html",
    "https://docs.python.org/tr/3/glossary.html#term-decorator",
    "https://docs.python.org/tr/3/tutorial/classes.html#generators",
    "https://docs.python.org/tr/3/py-modindex.html",
    "https://www.riverbankcomputing.com/static/Docs/PyQt5/",
    "https://docs.python.org/tr/3/",
    "https://flask.palletsprojects.com/",
    "https://www.sqlalchemy.org/",
    "https://docs.djangoproject.com/tr/5.0/",
    "https://flask.palletsprojects.com/en/latest/deploying/",
    "https://docs.djangoproject.com/en/stable/howto/deployment/",
    "https://selenium-python.readthedocs.io/",
    "https://selenium-python.readthedocs.io/getting-started.html",
    "https://developers.facebook.com/docs/instagram-api/",
    "https://flask.palletsprojects.com/en/latest/quickstart/",
    "https://docs.github.com/en/rest",
    "https://docs.scrapy.org/",
    "https://numpy.org/doc/stable/user/quickstart.html",
    "https://pandas.pydata.org/docs/getting_started/index.html",
    "https://www.kaggle.com/learn/pandas",
    "https://developers.google.com/youtube/v3",
    "https://matplotlib.org/stable/gallery/index.html",
]


def udemy_topic_resource(index: int) -> dict:
    title = DEFAULT_TOPICS[index][0]
    section = title.split(": ", 1)[1] if ": " in title else title
    return {
        "title": f"▶ Udemy — {section}",
        "url": f"{UDEMY_COURSE_URL}learn/",
    }


def docs_topic_resource(index: int) -> dict:
    title = DEFAULT_TOPICS[index][0]
    section = title.split(": ", 1)[1] if ": " in title else title
    url = TOPIC_DOC_URLS[index] if index < len(TOPIC_DOC_URLS) else "https://docs.python.org/tr/3/"
    return {
        "title": f"🐍 Dokümantasyon — {section}",
        "url": url,
    }


def resources_for_index(index: int) -> str:
    return json.dumps(
        [udemy_topic_resource(index), docs_topic_resource(index)],
        ensure_ascii=False,
    )


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return {row[1] for row in rows}


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    if column not in _table_columns(conn, table):
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"[BİLGİ] {table}.{column} sütunu eklendi.")


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL UNIQUE,
                is_completed INTEGER NOT NULL DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                duration TEXT NOT NULL DEFAULT '',
                time_spent INTEGER NOT NULL DEFAULT 0,
                resources TEXT NOT NULL DEFAULT '[]'
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_stats (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                streak_count INTEGER NOT NULL DEFAULT 0,
                last_active_date TEXT NOT NULL DEFAULT '',
                total_xp INTEGER NOT NULL DEFAULT 0,
                user_level INTEGER NOT NULL DEFAULT 1
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS daily_activity (
                activity_date TEXT PRIMARY KEY,
                minutes INTEGER NOT NULL DEFAULT 0
            )
            """
        )

        _ensure_column(conn, "topics", "time_spent", "INTEGER NOT NULL DEFAULT 0")
        _ensure_column(conn, "topics", "resources", "TEXT NOT NULL DEFAULT '[]'")

        existing = conn.execute("SELECT title, duration FROM topics ORDER BY id").fetchall()
        current = [(row[0], row[1]) for row in existing]

        if current != DEFAULT_TOPICS:
            conn.execute("DELETE FROM topics")
            for i, (title, duration) in enumerate(DEFAULT_TOPICS):
                conn.execute(
                    "INSERT INTO topics (title, is_completed, notes, duration, time_spent, resources) VALUES (?, 0, '', ?, 0, ?)",
                    (title, duration, resources_for_index(i)),
                )
        else:
            rows = conn.execute("SELECT id, resources FROM topics ORDER BY id").fetchall()
            for i, row in enumerate(rows):
                conn.execute(
                    "UPDATE topics SET resources = ? WHERE id = ?",
                    (resources_for_index(i), row[0]),
                )

        stats = conn.execute("SELECT id FROM user_stats WHERE id = 1").fetchone()
        if not stats:
            conn.execute(
                "INSERT INTO user_stats (id, streak_count, last_active_date, total_xp, user_level) VALUES (1, 0, '', 0, 1)"
            )

        conn.commit()


def row_to_dict(row: sqlite3.Row) -> dict:
    resources = row["resources"]
    try:
        resources_list = json.loads(resources) if resources else []
    except json.JSONDecodeError:
        resources_list = []
    return {
        "id": row["id"],
        "title": row["title"],
        "is_completed": bool(row["is_completed"]),
        "notes": row["notes"],
        "duration": row["duration"],
        "time_spent": row["time_spent"],
        "resources": resources_list,
    }


def stats_to_dict(row: sqlite3.Row) -> dict:
    xp = row["total_xp"]
    return {
        "streak_count": row["streak_count"],
        "last_active_date": row["last_active_date"],
        "total_xp": xp,
        "user_level": row["user_level"],
        "rank_title": get_rank_title(xp),
        "xp_to_next_level": 500 - (xp % 500) if xp % 500 != 0 else 500,
        "level_progress_pct": (xp % 500) / 5,
    }


def get_rank_title(xp: int) -> str:
    if xp >= 1500:
        return "Usta Yazılımcı 👑"
    if xp >= 500:
        return "Gelişen Yazılımcı 📘"
    return "Yeni Başlayan 🐍"


def get_user_stats(conn: sqlite3.Connection) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM user_stats WHERE id = 1").fetchone()
    if not row:
        conn.execute(
            "INSERT INTO user_stats (id, streak_count, last_active_date, total_xp, user_level) VALUES (1, 0, '', 0, 1)"
        )
        row = conn.execute("SELECT * FROM user_stats WHERE id = 1").fetchone()
    return row


def update_streak(conn: sqlite3.Connection) -> None:
    today = date.today().isoformat()
    stats = get_user_stats(conn)
    last = stats["last_active_date"]
    streak = stats["streak_count"]

    if last == today:
        return
    if last == (date.today() - timedelta(days=1)).isoformat():
        streak += 1
    elif last != today:
        streak = 1

    conn.execute(
        "UPDATE user_stats SET streak_count = ?, last_active_date = ? WHERE id = 1",
        (streak, today),
    )


def add_xp(conn: sqlite3.Connection, amount: int) -> dict:
    if amount <= 0:
        return stats_to_dict(get_user_stats(conn))
    update_streak(conn)
    stats = get_user_stats(conn)
    new_xp = stats["total_xp"] + amount
    new_level = new_xp // 500 + 1
    conn.execute(
        "UPDATE user_stats SET total_xp = ?, user_level = ? WHERE id = 1",
        (new_xp, new_level),
    )
    return stats_to_dict(get_user_stats(conn))


def add_daily_minutes(conn: sqlite3.Connection, minutes: int) -> None:
    if minutes <= 0:
        return
    today = date.today().isoformat()
    conn.execute(
        """
        INSERT INTO daily_activity (activity_date, minutes) VALUES (?, ?)
        ON CONFLICT(activity_date) DO UPDATE SET minutes = minutes + excluded.minutes
        """,
        (today, minutes),
    )


def get_activity_map(conn: sqlite3.Connection, days: int = 30) -> list[dict]:
    result = []
    today = date.today()
    rows = conn.execute(
        "SELECT activity_date, minutes FROM daily_activity ORDER BY activity_date DESC LIMIT ?",
        (days,),
    ).fetchall()
    activity = {row[0]: row[1] for row in rows}

    for i in range(days - 1, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        minutes = activity.get(d, 0)
        result.append({"date": d, "minutes": minutes})
    return result
