// Seed script: creates one professor and two students for local dev.
// Safe to re-run — upserts by id. Run via: pnpm db:seed (with pnpm dev running).
// Act as a user by sending `x-user-id: <id>`; with no header you are demo-user.

import { prisma } from "@project/db";

const USERS = [
  { id: "demo-user", name: "Demo Professor", email: "professor@codelens.dev", role: "PROFESSOR" },
  { id: "student-a", name: "Student A", email: "student-a@codelens.dev", role: "STUDENT" },
  { id: "student-b", name: "Student B", email: "student-b@codelens.dev", role: "STUDENT" },
];

async function main() {
  for (const user of USERS) {
    await prisma.user.upsert({ where: { id: user.id }, update: user, create: user });
  }
  console.log(`seed: upserted ${USERS.map((u) => u.id).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
