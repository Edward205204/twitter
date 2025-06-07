import { Router } from 'express';
import { accessTokenValidator, isUserLoggedInValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';
import { createTweetController, getTweetController } from '~/controllers/tweets.controllers';
import { createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares';
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
  wrapRequestHandler(getTweetController)
);

export default tweetsRouter;
