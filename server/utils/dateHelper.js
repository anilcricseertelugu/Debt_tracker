/**
 * Adds a specific number of months to a date, handling end-of-month rollover.
 * Validates against day overflow (e.g., Jan 30 -> Feb 28).
 * 
 * @param {Date|string} dateInput - The starting date
 * @param {number} months - Number of months to add
 * @returns {Date} - New Date object
 */
const addMonths = (dateInput, months) => {
    const date = new Date(dateInput);

    // Explicit Math Implementation to avoid Date.setMonth() quirks
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    const currentDay = date.getDate();

    const totalMonths = currentMonth + months;

    // Calculate new year and month
    const yearDelta = Math.floor(totalMonths / 12);
    const newYear = currentYear + yearDelta;
    const newMonthIndex = ((totalMonths % 12) + 12) % 12; // Handle negative months safely

    // Determine days in the target month
    // Day 0 of (Month + 1) gives the last day of Month
    const daysInTargetMonth = new Date(newYear, newMonthIndex + 1, 0).getDate();

    // Clamp the day (e.g., if Jan 31 -> Feb has 28 days, use 28)
    const newDay = Math.min(currentDay, daysInTargetMonth);

    // Construct Result Atomically
    // preserving time from original date
    const resultDate = new Date(
        newYear,
        newMonthIndex,
        newDay,
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    );

    return resultDate;
};

module.exports = { addMonths };
