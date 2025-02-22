import { Router } from 'express';
import { loginController, registerController } from '~/controllers/users.controllers';
import { loginValidator } from '~/middlewares/users.validators';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, loginController);
usersRouter.post('/register', registerController);

export default usersRouter;
