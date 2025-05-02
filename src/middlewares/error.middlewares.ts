import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '~/constants/http_request';
import omit from 'lodash/omit';
import { ErrorWithStatus } from '~/models/Errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']));
  }
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, {
      enumerable: true
    });
  });
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ['stack'])
  });
};
