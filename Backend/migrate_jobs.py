import os
import sqlite3

from sqlalchemy import create_engine, text


# -----------------------------------------
# OLD SQLITE DATABASE
# -----------------------------------------

sqlite_conn = sqlite3.connect("swipex.db")
sqlite_conn.row_factory = sqlite3.Row

cursor = sqlite_conn.cursor()

cursor.execute("SELECT * FROM jobs")

old_jobs = cursor.fetchall()

print(f"Found {len(old_jobs)} old jobs.")


# -----------------------------------------
# NEW NEON DATABASE
# -----------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL is not set")

neon_engine = create_engine(DATABASE_URL)


# -----------------------------------------
# COPY JOBS
# -----------------------------------------

with neon_engine.begin() as conn:

    for job in old_jobs:

        # Avoid inserting the same job twice
        existing = conn.execute(
            text("""
                SELECT id
                FROM jobs
                WHERE title = :title
                AND company = :company
                AND location = :location
                LIMIT 1
            """),
            {
                "title": job["title"],
                "company": job["company"],
                "location": job["location"]
            }
        ).first()

        if existing:
            print(
                "Skipping:",
                job["title"],
                "-",
                job["company"]
            )
            continue

        conn.execute(
            text("""
                INSERT INTO jobs
                (
                    company,
                    title,
                    location,
                    salary,
                    experience,
                    description
                )
                VALUES
                (
                    :company,
                    :title,
                    :location,
                    :salary,
                    :experience,
                    :description
                )
            """),
            {
                "company": job["company"],
                "title": job["title"],
                "location": job["location"],
                "salary": job["salary"],
                "experience": job["experience"],
                "description": job["description"]
            }
        )

        print(
            "Added:",
            job["title"],
            "-",
            job["company"]
        )


sqlite_conn.close()

print("Migration completed!")