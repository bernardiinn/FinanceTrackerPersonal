import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, getQuery, allQuery } from '../database';
import crypto from 'crypto';
import { User } from '../models/types';

// Extend Express Session to include user
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    user?: Omit<User, 'password'>;
  }
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName }: { 
      email: string; 
      password: string; 
      firstName?: string; 
      lastName?: string; 
    } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Check if user already exists
    const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await runQuery(
      'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, firstName || null, lastName || null]
    );

    // Get the created user (without password)
    const newUser = await getQuery(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
      [result.id]
    );

    // Set session
    req.session.userId = newUser.id;
    req.session.user = newUser;

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe }: { 
      email: string; 
      password: string; 
      rememberMe?: boolean; 
    } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await getQuery(
      'SELECT id, email, password, first_name, last_name, pin_hash, pin_enabled FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Remove password from user object
    const { password: _, pin_hash, ...userWithoutPassword } = user;

    // Regenerate session to prevent fixation
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    // Set session with extended duration if rememberMe is true
    if (rememberMe) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    }

    // Set session
    req.session.userId = user.id;
    req.session.user = { ...userWithoutPassword, pinEnabled: !!user.pin_enabled };

    // Audit
    try {
      await runQuery(
        'INSERT INTO auth_audit (user_id, event_type, success, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'password_login', 1, (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '', req.headers['user-agent'] || '']
      );
    } catch {}

    res.json({
      message: 'Login successful',
      user: { ...userWithoutPassword, pinEnabled: !!user.pin_enabled }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
  req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).json({ error: 'Failed to logout' });
        return;
      }

      res.clearCookie('connect.sid'); // Default session cookie name
      res.json({ message: 'Logout successful' });
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get fresh user data from database
    const user = await getQuery(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: Function): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
};

// Middleware to check if user is authenticated (optional - doesn't fail)
export const optionalAuth = (_req: Request, _res: Response, next: Function): void => {
  // Just continue - some routes might work with or without auth
  next();
};

// Set up PIN for quick access
export const setupPin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pin }: { pin: string } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      return;
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin, 12);

    // Update user with PIN
    await runQuery(
      'UPDATE users SET pin_hash = ?, pin_enabled = 1 WHERE id = ?',
      [pinHash, userId]
    );

    res.json({ message: 'PIN set up successfully' });
  } catch (error) {
    console.error('Error setting up PIN:', error);
    res.status(500).json({ error: 'Failed to set up PIN' });
  }
};

// Login with PIN
export const loginWithPin = async (req: Request, res: Response): Promise<void> => {
  try {
  const { pin, deviceFingerprint }: { pin: string; deviceFingerprint: string } = req.body;

    if (!pin || !deviceFingerprint) {
      res.status(400).json({ error: 'PIN and device fingerprint are required' });
      return;
    }

    // Hash the provided device fingerprint before any DB lookup
    const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');

    // Check if device is trusted
    const trustedDevice = await getQuery(
      'SELECT user_id FROM trusted_devices WHERE device_fingerprint = ? AND expires_at > datetime("now")',
      [deviceHash]
    );

    if (!trustedDevice) {
      res.status(401).json({ error: 'Device not trusted. Please log in with email and password.' });
      return;
    }

  // Get user with PIN
    const user = await getQuery(
      'SELECT id, email, first_name, last_name, pin_hash, pin_enabled FROM users WHERE id = ? AND pin_enabled = 1',
      [trustedDevice.user_id]
    );

    if (!user) {
      res.status(401).json({ error: 'PIN login not available' });
      return;
    }

    // Per-user/per-device PIN attempt tracking and lockout
    const attemptRow = await getQuery(
      'SELECT attempts, locked_until FROM pin_attempts WHERE user_id = ? AND device_fingerprint = ?',
      [user.id, deviceHash]
    );
    if (attemptRow?.locked_until && new Date(attemptRow.locked_until) > new Date()) {
      res.status(429).json({ error: 'Too many invalid attempts. Try again later.' });
      return;
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin_hash);
    if (!isValidPin) {
      const attempts = (attemptRow?.attempts || 0) + 1;
      let lockedUntil: string | null = null;
      // Lock after 5 attempts for 15 minutes
      if (attempts >= 5) {
        const d = new Date(Date.now() + 15 * 60 * 1000);
        lockedUntil = d.toISOString();
      }
      await runQuery(
        `INSERT INTO pin_attempts (user_id, device_fingerprint, attempts, last_attempt, locked_until)
         VALUES (?, ?, ?, datetime('now'), ?)
         ON CONFLICT(user_id, device_fingerprint) DO UPDATE SET attempts=excluded.attempts, last_attempt=excluded.last_attempt, locked_until=excluded.locked_until`,
        [user.id, deviceHash, attempts, lockedUntil]
      );
      // Audit
      try {
        await runQuery(
          'INSERT INTO auth_audit (user_id, event_type, success, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
          [user.id, 'pin_login', 0, (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '', req.headers['user-agent'] || '']
        );
      } catch {}
      res.status(401).json({ error: 'Invalid PIN' });
      return;
    }

    // Reset attempts on success
    await runQuery(
      `INSERT INTO pin_attempts (user_id, device_fingerprint, attempts, last_attempt, locked_until)
       VALUES (?, ?, 0, datetime('now'), NULL)
       ON CONFLICT(user_id, device_fingerprint) DO UPDATE SET attempts=0, last_attempt=datetime('now'), locked_until=NULL`,
      [user.id, deviceHash]
    );

    // Update device last used
    await runQuery(
      'UPDATE trusted_devices SET last_used = datetime("now") WHERE device_fingerprint = ?',
      [deviceHash]
    );

    // Regenerate session to prevent fixation
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    // Set session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      pinEnabled: true
    };

    // Audit
    try {
      await runQuery(
        'INSERT INTO auth_audit (user_id, event_type, success, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'pin_login', 1, (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '', req.headers['user-agent'] || '']
      );
    } catch {}

    res.json({
      message: 'PIN login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        pinEnabled: true
      }
    });
  } catch (error) {
    console.error('Error during PIN login:', error);
    res.status(500).json({ error: 'Failed to login with PIN' });
  }
};

// Trust current device
export const trustDevice = async (req: Request, res: Response): Promise<void> => {
  try {
  const { deviceFingerprint, deviceName }: { deviceFingerprint: string; deviceName?: string } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!deviceFingerprint) {
      res.status(400).json({ error: 'Device fingerprint is required' });
      return;
    }

    // Set device to expire in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Hash fingerprint before storing
    const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');

    // Add or update trusted device
    await runQuery(
      `INSERT OR REPLACE INTO trusted_devices 
       (user_id, device_fingerprint, device_name, last_used, created_at, expires_at) 
       VALUES (?, ?, ?, datetime("now"), datetime("now"), ?)`,
      [userId, deviceHash, deviceName || 'Unknown Device', expiresAt.toISOString()]
    );

    res.json({ message: 'Device trusted successfully' });
  } catch (error) {
    console.error('Error trusting device:', error);
    res.status(500).json({ error: 'Failed to trust device' });
  }
};

// Get trusted devices
export const getTrustedDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const devices = await allQuery(
      'SELECT id, device_name, last_used, created_at, expires_at FROM trusted_devices WHERE user_id = ? ORDER BY last_used DESC',
      [userId]
    );

    res.json({ devices });
  } catch (error) {
    console.error('Error fetching trusted devices:', error);
    res.status(500).json({ error: 'Failed to fetch trusted devices' });
  }
};

// Remove trusted device
export const removeTrustedDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId }: { deviceId: number } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await runQuery(
      'DELETE FROM trusted_devices WHERE id = ? AND user_id = ?',
      [deviceId, userId]
    );

    res.json({ message: 'Device removed successfully' });
  } catch (error) {
    console.error('Error removing trusted device:', error);
    res.status(500).json({ error: 'Failed to remove trusted device' });
  }
};

// Disable PIN
export const disablePin = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await runQuery(
      'UPDATE users SET pin_hash = NULL, pin_enabled = 0 WHERE id = ?',
      [userId]
    );

    res.json({ message: 'PIN disabled successfully' });
  } catch (error) {
    console.error('Error disabling PIN:', error);
    res.status(500).json({ error: 'Failed to disable PIN' });
  }
};
