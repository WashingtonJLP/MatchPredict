export abstract class AvatarStorage {
  abstract upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string>;
  abstract delete(key: string): Promise<void>;
}
