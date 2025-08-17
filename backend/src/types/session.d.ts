import 'express-session';
import { User } from '../models/types';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    user?: Omit<User, 'password'>;
    csrfToken?: string;
  }
}

export {};
