import fs from 'fs';
import formidable, { File } from 'formidable';
import { NextFunction, Request, Response } from 'express';
import { UPLOAD_IMAGES_TEMP_DIR, UPLOAD_VIDEOS_DIR } from '../constants/dir';
import { getExtension } from './utils';
import path from 'path';

export const initFolder = () => {
  [UPLOAD_IMAGES_TEMP_DIR, UPLOAD_VIDEOS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

export const handleUploadImage = async (req: Request, res: Response, next: NextFunction) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGES_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300kb
    maxTotalFileSize: 300 * 1024 * 4,
    filter: function ({ name, originalFilename, mimetype }: formidable.Part): boolean {
      const valid = name === 'image' && Boolean(mimetype && mimetype.includes('image')); // phải là image và có mimetype là image
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any);
      }
      return valid;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'));
      }

      resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  const nanodId = (await import('nanoid')).nanoid;
  const nano_name = nanodId();
  fs.mkdirSync(path.resolve(UPLOAD_VIDEOS_DIR, nano_name), { recursive: true });
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_VIDEOS_DIR, nano_name),
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50mb
    filter: function ({ name, originalFilename, mimetype }: formidable.Part): boolean {
      const valid = name === 'video' && Boolean(mimetype && mimetype.includes('video')); // phải là video và có mimetype là video
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any);
      }
      return true;
    },
    filename: (name, ext, part, form) => {
      return nano_name;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'));
      }

      const videos = files.video as File[];

      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string);
        fs.renameSync(video.filepath, video.filepath + '.' + ext);
        video.newFilename = video.newFilename + '.' + ext;
        video.filepath = video.filepath + '.' + ext;
      });

      resolve(files.video as File[]);
    });
  });
};
