import { Router } from 'express';
import {
  createLikeController,
  deleteLikeController,
  deleteLikeControllerByLikeId
} from '~/controllers/likes.controllers';
import { tweetIdValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const likesRouter = Router();

likesRouter.post('/', accessTokenValidator, wrapRequestHandler(createLikeController));
likesRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifyStatusAccount,
  tweetIdValidator,
  wrapRequestHandler(deleteLikeController)
);
likesRouter.delete(
  '/:like_id',
  accessTokenValidator,
  verifyStatusAccount,
  tweetIdValidator,
  wrapRequestHandler(deleteLikeControllerByLikeId)
);

export default likesRouter;
