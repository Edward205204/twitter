import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_DIR } from '~/constants/dir';
import { USER_MESSAGE } from '~/constants/user.message';
import mediasServices from '~/services/medias.services';

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadImage(req, res, next);
  res.json({ message: USER_MESSAGE.AUTH.UPLOAD_IMAGE_SUCCESS, data: data });
};

export const serveStaticImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  const filePath = path.resolve(UPLOAD_DIR, name);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status((err as any).status).json({ message: err.message });
    }
  });
};
