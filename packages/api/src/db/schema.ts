export const schemaSql = [
  `CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS set_catalog (
    set_num TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER,
    theme_name TEXT,
    theme_id INTEGER,
    num_parts INTEGER,
    set_img_url TEXT,
    last_modified_dt TEXT,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_num TEXT NOT NULL,
    owner_id INTEGER,
    location_id INTEGER,
    condition TEXT NOT NULL CHECK (condition IN ('new_sealed', 'opened_complete', 'opened_incomplete')),
    quantity INTEGER NOT NULL DEFAULT 1,
    purchase_price REAL,
    date_acquired TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (set_num) REFERENCES set_catalog(set_num),
    FOREIGN KEY (owner_id) REFERENCES family_members(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );`,
  "CREATE INDEX IF NOT EXISTS idx_inventory_set_num ON inventory(set_num);",
  "CREATE INDEX IF NOT EXISTS idx_inventory_owner_id ON inventory(owner_id);",
  "CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);",
  "CREATE INDEX IF NOT EXISTS idx_inventory_condition ON inventory(condition);",
  `CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_num TEXT NOT NULL,
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    avg_price REAL,
    min_price REAL,
    max_price REAL,
    currency TEXT NOT NULL DEFAULT 'USD',
    total_quantity INTEGER,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(set_num, date, source),
    FOREIGN KEY (set_num) REFERENCES set_catalog(set_num)
  );`,
  "CREATE INDEX IF NOT EXISTS idx_price_history_set_date ON price_history(set_num, date);",
  `CREATE TABLE IF NOT EXISTS barcode_map (
    barcode TEXT PRIMARY KEY,
    set_num TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'upcitemdb',
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (set_num) REFERENCES set_catalog(set_num)
  );`,
  `CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`
];
