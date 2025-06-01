import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGES_DIR, UPLOAD_VIDEOS_DIR } from '~/constants/dir';
import { USER_MESSAGE } from '~/constants/user.message';
import mediasServices from '~/services/medias.services';

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadImage(req, res, next);
  res.json({ message: USER_MESSAGE.AUTH.UPLOAD_IMAGE_SUCCESS, data: data });
};

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadVideo(req, res, next);
  res.json({ message: USER_MESSAGE.AUTH.UPLOAD_VIDEO_SUCCESS, data: data });
};

// hiển thị ảnh
export const serveStaticImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  const filePath = path.resolve(UPLOAD_IMAGES_DIR, name);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status((err as any).status).json({ message: err.message });
      return;
    }
  });
};

// hiển thị video
export const serveStaticVideoController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  const filePath = path.resolve(UPLOAD_VIDEOS_DIR, name);

  res.sendFile(filePath, (err) => {
    if (err) {
      // Nếu lỗi là 404, trả về 404, còn lỗi khác gọi next() để middleware xử lý
      if ((err as any).status === 404) {
        return res.status(404).json({ message: USER_MESSAGE.ERROR.FILE_NOT_FOUND });
      }

      return next(err);
    }
  });
};
