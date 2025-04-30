import { Request, Response } from 'express';
import usersService from '~/services/users.services';

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'nguyentminhkhoa1' && password === '123456') {
    res.status(200).json({ message: 'Login success' });
    return;
  }

  res.status(400).json({ error: 'Login failed' });
  return;
};

export const registerController = async (req: Request, res: Response) => {
  const { email, password, name, date_of_birth } = req.body;
  try {
    // const result = databaseService.users.insertOne(new User({ email, password }));
    const result = usersService.register({ email, password, name, date_of_birth });
    res.json({ message: 'Register success', result });
    return;
  } catch (error) {
    res.status(400).json({ message: 'Register failed' });
    return;
  }
};
