import { TokenPayload } from './../models/schemas/requests/User.request';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { TweetType } from '~/constants/enums';
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
  const user_id = req.decoded_authorization?.user_id;
  const result = await tweetsService.increaseView(tweet_id, user_id);
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at
  };

  res.json({
    message: TWEETS_MESSAGES.SUCCESS.GET_TWEET_SUCCESS,
    data: tweet
  });
  return;
};

export const getTweetChildrenController = async (req: Request, res: Response) => {
  const tweet_id = req.params.tweet_id;
  const tweet_type = Number(req.query.type) as TweetType;
  const tweet_limit = Number(req.query.limit) || 10;
  const tweet_page = Number(req.query.page) || 1;
  const user_id = req.decoded_authorization?.user_id;

  const { tweets, total } = await tweetsService.getTweetChildren({
    tweet_id,
    tweet_type,
    tweet_limit,
    tweet_page,
    user_id
  });

  res.json({
    message: TWEETS_MESSAGES.SUCCESS.GET_TWEET_CHILDREN_SUCCESS,
    data: {
      tweets,
      tweet_type,
      limit: tweet_limit,
      page: tweet_page,
      total_page: Math.ceil(total / tweet_limit)
    }
  });
  return;
};
