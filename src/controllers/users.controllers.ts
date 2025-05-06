import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import { NextFunction, ParamsDictionary } from 'express-serve-static-core';
import { LogoutReqBody, RegisterRequest } from '~/models/schemas/requests/User.request';
import { USER_MESSAGE } from '~/constants/user.message';
import User from '~/models/schemas/User.schema';
import { ObjectId } from 'mongodb';

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await usersService.login(user_id);
  if (!result) {
    return next({ message: USER_MESSAGE.VALIDATION.CONFIRM_PASSWORD_IS_REQUIRED });
  }
  res.json({ message: USER_MESSAGE.AUTH.LOGIN_SUCCESS, data: result });
  return;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await usersService.register(req.body);
  res.json({ message: USER_MESSAGE.AUTH.REGISTER_SUCCESS, data: result });
  return;
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);
  res.json(result);
  return;
};
