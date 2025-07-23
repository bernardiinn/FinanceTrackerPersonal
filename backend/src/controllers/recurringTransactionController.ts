import { Request, Response } from 'express';
import { runQuery, getQuery, allQuery } from '../database';
import type { RecurringTransaction } from '../models/types';

export const getRecurringTransactions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await allQuery('SELECT * FROM recurring_transactions ORDER BY created_at DESC');
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
};

export const createRecurringTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, category, description, frequency, next_date, type, is_active = true }: Partial<RecurringTransaction> = req.body;
    
    if (!amount || !category || !description || !frequency || !next_date || !type) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }
    
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    await runQuery(
      'INSERT INTO recurring_transactions (id, amount, category, description, frequency, next_date, type, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, amount, category, description, frequency, next_date, type, is_active]
    );
    
    const newTransaction = await getQuery('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
};

export const updateRecurringTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, category, description, frequency, next_date, type, is_active }: Partial<RecurringTransaction> = req.body;
    
    const existingTransaction = await getQuery('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
    if (!existingTransaction) {
      res.status(404).json({ error: 'Recurring transaction not found' });
      return;
    }
    
    await runQuery(
      'UPDATE recurring_transactions SET amount = ?, category = ?, description = ?, frequency = ?, next_date = ?, type = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [amount, category, description, frequency, next_date, type, is_active, id]
    );
    
    const updatedTransaction = await getQuery('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
};

export const deleteRecurringTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingTransaction = await getQuery('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
    if (!existingTransaction) {
      res.status(404).json({ error: 'Recurring transaction not found' });
      return;
    }
    
    await runQuery('DELETE FROM recurring_transactions WHERE id = ?', [id]);
    res.json({ message: 'Recurring transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
};
