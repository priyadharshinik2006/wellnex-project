import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding administrative users...');

  const users = [
    {
      name: 'Faculty Counselor',
      email: 'priyadharshini.k2345@gmail.com',
      password: 'Priya@2468',
      role: Role.ADMIN,
      department: 'Counseling'
    },
    {
      name: 'System Administrator',
      email: 'admin@wellnex.com',
      password: 'admin@123',
      role: Role.SUPER_ADMIN,
      department: 'IT'
    }
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { 
        role: u.role,
        password: hashedPassword // Ensure password is also synced/reset to the seeded value
      },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        department: u.department
      }
    });
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
