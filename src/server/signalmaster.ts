import express, { Request, Response, Router } from 'express';
import rtcSignals from '../utils/rtc-signals.js';

const router: Router = express.Router();

// WebRTC signaling endpoints
router.post('/offer/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const offer = req.body;
  
  rtcSignals.offer[id] = offer;
  console.log(`Stored offer for ${id}`);
  
  res.json({ success: true });
});

router.get('/offer/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const offer = rtcSignals.offer[id];
  
  if (offer) {
    res.json(offer);
  } else {
    res.status(404).json({ error: 'Offer not found' });
  }
});

router.post('/answer/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const answer = req.body;
  
  rtcSignals.answer[id] = answer;
  console.log(`Stored answer for ${id}`);
  
  res.json({ success: true });
});

router.get('/answer/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const answer = rtcSignals.answer[id];
  
  if (answer) {
    res.json(answer);
    // Clean up after retrieving
    delete rtcSignals.answer[id];
    delete rtcSignals.offer[id];
  } else {
    res.status(404).json({ error: 'Answer not found' });
  }
});

export default router;

// Helper function to setup signalmaster routes on an Express app
export function setupSignalmaster(app: express.Application): void {
  app.use('/signalmaster', router);
}