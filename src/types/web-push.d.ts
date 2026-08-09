declare module "web-push" {
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
  export function sendNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload?: string | Buffer,
    options?: { TTL?: number; urgency?: "very-low" | "low" | "normal" | "high" }
  ): Promise<unknown>;
  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    generateVAPIDKeys: typeof generateVAPIDKeys;
    sendNotification: typeof sendNotification;
  };
  export default webpush;
}
