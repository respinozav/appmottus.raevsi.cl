import os
import psycopg2

DB_HOST = "ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "dbmasteruser"
DB_PASS = "aDxD*,r.lNk`5lY8eN+^ABk3T+*97W`N"

print("Connecting to RDS PostgreSQL with master credentials...")
try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        connect_timeout=10
    )
    conn.autocommit = True
    cursor = conn.cursor()
    print("Connected successfully!")
    
    with open("init_db.sql", "r", encoding="utf-8") as f:
        sql_script = f.read()
    
    print("Executing SQL initialization script...")
    cursor.execute(sql_script)
    print("SQL execution complete!")
    
    # Check tables in bdmottus
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'bdmottus';
    """)
    tables = cursor.fetchall()
    print(f"Tables in bdmottus: {[t[0] for t in tables]}")
    
    cursor.close()
    conn.close()
    
    # Test connection as usr_mottus
    print("Testing connection with dedicated application user 'usr_mottus'...")
    app_conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user="usr_mottus",
        password="M0ttus#Gym_2026_SecPass!",
        connect_timeout=10
    )
    app_cursor = app_conn.cursor()
    app_cursor.execute("SELECT count(*) FROM bdmottus.categories;")
    count = app_cursor.fetchone()[0]
    print(f"Connection as usr_mottus successful! Default categories count: {count}")
    app_cursor.close()
    app_conn.close()
    print("ALL DATABASE SETUP STEPS COMPLETED SUCCESSFULLY!")

except Exception as e:
    print(f"Error during DB initialization: {e}")
    exit(1)
