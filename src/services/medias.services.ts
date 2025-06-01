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
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import { USER_MESSAGE } from '~/constants/user.message';

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

  async uploadVideoHLS(req: Request, res: Response, next: NextFunction) {
    const files = await handleUploadVideo(req, res, next);
    const data: Media[] = await Promise.all(
      files.map(async (file) => {
        await encodeHLSWithMultipleVideoStreams(file.filepath);
        const newFilename = getNameIgnoreExtension(file.newFilename);
        fs.unlink(file.filepath, (err) => {
          if (err) {
            console.log('Delete original file error after encode HLS: ' + err.message);
          }
        });

        return {
          url: isDevelopment()
            ? `http://localhost:${process.env.PORT}/static/video-hls/${newFilename}`
            : `${process.env.HOST}/static/video-hls/${newFilename}`,
          type: MediaType.HLS
        };
      })
    );
    return data;
  }
}

const mediasServices = new MediasServices();

export default mediasServices;
