import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGES_DIR } from '~/constants/dir';
import { handleUploadImage, handleUploadVideo } from '~/utils/file';
import { getNameIgnoreExtension } from '~/utils/utils';
import fs from 'fs';
import sharp from 'sharp';
import { isDevelopment } from '~/utils/config';
import { config } from 'dotenv';
import { MediaType } from '~/constants/enums';
import { Media } from '~/models/schemas/Other';

config();
class MediasServices {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    const files = await handleUploadImage(req, res, next);
    const data: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameIgnoreExtension(file.newFilename);
        const newPath = path.resolve(UPLOAD_IMAGES_DIR, `${newName}.jpg`);
        await sharp(file.filepath).jpeg().toFile(newPath);
        fs.unlinkSync(file.filepath);
        return {
          url: isDevelopment()
            ? `http://localhost:${process.env.PORT}/static/images/${newName}.jpg`
            : `${process.env.HOST}/static/images/${newName}.jpg`,
          type: MediaType.Image
        };
      })
    );
    return data;
  }

  async uploadVideo(req: Request, res: Response, next: NextFunction) {
    const files = await handleUploadVideo(req, res, next);
    const data: Media[] = await Promise.all(
      files.map(async (file) => {
        const { newFilename } = file;

        return {
          url: isDevelopment()
            ? `http://localhost:${process.env.PORT}/static/videos/${newFilename}`
            : `${process.env.HOST}/static/videos/${newFilename}`,
          type: MediaType.Video
        };
      })
    );
    return data;
  }
}

const mediasServices = new MediasServices();

export default mediasServices;
