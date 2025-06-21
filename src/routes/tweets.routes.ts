import { Router } from 'express';
import { accessTokenValidator, isUserLoggedInValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';
import {
  createTweetController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controllers';
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares';
const tweetsRouter = Router();

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifyStatusAccount,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
);

tweetsRouter.get(
  '/:tweet_id',
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyStatusAccount),
  tweetIdValidator,
  audienceValidator,
  wrapRequestHandler(getTweetController)
);

tweetsRouter.get(
  '/:tweet_id/children',
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyStatusAccount),
  tweetIdValidator,
  audienceValidator,
  getTweetChildrenValidator,
  wrapRequestHandler(getTweetChildrenController)
);

export default tweetsRouter;
