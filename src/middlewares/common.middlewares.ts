import { Request, Response, NextFunction } from 'express';
import pick from 'lodash/pick';

export const filterMiddleware =
  <T extends string>(filterArray: T[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const newObject = pick(req.body, filterArray);
    req.body = newObject;
    next();
  };
