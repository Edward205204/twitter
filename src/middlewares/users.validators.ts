import { NextFunction, Request, Response } from 'express';

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email or password is required' });
    return;
  }
  next();
};

export const registerValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email or password is required' });
    return;
  }
  next();
};
