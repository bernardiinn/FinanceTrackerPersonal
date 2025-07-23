import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, getQuery } from '../database';
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
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await getQuery(
      'SELECT id, email, password, first_name, last_name FROM users WHERE email = ?',
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
    const { password: _, ...userWithoutPassword } = user;

    // Set session
    req.session.userId = user.id;
    req.session.user = userWithoutPassword;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword
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
