import { ParamsDictionary } from 'express-serve-static-core';
import { NextFunction, Request, Response } from 'express';
import { BookmarkRequestBody } from '~/models/schemas/requests/Bookmarks.request';
import { TokenPayload } from '~/models/schemas/requests/User.request';
import bookmarksService from '~/services/bookmarks.services';
import { BOOKMARK_MESSAGE } from '~/constants/bookmark_and_like.messages';
export const createBookmarkController = async (
  req: Request<ParamsDictionary, any, BookmarkRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.body;
  const data = await bookmarksService.createBookmark(user_id, tweet_id);

  res.json({ message: BOOKMARK_MESSAGE.SUCCESS.CREATE_BOOKMARK_SUCCESS, data });
};

export const deleteBookmarkController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.params;
  await bookmarksService.deleteBookmarkByFilter(user_id, { tweet_id });

  res.json({ message: BOOKMARK_MESSAGE.SUCCESS.DELETE_BOOKMARK_SUCCESS });
};

export const deleteBookmarkControllerByBookmarkId = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { bookmark_id } = req.params;
  await bookmarksService.deleteBookmarkByFilter(user_id, { _id: bookmark_id });
  res.json({ message: BOOKMARK_MESSAGE.SUCCESS.DELETE_BOOKMARK_SUCCESS });
};
