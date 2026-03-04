const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('=== Recurring Events Diagnostic ===\n');

  const recurringEvents = await prisma.event.findMany({
    where: { isRecurring: true, status: 'APPROVED' },
    include: { instances: true }
  });
  console.log('(a) Recurring APPROVED Events:', recurringEvents.length);
  recurringEvents.forEach((e, i) => {
    console.log('  [' + (i + 1) + '] id=' + e.id + ' title="' + e.title + '" instances=' + e.instances.length);
  });

  const allInstances = await prisma.eventInstance.findMany({
    select: { id: true, eventId: true, startTime: true, isCancelled: true }
  });
  console.log('\n(b) Total EventInstance records:', allInstances.length);
  if (allInstances.length > 0) {
    console.log('  Sample (first 10):');
    allInstances.slice(0, 10).forEach((inst, i) => {
      console.log('    [' + (i + 1) + '] id=' + inst.id + ' eventId=' + inst.eventId + ' startTime=' + inst.startTime);
    });
  }

  console.log('\n(c) Instance count per recurring event:');
  const eventIds = recurringEvents.map(e => e.id);
  const instanceCounts = await prisma.eventInstance.groupBy({
    by: ['eventId'],
    where: { eventId: { in: eventIds } },
    _count: { id: true }
  });
  instanceCounts.forEach(({ eventId, _count }) => {
    const ev = recurringEvents.find(e => e.id === eventId);
    console.log('  eventId=' + eventId + ' title="' + (ev ? ev.title : 'N/A') + '" instanceCount=' + _count.id);
  });
  if (eventIds.length > 0 && instanceCounts.length === 0) {
    console.log('  (No instances found for any recurring event)');
  }

  console.log('\n=== Summary ===');
  console.log('Recurring APPROVED events:', recurringEvents.length);
  console.log('Total EventInstance records:', allInstances.length);
  console.log('Instances being created:', allInstances.length > 0 ? 'YES' : 'NO');
}

diagnose()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());