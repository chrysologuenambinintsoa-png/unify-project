import { Prisma } from '@prisma/client';

declare module '@prisma/client' {
  // Augment PrismaClient with missing model delegates to satisfy TypeScript server
  interface PrismaClient {
    payment: any;
  }
}
