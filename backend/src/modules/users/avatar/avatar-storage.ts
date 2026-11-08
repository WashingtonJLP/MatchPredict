export abstract class AvatarStorage {
  // Upload under the exact server-generated key and return its HTTPS URL.
  // The key is persisted as avatarKey and must also identify the asset for deletion.
  abstract upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string>;
  abstract delete(key: string): Promise<void>;
}
