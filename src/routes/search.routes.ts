import { Router } from 'express';
import { searchController } from '~/controllers/search.controllers';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';

const searchRouter = Router();

searchRouter.get('/', accessTokenValidator, verifyStatusAccount, searchController);

export default searchRouter;
