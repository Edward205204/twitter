import { Router } from 'express';
import {
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  verifyEmailTokenController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers';
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidate,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.validators';
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

export default usersRouter;
