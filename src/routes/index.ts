import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

/* GET home page. */
router.get('/', function(req: Request, res: Response) {
  res.redirect('/control.html');
});

export default router;