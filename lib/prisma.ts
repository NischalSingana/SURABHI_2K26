// HMR Trigger
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
  let adapterOptions: any = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };

  // Configure connection pool - prevent "Error { kind: Closed }" from stale idle connections
  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;

    // Only add connection params if not already present
    if (!url.includes("connection_limit")) {
      const isDev = process.env.NODE_ENV === "development";
      // Lower pool size reduces stale connections; cloud DBs often close idle connections
      // Dev: 5 connections to avoid holding many stale refs after HMR
      // Prod: 10 for serverless
      const connectionLimit = isDev ? 5 : 10;
      const poolTimeout = 15;
      const connectTimeout = 15;

      url += `${url.includes("?") ? "&" : "?"}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`;

      adapterOptions.datasources = {
        db: { url },
      };
    }
  }

  return new PrismaClient(adapterOptions);
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;

  if (typeof window === "undefined") {
    process.on("beforeExit", async () => {
      await prisma.$disconnect();
    });
  }
}