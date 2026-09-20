import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { multerConfig, type UploadedFile } from './multer.config.js';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(FilesInterceptor('files', 6, multerConfig))
  upload(@UploadedFiles() files: UploadedFile[]) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    return { urls: files.map((file) => `/uploads/${file.filename}`) };
  }
}
