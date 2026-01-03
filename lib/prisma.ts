
import { PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
  let adapterOptions = {};

  if (process.env.NODE_ENV === "development" && process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    if (!url.includes("connection_limit")) {
      url += `${url.includes("?") ? "&" : "?"}connection_limit=5&pool_timeout=20`;
      adapterOptions = {
        datasources: {
          db: {
            url
          }
        }
      };
      console.log("Applying dev DB connection limits");
    }
  }

  return new PrismaClient(adapterOptions);
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;