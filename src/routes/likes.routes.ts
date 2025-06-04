import { Router } from 'express';
import { createLikeController } from '~/controllers/likes.controllers';
import { accessTokenValidator } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const likesRouter = Router();

likesRouter.post('/', accessTokenValidator, wrapRequestHandler(createLikeController));

export default likesRouter;
