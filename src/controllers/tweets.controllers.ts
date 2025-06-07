import { TokenPayload } from './../models/schemas/requests/User.request';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { TWEETS_MESSAGES } from '~/constants/tweet.message';
import { TweetRequestBody } from '~/models/schemas/requests/Tweet.request';
import tweetsService from '~/services/tweets.services';

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const body = req.body as TweetRequestBody;
  const { user_id } = req.decoded_authorization as TokenPayload;
  const data = await tweetsService.createTweet({
    body,
    user_id
  });
  res.json({
    message: TWEETS_MESSAGES.SUCCESS.CREATE_TWEET_SUCCESS,
    data
  });
  return;
};

export const getTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params;

  res.json({
    message: TWEETS_MESSAGES.SUCCESS.GET_TWEET_SUCCESS,
    data: tweet_id
  });
  return;
};
