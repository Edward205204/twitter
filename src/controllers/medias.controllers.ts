import { NextFunction, Request, Response } from 'express';
import { handleUploadSingleImage } from '~/constants/file';

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await handleUploadSingleImage(req, res, next);
  res.json({ message: 'Upload image successfully', result: data });
};
