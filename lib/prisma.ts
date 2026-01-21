// HMR Trigger
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
  let adapterOptions: any = {};

  if (process.env.NODE_ENV === "development" && process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    if (!url.includes("connection_limit")) {
      // Increased connection limit for local development with the better DB
      url += `${url.includes("?") ? "&" : "?"}connection_limit=10&pool_timeout=30`;
      adapterOptions = {
        datasources: {
          db: {
            url
          }
        }
      };
    }
  }

  // Log in production if we want to track connection instantiation
  // if (process.env.NODE_ENV === "production") {
  //   console.log("Prisma Client initialized in production");
  // }

  return new PrismaClient(adapterOptions);
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;