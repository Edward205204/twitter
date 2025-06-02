import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import { NextFunction, ParamsDictionary } from 'express-serve-static-core';
import {
  LogoutReqBody,
  RegisterRequest,
  TokenPayload,
  ResetPasswordReqBody,
  UpdateAccountReqBody,
  FollowReqBody,
  GetProfileReqParams,
  UnfollowReqParams,
  ChangePasswordReqBody,
  RefreshTokenReqBody
} from '~/models/schemas/requests/User.request';
import { USER_MESSAGE } from '~/constants/user.message';
import User from '~/models/schemas/User.schema';
import { ObjectId } from 'mongodb';
import databaseService from '~/services/databases.services';
import { HTTP_STATUS } from '~/constants/http_request';
import { UserVerifyStatus } from '~/constants/enums';

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User;
  const verify = user.verify as UserVerifyStatus;
  const user_id = user._id as ObjectId;
  const result = await usersService.login({ user_id, verify });
  if (!result) {
    return next({ message: USER_MESSAGE.VALIDATION.CONFIRM_PASSWORD_IS_REQUIRED });
  }
  res.json({ message: USER_MESSAGE.AUTH.LOGIN_SUCCESS, data: result });
  return;
};

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query;
  const result = await usersService.oauth(code as string);
  const redirectUrl = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&is_new_user=${result.is_new_user}`;
  res.redirect(redirectUrl);
  return;
};

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

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload;

  const result = await usersService.refreshTokenHandling({ refresh_token, user_id, verify, exp });

  res.json({
    message: USER_MESSAGE.AUTH.REFRESH_TOKEN_SUCCESS,
    data: result
  });
  return;
};

export const verifyEmailTokenController = async (req: Request<ParamsDictionary, any, TokenPayload>, res: Response) => {
  const decoded_email_verify_token = req.decoded_email_verify_token as TokenPayload;
  const { user_id } = decoded_email_verify_token;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });

  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.ERROR.USER_NOT_FOUND
    });
    return;
  }

  if (user.email_verify_token === '' && user.verify === UserVerifyStatus.Verified) {
    res.json({
      message: USER_MESSAGE.TOKEN.EMAIL_IS_VERIFIED_BEFORE
    });
    return;
  }

  const result = await usersService.verifyEmail(user_id);
  res.json({
    message: USER_MESSAGE.AUTH.VERIFY_EMAIL_SUCCESS,
    result
  });
  return;
};

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.ERROR.USER_NOT_FOUND
    });
    return;
  }
  if (user.verify === UserVerifyStatus.Verified) {
    res.json({
      message: USER_MESSAGE.TOKEN.EMAIL_IS_VERIFIED_BEFORE
    });
    return;
  }

  const result = await usersService.resendVerifyEmail(user_id);
  res.status(HTTP_STATUS.OK).json({ message: USER_MESSAGE.TOKEN.EMAIL_VERIFY_TOKEN_IS_RESENT, result });
  return;
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { _id } = req.user as User;
  const verify = (req.user as User).verify as UserVerifyStatus;
  const result = await usersService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify });
  res.json(result);
  return;
};

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  res.json({ message: USER_MESSAGE.AUTH.VALID_FORGOT_PASSWORD_TOKEN });
  return;
};

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { _id, salt } = req.user as User;
  const { password } = req.body;
  const result = await usersService.resetPassword(_id as ObjectId, salt, password);
  res.json(result);
  return;
};

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await usersService.getMe(user_id);
  res.json(result);
  return;
};

export const updateAccountController = async (
  req: Request<ParamsDictionary, any, UpdateAccountReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { body } = req;
  const result = await usersService.updateAccount(user_id, body);
  res.json(result);
  return;
};

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response) => {
  const { username } = req.params;
  const result = await usersService.getProfile(username);
  res.json(result);
  return;
};

export const followController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.body;
  const result = await usersService.follow(user_id, followed_user_id);
  res.json(result);
  return;
};

export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.params;
  const result = await usersService.unfollow(user_id, followed_user_id);
  res.json(result);
  return;
};

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  const user = req.user as User;
  const { current_password, password } = req.body;
  const result = await usersService.changePassword(user, password, current_password);
  res.json(result);
  return;
};
