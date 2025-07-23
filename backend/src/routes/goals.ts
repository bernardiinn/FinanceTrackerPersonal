import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
} from '../controllers/goalController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All goal routes require authentication
router.use(requireAuth);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
