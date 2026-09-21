import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { askAiSaathi } from '../services/aiSaathiService';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

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

router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio recording is required' });
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
      return res.status(503).json({ error: 'Voice transcription is not configured. Add OPENAI_API_KEY to backend/.env.' });
    }
    const form = new FormData();
    const audioBytes = new Uint8Array(req.file.buffer);
    form.append('file', new Blob([audioBytes.buffer as ArrayBuffer], { type: req.file.mimetype || 'audio/webm' }), req.file.originalname || 'voice.webm');
    form.append('model', process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    const data = await response.json() as { text?: string; error?: { message?: string } };
    if (!response.ok || !data.text?.trim()) return res.status(502).json({ error: data.error?.message || 'Voice transcription failed' });
    res.json({ text: data.text.trim() });
  } catch (error) {
    next(error);
  }
});

export default router;