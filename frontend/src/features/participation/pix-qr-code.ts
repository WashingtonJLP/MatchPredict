const BASE64_IMAGE_PREFIX = 'data:image/png;base64,';
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export function toPixQrCodeImageSrc(encodedImage: string | null) {
  if (!encodedImage) {
    return null;
  }

  const trimmed = encodedImage.trim();
  const base64 = trimmed.startsWith(BASE64_IMAGE_PREFIX)
    ? trimmed.slice(BASE64_IMAGE_PREFIX.length)
    : trimmed;

  if (!base64 || !BASE64_PATTERN.test(base64)) {
    return null;
  }

  return `${BASE64_IMAGE_PREFIX}${base64}`;
}
