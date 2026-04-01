import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'Mathi', mode: 'insensitive' } }
  });
  console.log('--- Mathi User Data ---');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, PwdHash: ${u.password.substring(0, 10)}...`);
  });
  console.log('-----------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
