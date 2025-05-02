import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import { NextFunction, ParamsDictionary } from 'express-serve-static-core';
import { RegisterRequest } from '~/models/schemas/requests/User.request';
import { USER_MESSAGE } from '~/constants/user_message';

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.body;
  const result = await usersService.login(user_id);
  if (!result) {
    return next({ message: USER_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED });
  }
  res.json({ message: USER_MESSAGE.LOGIN_SUCCESS, data: result });
  return;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await usersService.register(req.body);
  res.json({ message: USER_MESSAGE.REGISTER_SUCCESS, data: result });
  return;
};
