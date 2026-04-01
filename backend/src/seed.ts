import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Faculty and Admin accounts...');

  const password = await bcrypt.hash('password123', 10);

  // Seed a Super Admin if not exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wellnex.edu' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@wellnex.edu',
      password: password,
      role: 'ADMIN',
    },
  });

  // Seed a Faculty member
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@wellnex.edu' },
    update: {},
    create: {
      name: 'Prof. Sarah Jenkins',
      email: 'faculty@wellnex.edu',
      password: password,
      role: 'FACULTY',
      department: 'Computer Science'
    },
  });
  
  // Seed a Counselor
  const counselor = await prisma.user.upsert({
    where: { email: 'counselor@wellnex.edu' },
    update: {},
    create: {
      name: 'Dr. Michael Chen',
      email: 'counselor@wellnex.edu',
      password: password,
      role: 'COUNSELOR',
    },
  });

  console.log('✅ Seeding complete!');
  console.log('Admin:', admin.email);
  console.log('Faculty (Receives Urgent Emails):', faculty.email);
  console.log('Counselor (Receives Urgent Emails):', counselor.email);
  console.log('All passwords are: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
