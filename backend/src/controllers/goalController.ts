import { Request, Response } from 'express';
import { runQuery, allQuery, getQuery } from '../database';
import type { Goal } from '../models/types';

export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const goals = await allQuery(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, target_amount, current_amount = 0, deadline, category }: Partial<Goal> = req.body;
    
    if (!name || !target_amount || !category) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    await runQuery(
      'INSERT INTO goals (id, user_id, name, target_amount, current_amount, deadline, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, name, target_amount, current_amount, deadline || null, category]
    );
    
    const newGoal = await getQuery(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, target_amount, current_amount, deadline, category }: Partial<Goal> = req.body;
    
    const existingGoal = await getQuery('SELECT * FROM goals WHERE id = ?', [id]);
    if (!existingGoal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    
    await runQuery(
      'UPDATE goals SET name = ?, target_amount = ?, current_amount = ?, deadline = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, target_amount, current_amount, deadline || null, category, id]
    );
    
    const updatedGoal = await getQuery('SELECT * FROM goals WHERE id = ?', [id]);
    res.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingGoal = await getQuery('SELECT * FROM goals WHERE id = ?', [id]);
    if (!existingGoal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    
    await runQuery('DELETE FROM goals WHERE id = ?', [id]);
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};
