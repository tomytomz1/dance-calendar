const {
  addDays,
  addWeeks,
  addMonths,
  endOfMonth,
  startOfMonth,
  isAfter,
  differenceInMinutes,
} = require("date-fns");

function generateRecurrenceInstances(startTime, endTime, config, maxInstances = 52) {
  const instances = [];
  const durationMinutes = differenceInMinutes(endTime, startTime);

  let currentStart = new Date(startTime);
  let instanceCount = 0;

  const hasValidUntil = config.until && isAfter(config.until, startTime);
  const maxDate = hasValidUntil ? config.until : addMonths(startTime, 12);
  const maxCount = config.count || maxInstances;

  // Basic MONTHLY BY_WEEKDAY support is not required for the current scripts,
  // so we keep the helper focused on frequencies and until/count semantics.

  while (instanceCount < maxCount && isAfter(maxDate, currentStart)) {
    if (config.frequency === "WEEKLY" && config.daysOfWeek && config.daysOfWeek.length) {
      const dayOfWeek = currentStart.getDay();
      if (config.daysOfWeek.includes(dayOfWeek)) {
        instances.push({
          startTime: new Date(currentStart),
          endTime: new Date(currentStart.getTime() + durationMinutes * 60 * 1000),
        });
        instanceCount++;
      }
      currentStart = addDays(currentStart, 1);
    } else {
      instances.push({
        startTime: new Date(currentStart),
        endTime: new Date(currentStart.getTime() + durationMinutes * 60 * 1000),
      });
      instanceCount++;

      switch (config.frequency) {
        case "DAILY":
          currentStart = addDays(currentStart, config.interval);
          break;
        case "WEEKLY":
          currentStart = addWeeks(currentStart, config.interval);
          break;
        case "BIWEEKLY":
          currentStart = addWeeks(currentStart, 2 * config.interval);
          break;
        case "MONTHLY":
          currentStart = addMonths(currentStart, config.interval);
          break;
        default:
          currentStart = addDays(currentStart, 1);
      }
    }
  }

  return instances;
}

module.exports = {
  generateRecurrenceInstances,
};

