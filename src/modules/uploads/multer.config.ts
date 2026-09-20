import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type FilenameCallback = (error: Error | null, filename: string) => void;

export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req: unknown, file: UploadedFile, callback: FilenameCallback) => {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      callback(new BadRequestException('Only image files are allowed'), false);
      return;
    }
    callback(null, true);
  },
};
