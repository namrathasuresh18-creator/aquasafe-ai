import sqlite3
import os
import hashlib

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aquasafe.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('citizen', 'authority', 'admin')),
        phone TEXT,
        email TEXT,
        otp_verified INTEGER DEFAULT 0
    )
    """)
    
    # 2. Create Complaints Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        citizen_id INTEGER,
        citizen_name TEXT,
        image_path TEXT,
        description TEXT NOT NULL,
        location_name TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved')),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ai_pollution_score REAL,
        ai_cleanliness_score REAL,
        ai_risk_level TEXT,
        ai_analysis_report TEXT,
        FOREIGN KEY(citizen_id) REFERENCES users(id)
    )
    """)
    
    # 3. Create Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'emergency')),
        message TEXT NOT NULL,
        region TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 4. Create Water Quality Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS water_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        citizen_id INTEGER,
        citizen_name TEXT,
        ph REAL,
        temperature REAL,
        turbidity REAL,
        tds REAL,
        dissolved_oxygen REAL,
        conductivity REAL,
        salinity REAL,
        wqi REAL,
        contamination_severity TEXT,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ai_analysis_report TEXT,
        FOREIGN KEY(citizen_id) REFERENCES users(id)
    )
    """)
    
    conn.commit()
    
    # Seed users if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("[Database] Seeding initial users...")
        users_seed = [
            ("citizen1", hash_password("password123"), "John Doe (Citizen)", "citizen", "+1234567890", "john@aquasafe.org", 1),
            ("authority1", hash_password("password123"), "Officer Jane Smith", "authority", "+1987654321", "jane@epa.gov", 1),
            ("admin1", hash_password("password123"), "Chief Admin Officer", "admin", "+1555555555", "admin@aquasafe.gov", 1)
        ]
        cursor.executemany("""
        INSERT INTO users (username, password_hash, name, role, phone, email, otp_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, users_seed)
        conn.commit()
        
    # Seed complaints if empty
    cursor.execute("SELECT COUNT(*) FROM complaints")
    if cursor.fetchone()[0] == 0:
        print("[Database] Seeding initial complaints...")
        complaints_seed = [
            (
                1, "John Doe (Citizen)", "/uploads/sewage_river.jpg",
                "Dark blackish water smelling of rotten eggs dumping into the canal behind the industrial zone. Visible oily sheen and dead fish floating.",
                "North Industrial Canal (Sector 4)", 37.7749, -122.4194, "pending",
                88.5, 11.5, "emergency",
                "CRITICAL WARNING: Dark anaerobic effluent detected. Visually black coloration indicaive of high organic loading and hydrogen sulfide. Visible chemical/oil sheens are highly toxic. Prompt immediate source closure to prevent full-scale ecosystem collapse."
            ),
            (
                1, "John Doe (Citizen)", "/uploads/plastic_creek.jpg",
                "Massive accumulation of plastic bottles, food containers, and styrofoam floating in the river bend. The water is stagnant and filled with green algae.",
                "East Creek Riverbend", 37.7891, -122.4014, "investigating",
                74.0, 26.0, "high",
                "HIGH HAZARD: Dense plastic debris agglomeration blocks surface oxygenation. Advanced eutrophication and algal mats detected from high nitrogen/phosphorus run-off. Action: Mechanical cleanup and installation of surface trash booms."
            ),
            (
                None, "System Monitor", None,
                "Routine inspection report: Slight cloudy discoloration observed near residential run-off pipeline. No oil sheen, but noticeable foam.",
                "South Residential Outflow", 37.7624, -122.4352, "resolved",
                42.0, 58.0, "medium",
                "MODERATE HAZARD: Surfactants and household detergents detected causing surface foaming. Water turbidity is elevated slightly above baseline. Natural dispersion underway, monitoring continues."
            )
        ]
        
        # Ensure upload folder exists
        os.makedirs(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "uploads"), exist_ok=True)
        
        cursor.executemany("""
        INSERT INTO complaints (citizen_id, citizen_name, image_path, description, location_name, latitude, longitude, status, ai_pollution_score, ai_cleanliness_score, ai_risk_level, ai_analysis_report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, complaints_seed)
        conn.commit()

    # Seed alerts if empty
    cursor.execute("SELECT COUNT(*) FROM alerts")
    if cursor.fetchone()[0] == 0:
        print("[Database] Seeding initial alerts...")
        alerts_seed = [
            ("emergency", "Critical sewage discharge reported with 88% pollution rating. Immediate dispatch recommended.", "North Industrial Canal (Sector 4)", 1),
            ("high", "Severe plastic accumulation and eutrophication reported. Surface blockage active.", "East Creek Riverbend", 1),
            ("medium", "Elevated pH level of 3.4 (highly acidic) detected via smart water probe.", "West Reservoir Intake", 0)
        ]
        cursor.executemany("""
        INSERT INTO alerts (severity, message, region, active)
        VALUES (?, ?, ?, ?)
        """, alerts_seed)
        conn.commit()

    # Seed water reports if empty
    cursor.execute("SELECT COUNT(*) FROM water_reports")
    if cursor.fetchone()[0] == 0:
        print("[Database] Seeding initial water quality reports...")
        water_reports_seed = [
            (
                1, "John Doe (Citizen)", 3.4, 24.5, 95.0, 750.0, 2.1, 1200.0, 5.2, 28.5, "emergency", "pending",
                "CRITICAL DANGER: Water is highly acidic (pH 3.4) and critically oxygen depleted (DO 2.1 mg/L). WQI is extremely poor (28.5). Safe parameter limits severely breached. Contamination indicates potential chemical or acid mine drainage."
            ),
            (
                2, "Officer Jane Smith", 6.8, 19.2, 8.5, 180.0, 7.8, 220.0, 0.4, 85.0, "safe", "resolved",
                "EXCELLENT STATUS: pH is neutral (6.8). Turbidity is within excellent levels. Dissolved oxygen is high (7.8 mg/L), ensuring healthy aquatic life. WQI is 85.0 (Safe). Safe for contact recreation."
            ),
            (
                1, "John Doe (Citizen)", 7.9, 28.1, 45.0, 480.0, 4.8, 650.0, 1.2, 52.0, "medium", "investigating",
                "MODERATE ALERT: High temperature (28.1°C) combined with elevated turbidity (45.0 NTU) has depressed dissolved oxygen to 4.8 mg/L. WQI is 52.0 (Moderate). Water is marginally unsafe; risk of algal bloom under high sunlight."
            )
        ]
        cursor.executemany("""
        INSERT INTO water_reports (citizen_id, citizen_name, ph, temperature, turbidity, tds, dissolved_oxygen, conductivity, salinity, wqi, contamination_severity, status, ai_analysis_report)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, water_reports_seed)
        conn.commit()
        
    conn.close()

if __name__ == "__main__":
    init_db()
    print("[Database] Initialization complete.")
