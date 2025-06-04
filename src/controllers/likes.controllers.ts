import { ParamsDictionary } from 'express-serve-static-core';
import { NextFunction, Request, Response } from 'express';
import { LikeRequestBody } from '~/models/schemas/requests/Likes.request';
import { TokenPayload } from '~/models/schemas/requests/User.request';
import likesService from '~/services/likes.services';
import { LIKE_MESSAGE } from '~/constants/bookmark_and_like.messages';

export const createLikeController = async (
  req: Request<ParamsDictionary, any, LikeRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.body;
  const data = await likesService.createLike(user_id, tweet_id);

  res.json({ message: LIKE_MESSAGE.SUCCESS.CREATE_LIKE_SUCCESS, data });
};

export const deleteLikeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.params;
  await likesService.deleteLikeByFilter(user_id, { tweet_id });

  res.json({ message: LIKE_MESSAGE.SUCCESS.DELETE_LIKE_SUCCESS });
};

export const deleteLikeControllerByLikeId = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { like_id } = req.params;
  await likesService.deleteLikeByFilter(user_id, { _id: like_id });
  res.json({ message: LIKE_MESSAGE.SUCCESS.DELETE_LIKE_SUCCESS });
};
