import { Router } from 'express';
import { accessTokenValidator, isUserLoggedInValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controllers';
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
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
  paginationValidator,
  getTweetChildrenValidator,
  wrapRequestHandler(getTweetChildrenController)
);

tweetsRouter.get(
  '/',
  accessTokenValidator,
  verifyStatusAccount,
  paginationValidator,
  wrapRequestHandler(getNewFeedsController)
);

export default tweetsRouter;
