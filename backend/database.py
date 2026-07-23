import sqlite3
import os
import hashlib
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'passwords.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS password_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            password_hash TEXT UNIQUE NOT NULL,
            strength TEXT NOT NULL,
            score INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def check_and_save_password(password: str, strength: str, score: int):
    p_hash = hash_password(password)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM password_history WHERE password_hash = ?', (p_hash,))
    existing = cursor.fetchone()
    
    previously_analyzed = False
    if existing:
        previously_analyzed = True
        # Update updated timestamp or score if changed
        cursor.execute('''
            UPDATE password_history 
            SET strength = ?, score = ?, created_at = CURRENT_TIMESTAMP 
            WHERE password_hash = ?
        ''', (strength, score, p_hash))
    else:
        cursor.execute('''
            INSERT INTO password_history (password_hash, strength, score)
            VALUES (?, ?, ?)
        ''', (p_hash, strength, score))
        
    conn.commit()
    conn.close()
    
    return previously_analyzed

def get_history(limit=50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, password_hash, strength, score, created_at
        FROM password_history
        ORDER BY created_at DESC
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        history.append({
            'id': r['id'],
            'password_hash': r['password_hash'][:12] + '...', # truncated hash for privacy UI
            'full_hash': r['password_hash'],
            'strength': r['strength'],
            'score': r['score'],
            'created_at': r['created_at']
        })
    return history

def clear_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM password_history')
    conn.commit()
    conn.close()
    return True
