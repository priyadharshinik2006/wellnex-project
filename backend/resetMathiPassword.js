import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const updated = await prisma.user.updateMany({
    where: { email: 'mathivathanirv126@gmail.com' },
    data: { password: hashedPassword }
  });

  console.log('Mathi password reset to "password123". Updated records:', updated.count);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
