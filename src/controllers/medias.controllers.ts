import { NextFunction, Request, Response } from 'express';
import { USER_MESSAGE } from '~/constants/user.message';
import mediasServices from '~/services/medias.services';

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadSingleImage(req, res, next);
  res.json({ message: USER_MESSAGE.AUTH.UPLOAD_IMAGE_SUCCESS, data: data.url });
};
