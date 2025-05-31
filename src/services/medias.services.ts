import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_DIR } from '~/constants/dir';
import { getNameIgnoreExtension, handleUploadSingleImage } from '~/utils/file';
import fs from 'fs';
import sharp from 'sharp';
import { isDevelopment } from '~/utils/config';
import { config } from 'dotenv';

config();
class MediasServices {
  async uploadSingleImage(req: Request, res: Response, next: NextFunction) {
    const file = await handleUploadSingleImage(req, res, next);
    const newName = getNameIgnoreExtension(file.newFilename);
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`);
    await sharp(file.filepath).jpeg().toFile(newPath);
    fs.unlinkSync(file.filepath);
    return {
      url: isDevelopment()
        ? `http://localhost:${process.env.PORT}/static/${newName}.jpg`
        : `${process.env.HOST}/static/${newName}.jpg`
    };
  }
}

const mediasServices = new MediasServices();

export default mediasServices;
