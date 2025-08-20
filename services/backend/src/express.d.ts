// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express';
import "express-session";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number, address: string };
    }
  }
}

interface SiweSessionData {
  address: string;
  chainId: number;
}

declare module "express-session" {
  interface Session {
    siwe?: SiweSessionData;
  }
}