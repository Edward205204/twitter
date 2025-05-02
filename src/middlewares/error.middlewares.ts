import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '~/constants/http_request';
import omit from 'lodash/omit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, ['status']));
};
