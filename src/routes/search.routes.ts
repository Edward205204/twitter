import { Router } from 'express';
import { searchController } from '~/controllers/search.controllers';
import searchValidator from '~/middlewares/search.middlewares';
import { paginationValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';

const searchRouter = Router();

searchRouter.get(
  '/',
  accessTokenValidator,
  verifyStatusAccount,
  paginationValidator,
  searchValidator,
  searchController
);

export default searchRouter;
