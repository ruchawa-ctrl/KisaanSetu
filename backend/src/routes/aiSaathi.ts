import { Router } from 'express';
import { z } from 'zod';
import { askAiSaathi } from '../services/aiSaathiService';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const request = z.object({
      message: z.string().trim().min(1).max(2000),
      language: z.enum(['en', 'hi', 'mr', 'te', 'as', 'mai', 'hne', 'kok', 'gu', 'bg', 'sat', 'kn', 'ml', 'mni', 'kha', 'lus', 'ao', 'or', 'pa', 'raj', 'ne', 'ta', 'ur', 'bn', 'gar', 'bho', 'ks', 'sd', 'tcy']).default('en'),
      farmerContext: z.object({ crop: z.string().optional(), quantityKg: z.number().positive().optional(), location: z.string().optional() }).optional(),
    }).parse(req.body);
    res.json(await askAiSaathi(request));
  } catch (error) {
    next(error);
  }
});

export default router;