import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const prisma = global.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;

  if (import.meta.hot) {
    import.meta.hot.dispose(async () => {
      await global.prismaGlobal?.$disconnect();
      global.prismaGlobal = undefined;
    });
  }
}

export default prisma;
