const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.group.create({ data: { name: 'Test Group', members: 1, membersList: JSON.stringify([]) } });
  await prisma.group.create({ data: { name: 'Public Group', members: 0, membersList: JSON.stringify([]) } });
  console.log('groups created');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
