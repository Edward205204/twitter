import fs from 'fs';
import path from 'path';
import formidable, { File } from 'formidable';
import { NextFunction, Request, Response } from 'express';
import { UPLOAD_TEMP_DIR } from '../constants/dir';

export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
  }
};

export const handleUploadSingleImage = async (req: Request, res: Response, next: NextFunction) => {
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300kb
    filter: function ({ name, originalFilename, mimetype }: formidable.Part): boolean {
      const valid = name === 'image' && Boolean(mimetype && mimetype.includes('image')); // phải là image và có mimetype là image
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any);
      }
      return valid;
    }
  });

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'));
      }

      resolve((files.image as File[])[0]);
    });
  });
};

export const getNameIgnoreExtension = (filename: string) => {
  const file = filename.split('.');
  return file.slice(0, -1).join('.');
};
