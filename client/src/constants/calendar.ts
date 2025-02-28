// Helper function to generate a list of all dates between two dates
const generateDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  while (start <= end) {
    dates.push(start.toISOString().split('T')[0]); // Get date in "YYYY-MM-DD" format
    start.setDate(start.getDate() + 1); // Move to the next day
  }

  return dates;
};

// List of special dates to mark on the calendar (e.g., holidays, important dates, etc.)
export const SPECIAL_DATES = [
  '2025-01-30', // Example: Mark January 30th
  '2025-02-14', // Example: Mark February 14th (e.g., Valentine's Day)
  '2025-03-01', // Another special date
  ...generateDateRange('2025-03-28', '2025-03-30'), // Trip 1: March 28-30 (Fri-Sun)
  ...generateDateRange('2025-04-11', '2025-04-14'), // Trip 2: April 11-14 (Fri-Mon)
  ...generateDateRange('2025-04-30', '2025-05-03'), // Trip 3: April 30 to May 3 (Thu-Sat)
  ...generateDateRange('2025-06-13', '2025-06-16'), // Trip 4: June 13-16 (Fri-Mon)
  ...generateDateRange('2025-08-15', '2025-08-17'), // Trip 5: August 15-17 (Fri-Sun)
  ...generateDateRange('2025-08-19', '2025-08-22'), // Trip 6: August 19-22 (Tue-Fri)
  ...generateDateRange('2025-10-02', '2025-10-04'), // Trip 7: October 2-4 (Thu-Sat)
  ...generateDateRange('2025-10-03', '2025-10-05'), // Trip 8: October 3-5 (Fri-Sun)
  ...generateDateRange('2025-10-21', '2025-10-24'), // Trip 9: October 21-24 (Tue-Fri)
  ...generateDateRange('2025-10-16', '2025-10-18'), // Trip 10: October 16-18 (Thu-Sat)
  ...generateDateRange('2025-11-14', '2025-11-16'), // Trip 11: November 14-16 (Fri-Sun)
  ...generateDateRange('2025-11-27', '2025-11-29'), // Trip 12: November 27-29 (Thu-Sat)
  ...generateDateRange('2025-12-25', '2025-12-27'), // Trip 13: December 25-27 (Thu-Sat)
];

// Example of holidays (You can replace this with real data or mock data)
export const MOCK_HOLIDAYS = [
  { date: '2025-12-25', name: 'Christmas Day' },
  { date: '2025-01-01', name: 'New Year\'s Day' },
  { date: '2025-04-11', name: 'Sick Leave (April 11)' },
  { date: '2025-05-02', name: 'Sick Leave (May 2)' },
  { date: '2025-08-22', name: 'Sick Leave (August 22)' },
  { date: '2025-10-17', name: 'Sick Leave (October 17)' },
  { date: '2025-10-24', name: 'Sick Leave (October 24)' },
  { date: '2025-11-28', name: 'Sick Leave (November 28)' },
  { date: '2025-12-26', name: 'Sick Leave (December 26)' },
  // Add more holidays here as needed
];

export const MOCK_SUGGESTIONS = [
  {
    id: '1',
    totalDays: 3,
    weekends: 2,
    leavesRequired: 0,
    description: 'No leave needed (Natural long weekend)',
    dates: { start: '2025-03-28', end: '2025-03-30' },
    holidays: [{ date: '2025-03-28', name: 'March 28-30 (Fri-Sun)' }],
  },
  {
    id: '2',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on April 11 (Friday)',
    dates: { start: '2025-04-11', end: '2025-04-14' },
    holidays: [{ date: '2025-04-11', name: 'Sick Leave (April 11)' }],
  },
  {
    id: '3',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on May 2 (Friday)',
    dates: { start: '2025-04-30', end: '2025-05-03' },
    holidays: [{ date: '2025-05-02', name: 'Sick Leave (May 2)' }],
  },
  {
    id: '4',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on June 13 (Friday)',
    dates: { start: '2025-06-13', end: '2025-06-16' },
    holidays: [{ date: '2025-06-13', name: 'Sick Leave (June 13)' }],
  },
  {
    id: '5',
    totalDays: 3,
    weekends: 2,
    leavesRequired: 0,
    description: 'No leave needed (Natural long weekend)',
    dates: { start: '2025-08-15', end: '2025-08-17' },
    holidays: [{ date: '2025-08-15', name: 'August 15-17 (Fri-Sun)' }],
  },
  {
    id: '6',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on August 22 (Friday)',
    dates: { start: '2025-08-19', end: '2025-08-22' },
    holidays: [{ date: '2025-08-22', name: 'Sick Leave (August 22)' }],
  },
  {
    id: '7',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on October 3 (Friday)',
    dates: { start: '2025-10-02', end: '2025-10-04' },
    holidays: [{ date: '2025-10-03', name: 'Sick Leave (October 3)' }],
  },
  {
    id: '8',
    totalDays: 3,
    weekends: 2,
    leavesRequired: 0,
    description: 'No leave needed (Natural long weekend)',
    dates: { start: '2025-10-03', end: '2025-10-05' },
    holidays: [{ date: '2025-10-03', name: 'October 3-5 (Fri-Sun)' }],
  },
  {
    id: '9',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on October 24 (Friday)',
    dates: { start: '2025-10-21', end: '2025-10-24' },
    holidays: [{ date: '2025-10-24', name: 'Sick Leave (October 24)' }],
  },
  {
    id: '10',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on October 17 (Friday)',
    dates: { start: '2025-10-16', end: '2025-10-18' },
    holidays: [{ date: '2025-10-17', name: 'Sick Leave (October 17)' }],
  },
  {
    id: '11',
    totalDays: 3,
    weekends: 2,
    leavesRequired: 0,
    description: 'No leave needed (Natural long weekend)',
    dates: { start: '2025-11-14', end: '2025-11-16' },
    holidays: [{ date: '2025-11-14', name: 'November 14-16 (Fri-Sun)' }],
  },
  {
    id: '12',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on November 28 (Friday)',
    dates: { start: '2025-11-27', end: '2025-11-29' },
    holidays: [{ date: '2025-11-28', name: 'Sick Leave (November 28)' }],
  },
  {
    id: '13',
    totalDays: 4,
    weekends: 1,
    leavesRequired: 1,
    description: '1 sick leave on December 26 (Friday)',
    dates: { start: '2025-12-25', end: '2025-12-27' },
    holidays: [{ date: '2025-12-26', name: 'Sick Leave (December 26)' }],
  },
];
