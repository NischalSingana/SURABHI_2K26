// HMR Trigger
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
  let adapterOptions: any = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };

  // Configure connection pool for better performance
  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    
    // Only add connection params if not already present
    if (!url.includes("connection_limit")) {
      const isDev = process.env.NODE_ENV === "development";
      // Development: More connections for Hot Module Reload
      // Production: Optimized for serverless
      const connectionLimit = isDev ? 20 : 10;
      const poolTimeout = isDev ? 20 : 10;
      
      url += `${url.includes("?") ? "&" : "?"}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=10`;
      
      adapterOptions.datasources = {
        db: { url }
      };
    }
  }

  return new PrismaClient(adapterOptions);
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

// Cleanup on module reload in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  
  // Add cleanup handler
  if (typeof window === "undefined") {
    process.on("beforeExit", async () => {
      await prisma.$disconnect();
    });
  }
}