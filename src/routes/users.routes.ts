import { Router } from 'express';
import { loginController, logoutController, registerController } from '~/controllers/users.controllers';
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidate,
  registerValidator
} from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidate, wrapRequestHandler(logoutController));

export default usersRouter;
