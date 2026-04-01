import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DB Verification Status ---');
  
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  console.log('Users by Role:', userCounts);

  const surveyCount = await prisma.wellnessSurvey.count();
  console.log('Total Wellness Surveys:', surveyCount);

  const apptCount = await prisma.counselingAppointment.count();
  console.log('Total Appointments:', apptCount);

  const interventionCount = await prisma.intervention.count();
  console.log('Total Interventions:', interventionCount);

  console.log('------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
