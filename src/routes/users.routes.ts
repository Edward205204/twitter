import { Router } from 'express';
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unfollowController,
  updateAccountController,
  verifyEmailTokenController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers';
import { filterMiddleware } from '~/middlewares/common.middlewares';
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidate,
  registerValidator,
  resetPasswordValidator,
  updateAccountValidator,
  verifyFollowedUserId,
  verifyForgotPasswordValidator,
  verifyStatusAccount
} from '~/middlewares/users.validators';
import { UpdateAccountReqBody } from '~/models/schemas/requests/User.request';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidate, wrapRequestHandler(logoutController));
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailTokenController));
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController));
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController)
);
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController));

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));

usersRouter.patch(
  '/update-me',
  accessTokenValidator,
  verifyStatusAccount,
  updateAccountValidator,
  filterMiddleware<UpdateAccountReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateAccountController)
);

usersRouter.get('/:username', wrapRequestHandler(getProfileController));

usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifyStatusAccount,
  verifyFollowedUserId,
  wrapRequestHandler(followController)
);

usersRouter.delete(
  '/follow/:followed_user_id',
  accessTokenValidator,
  verifyStatusAccount,
  verifyFollowedUserId,
  wrapRequestHandler(unfollowController)
);

usersRouter.post(
  '/change-password',
  accessTokenValidator,
  verifyStatusAccount,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
);

export default usersRouter;
