import sys
import traceback
from sqlalchemy import text
from app.db.session import engine

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE templates ADD COLUMN IF NOT EXISTS header_type VARCHAR(50);"))
        conn.execute(text("ALTER TABLE templates ADD COLUMN IF NOT EXISTS buttons JSON;"))
        conn.commit()
    print("Columns added successfully.")
except Exception as e:
    print(f"Error adding columns: {e}")
    traceback.print_exc()
    sys.exit(1)
