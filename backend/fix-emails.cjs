const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) await prisma.user.update({ where: { id: admin.id }, data: { email: 'priyadharshini.k2345@gmail.com' } });
    
    const faculty = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
    if (faculty) await prisma.user.update({ where: { id: faculty.id }, data: { email: 'priyadharshini.k2345+faculty@gmail.com' } });
    
    const counselor = await prisma.user.findFirst({ where: { role: 'COUNSELOR' } });
    if (counselor) await prisma.user.update({ where: { id: counselor.id }, data: { email: 'priyadharshini.k2345+counselor@gmail.com' } });
    
    console.log("Emails updated to aliases to prevent bouncing and unique constraint failures.");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
