import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '~/constants/http_request';
import omit from 'lodash/omit';
import { ErrorWithStatus } from '~/models/Errors';

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    res.status(err.status).json(omit(err, ['status']));
    return;
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
