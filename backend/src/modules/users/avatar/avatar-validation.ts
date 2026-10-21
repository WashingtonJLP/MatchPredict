import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type {} from 'multer';

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function validateAvatar(file?: Express.Multer.File): string {
  if (!file?.buffer?.length || !file.size) {
    throw new BadRequestException('Selecione uma imagem não vazia.');
  }
  if (file.size > AVATAR_MAX_BYTES || file.buffer.length > AVATAR_MAX_BYTES) {
    throw new PayloadTooLargeException('A foto deve ter no máximo 5 MB.');
  }
  const body = file.buffer;
  const matches = {
    'image/jpeg': body.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': body
      .subarray(0, 8)
      .equals(Buffer.from('89504e470d0a1a0a', 'hex')),
    'image/webp':
      body.toString('ascii', 0, 4) === 'RIFF' &&
      body.toString('ascii', 8, 12) === 'WEBP',
  };
  if (
    !Object.prototype.hasOwnProperty.call(matches, file.mimetype) ||
    !matches[file.mimetype as keyof typeof matches]
  ) {
    throw new BadRequestException('Use uma imagem JPEG, PNG ou WebP válida.');
  }
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[
    file.mimetype
  ]!;
}
