import { NextFunction, Request, Response } from 'express';
import mediasServices from '~/services/medias.services';

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadSingleImage(req, res, next);
  res.json({ message: 'Upload image successfully', result: data });
};
