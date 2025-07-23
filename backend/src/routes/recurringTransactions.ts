import { Router } from 'express';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction
} from '../controllers/recurringTransactionController';
import { requireAuth } from '../controllers/authController';

const router = Router();

// All recurring transaction routes require authentication
router.use(requireAuth);

router.get('/', getRecurringTransactions);
router.post('/', createRecurringTransaction);
router.put('/:id', updateRecurringTransaction);
router.delete('/:id', deleteRecurringTransaction);

export default router;
