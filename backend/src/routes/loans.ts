import { Router } from 'express';
import {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan
} from '../controllers/loanController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All loan routes require authentication
router.use(requireAuth);

router.get('/', getLoans);
router.post('/', createLoan);
router.put('/:id', updateLoan);
router.delete('/:id', deleteLoan);

export default router;
