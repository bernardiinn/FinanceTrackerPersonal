import { Request, Response } from 'express';
import { runQuery, allQuery, getQuery } from '../database';
import type { Transaction } from '../models/types';

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, category, dateFrom, dateTo } = req.query;
    
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];
    
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (dateFrom) {
      sql += ' AND date >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      sql += ' AND date <= ?';
      params.push(dateTo);
    }
    
    sql += ' ORDER BY date DESC, created_at DESC';
    
    const transactions = await allQuery(sql, params);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, category, description, date, type, account_id }: Partial<Transaction> = req.body;
    
    if (!amount || !category || !description || !date || !type) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    await runQuery(
      'INSERT INTO transactions (id, amount, category, description, date, type, account_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, amount, category, description, date, type, account_id || null]
    );
    
    const newTransaction = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, category, description, date, type, account_id }: Partial<Transaction> = req.body;
    
    const existingTransaction = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existingTransaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    
    await runQuery(
      'UPDATE transactions SET amount = ?, category = ?, description = ?, date = ?, type = ?, account_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [amount, category, description, date, type, account_id || null, id]
    );
    
    const updatedTransaction = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingTransaction = await getQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existingTransaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    
    await runQuery('DELETE FROM transactions WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};
