import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import { ParamsDictionary } from 'express-serve-static-core';
import { RegisterRequest } from '~/models/schemas/requests/User.request';

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'nguyentminhkhoa1' && password === '123456') {
    res.status(200).json({ message: 'Login success' });
    return;
  }

  res.status(400).json({ error: 'Login failed' });
  return;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await usersService.register(req.body);
  res.json({ message: 'Register success', data: result });
  return;
};
