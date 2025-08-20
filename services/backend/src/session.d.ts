import "express-session";

declare module "express-session" {
  interface SessionData {
    nonce?: string;
    address?: `0x${string}` | string;
    chainId?: number | string;
    isAuthenticated?: boolean;
  }
}