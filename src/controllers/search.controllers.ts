import { ParamsDictionary } from 'express-serve-static-core';
import { Request, Response } from 'express';
import { SearchQuery } from '~/models/schemas/Search.schema';
import searchService from '~/services/search.services';
import { TWEETS_MESSAGES } from '~/constants/tweet.message';
import { MediaTypeQuery } from '~/constants/enums';

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const content = req.query.content;
  const user_id = req.decoded_authorization?.user_id as string;
  const media_type = req.query.media_type as MediaTypeQuery;
  const people_follow = req.query.people_follow;
  const { tweets, total } = await searchService.search({ content, limit, page, user_id, media_type, people_follow });

  res.json({
    message: TWEETS_MESSAGES.SUCCESS.SEARCH_SUCCESS,
    data: {
      tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  });
  return;
};
