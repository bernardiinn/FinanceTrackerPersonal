import { Request, Response } from 'express';
import { runQuery, getQuery, allQuery } from '../database';
import type { Loan } from '../models/types';

export const getLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const loans = await allQuery(
      'SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

export const createLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, total_amount, remaining_amount, interest_rate, monthly_payment, next_payment_date, type }: Partial<Loan> = req.body;
    
    if (!name || !total_amount || !remaining_amount || !monthly_payment || !next_payment_date || !type) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }
    
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    await runQuery(
      'INSERT INTO loans (id, user_id, name, total_amount, remaining_amount, interest_rate, monthly_payment, next_payment_date, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, name, total_amount, remaining_amount, interest_rate || 0, monthly_payment, next_payment_date, type]
    );
    
    const newLoan = await getQuery(
      'SELECT * FROM loans WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    res.status(201).json(newLoan);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan' });
  }
};

export const updateLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, total_amount, remaining_amount, interest_rate, monthly_payment, next_payment_date, type }: Partial<Loan> = req.body;
    
    const existingLoan = await getQuery('SELECT * FROM loans WHERE id = ?', [id]);
    if (!existingLoan) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }
    
    await runQuery(
      'UPDATE loans SET name = ?, total_amount = ?, remaining_amount = ?, interest_rate = ?, monthly_payment = ?, next_payment_date = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, total_amount, remaining_amount, interest_rate, monthly_payment, next_payment_date, type, id]
    );
    
    const updatedLoan = await getQuery('SELECT * FROM loans WHERE id = ?', [id]);
    res.json(updatedLoan);
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ error: 'Failed to update loan' });
  }
};

export const deleteLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingLoan = await getQuery('SELECT * FROM loans WHERE id = ?', [id]);
    if (!existingLoan) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }
    
    await runQuery('DELETE FROM loans WHERE id = ?', [id]);
    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ error: 'Failed to delete loan' });
  }
};
