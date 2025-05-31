import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_DIR } from '~/constants/dir';
import { getNameIgnoreExtension, handleUploadSingleImage } from '~/utils/file';
import fs from 'fs';
import sharp from 'sharp';

class MediasServices {
  async uploadSingleImage(req: Request, res: Response, next: NextFunction) {
    const file = await handleUploadSingleImage(req, res, next);
    const newName = getNameIgnoreExtension(file.newFilename);
    // const newPath = path.join(UPLOAD_DIR, `${newName}.jpg`); -> sai
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`);
    await sharp(file.filepath).jpeg().toFile(newPath);
    fs.unlinkSync(file.filepath);
    return { url: `http://localhost:3000/uploads/${newName}.jpg` };
  }
}

const mediasServices = new MediasServices();

export default mediasServices;
