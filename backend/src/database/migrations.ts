import { db } from './index';

// Migration to add PIN and trusted device functionality
export const migratePinAndDeviceSupport = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Add PIN columns to users table if they don't exist
      db.run(`ALTER TABLE users ADD COLUMN pin_hash TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding pin_hash column:', err.message);
        }
      });

      db.run(`ALTER TABLE users ADD COLUMN pin_enabled BOOLEAN DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding pin_enabled column:', err.message);
        }
      });

      // Create trusted devices table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS trusted_devices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          device_fingerprint TEXT NOT NULL,
          device_name TEXT,
          last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(user_id, device_fingerprint)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating trusted_devices table:', err.message);
          reject(err);
        } else {
          console.log('PIN and device support migration completed successfully');
          resolve();
        }
      });
    });
  });
};

// Run migration if this file is executed directly
if (require.main === module) {
  migratePinAndDeviceSupport()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
