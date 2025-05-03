import { Router } from 'express';
import { loginController, registerController } from '~/controllers/users.controllers';
import { accessTokenValidator, loginValidator, registerValidator } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));
usersRouter.post(
  '/logout',
  accessTokenValidator,
  wrapRequestHandler((req, res) => {
    res.json({ message: 'Logout success' });
  })
);

export default usersRouter;
