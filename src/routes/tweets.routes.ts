import { Router } from 'express';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';
import { createTweetController } from '~/controllers/tweets.controllers';

const tweetsRouter = Router();

tweetsRouter.post('/', accessTokenValidator, verifyStatusAccount, wrapRequestHandler(createTweetController));

export default tweetsRouter;
