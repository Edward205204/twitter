import { Router } from 'express';
import { createBookmarkController } from '~/controllers/bookmarks.controllers';
import { accessTokenValidator } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const bookmarksRouter = Router();

bookmarksRouter.post('/', accessTokenValidator, wrapRequestHandler(createBookmarkController));

export default bookmarksRouter;
