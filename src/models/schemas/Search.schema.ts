import { Query } from 'express-serve-static-core';
import { PaginationQuery } from './requests/Tweet.request';

export interface SearchQuery extends PaginationQuery, Query {
  content: string;
}
