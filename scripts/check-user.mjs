import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as prismaGeneratedClient from "../generated/prisma/client.ts";

const PrismaClient =
  prismaGeneratedClient?.PrismaClient ??
  prismaGeneratedClient?.default?.PrismaClient ??
  prismaGeneratedClient?.default;

const TARGET_EMAIL = "admin@company.vn";

function maskPasswordPresence(password) {
  return password ? "[SET]" : "[EMPTY]";
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is missing");
    process.exitCode = 1;
    return;
  }

  if (typeof PrismaClient !== "function") {
    console.error(
      "PrismaClient resolve failed:",
      JSON.stringify(Object.keys(prismaGeneratedClient ?? {}))
    );
    process.exitCode = 1;
    return;
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
      select: {
        id: true,
        email: true,
        name: true,
        accounts: {
          select: {
            id: true,
            providerId: true,
            accountId: true,
            password: true,
          },
        },
      },
    });

    if (!user) {
      console.log(JSON.stringify({ email: TARGET_EMAIL, exists: false }, null, 2));
      return;
    }

    const accounts = user.accounts.map((account) => ({
      id: account.id,
      providerId: account.providerId,
      accountId: account.accountId,
      passwordPresence: maskPasswordPresence(account.password),
    }));

    const result = {
      email: TARGET_EMAIL,
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accountCount: accounts.length,
      hasAnyAccountPassword: user.accounts.some((account) => Boolean(account.password)),
      accounts,
      mode: "READ_ONLY_PROBE",
      note: "No DB writes performed",
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Probe failed:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
