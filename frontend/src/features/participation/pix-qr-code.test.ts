import assert from 'node:assert/strict';
import test from 'node:test';

import { toPixQrCodeImageSrc } from './pix-qr-code.ts';

test('converte encodedImage Base64 em uma imagem PNG segura', () => {
  assert.equal(
    toPixQrCodeImageSrc('YWJjZA=='),
    'data:image/png;base64,YWJjZA==',
  );
});

test('preserva data URL PNG Base64 oficial', () => {
  assert.equal(
    toPixQrCodeImageSrc('data:image/png;base64,YWJjZA=='),
    'data:image/png;base64,YWJjZA==',
  );
});

test('rejeita data URL de outro tipo e conteÃºdo invÃ¡lido', () => {
  assert.equal(toPixQrCodeImageSrc('data:image/svg+xml,<svg></svg>'), null);
  assert.equal(toPixQrCodeImageSrc('javascript:alert(1)'), null);
  assert.equal(toPixQrCodeImageSrc(null), null);
});
