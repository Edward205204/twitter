import { Query } from 'express-serve-static-core';
import { PaginationQuery } from './requests/Tweet.request';
import { MediaTypeQuery } from '~/constants/enums';

export interface SearchQuery extends PaginationQuery, Query {
  content: string;
  media_type: MediaTypeQuery;
  people_follow: string;
}
