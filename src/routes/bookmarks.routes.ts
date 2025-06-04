import { Router } from 'express';
import {
  createBookmarkController,
  deleteBookmarkController,
  deleteBookmarkControllerByBookmarkId
} from '~/controllers/bookmarks.controllers';
import { accessTokenValidator } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const bookmarksRouter = Router();

bookmarksRouter.post('/', accessTokenValidator, wrapRequestHandler(createBookmarkController));
bookmarksRouter.delete('/tweets/:tweet_id', accessTokenValidator, wrapRequestHandler(deleteBookmarkController));
bookmarksRouter.delete('/:bookmark_id', accessTokenValidator, wrapRequestHandler(deleteBookmarkControllerByBookmarkId));

export default bookmarksRouter;
