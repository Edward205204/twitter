import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGES_DIR, UPLOAD_VIDEOS_DIR } from '~/constants/dir';
import { USER_MESSAGE } from '~/constants/user.message';
import mediasServices from '~/services/medias.services';
import fs from 'fs';

import { HTTP_STATUS } from '~/constants/http_request';
export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadImage(req, res, next);
  res.json({ message: USER_MESSAGE.AUTH.UPLOAD_IMAGE_SUCCESS, data: data });
};

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadVideo(req, res, next);
  res.json({ message: USER_MESSAGE.AUTH.UPLOAD_VIDEO_SUCCESS, data: data });
};

export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasServices.uploadVideoHLS(req, res, next);
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

export const serveStatic_m3u8Controller = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const filePath = path.resolve(UPLOAD_VIDEOS_DIR, id, 'master.m3u8');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status((err as any).status).json({ message: err.message });
      return;
    }
  });
};

export const serveStaticSegmentController = (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params;
  const filePath = path.resolve(UPLOAD_VIDEOS_DIR, id, v, segment);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status((err as any).status).json({ message: err.message });
      return;
    }
  });
};

// hiển thị video
export const serveStaticVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const mime = await import('mime');

  const { range } = req.headers;
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: USER_MESSAGE.ERROR.RANGE_NOT_FOUND });
  }
  const { name } = req.params;

  if (!name) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: USER_MESSAGE.ERROR.FILE_NOT_FOUND });
  }

  const videoPath = path.resolve(UPLOAD_VIDEOS_DIR, name);

  if (!fs.existsSync(videoPath)) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USER_MESSAGE.ERROR.FILE_NOT_FOUND });
  }

  const videoSize = fs.statSync(videoPath).size;
  const chunkSize = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + chunkSize, videoSize - 1);
  const contentLength = end - start + 1;
  const contentType = mime.default.getType(videoPath) || 'video/*';

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Type': contentType,
    'Content-Length': contentLength
  };
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
};
