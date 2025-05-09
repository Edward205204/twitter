import { Request, Response, NextFunction } from 'express';
import pick from 'lodash/pick';

type FilterKeys<T> = Array<keyof T>;
export const filterMiddleware =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const newObject = pick(req.body, filterKeys);
    req.body = newObject;
    next();
  };

/**
 * Giải thích typescript, khi gọi hàm, thì truyền vào object làm generic type
 * type FilterKeys<T> = Array<keyof T>; đoạn này chuyển object thành array các key của object
 * FilterKeys<T> tức là một mảng các key của object T
 * Khi gọi hàm này mà truyền generic type(là 1 object), thì typescript sẽ gợi í các key của object đó làm tham số
 * cho hàm filterMiddleware
 * Ví dụ: filterMiddleware<UpdateAccountReqBody>(['name', 'date_of_birth', 'bio', 'location', 'website', 'username', 'avatar', 'cover_photo'])
 * Với UpdateAccountReqBody = {
 *  name: string;
 *  date_of_birth: string;
 *  bio: string;
 *  location: string;
 *  website: string;
 *  username: string;
 */
