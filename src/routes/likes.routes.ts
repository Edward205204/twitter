import { Router } from 'express';
import {
  createLikeController,
  deleteLikeController,
  deleteLikeControllerByLikeId
} from '~/controllers/likes.controllers';
import { accessTokenValidator } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const likesRouter = Router();

likesRouter.post('/', accessTokenValidator, wrapRequestHandler(createLikeController));
likesRouter.delete('/tweets/:tweet_id', accessTokenValidator, wrapRequestHandler(deleteLikeController));
likesRouter.delete('/:like_id', accessTokenValidator, wrapRequestHandler(deleteLikeControllerByLikeId));

export default likesRouter;
