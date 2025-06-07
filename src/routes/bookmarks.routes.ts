import { Router } from 'express';
import {
  createBookmarkController,
  deleteBookmarkController,
  deleteBookmarkControllerByBookmarkId
} from '~/controllers/bookmarks.controllers';
import { tweetIdValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const bookmarksRouter = Router();

bookmarksRouter.post('/', accessTokenValidator, wrapRequestHandler(createBookmarkController));
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifyStatusAccount,
  tweetIdValidator,
  wrapRequestHandler(deleteBookmarkController)
);
bookmarksRouter.delete(
  '/:bookmark_id',
  accessTokenValidator,
  verifyStatusAccount,
  tweetIdValidator,
  wrapRequestHandler(deleteBookmarkControllerByBookmarkId)
);

export default bookmarksRouter;
