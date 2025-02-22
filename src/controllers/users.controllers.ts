import { Request, Response } from 'express';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/databases.services';

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'nguyentminhkhoa1' && password === '123456') {
    return res.status(200).json({ message: 'Login success' });
  }

  return res.status(400).json({ error: 'Login failed' });
};

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = databaseService.users.insertOne(new User({ email, password }));
    return res.json({ message: 'Register success' });
  } catch (error) {
    return res.status(400).json({ message: 'Register failed' });
  }
};
