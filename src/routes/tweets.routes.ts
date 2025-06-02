import { Router } from 'express';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';
import { createTweetController } from '~/controllers/tweets.controllers';
import { createTweetValidator } from '~/middlewares/tweets.middlewares';
const tweetsRouter = Router();

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifyStatusAccount,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
);

export default tweetsRouter;
