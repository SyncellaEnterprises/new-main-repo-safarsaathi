export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'regional' | 'observance';
  region?: string;
}

export interface TravelPlan {
  id: string;
  startDate: string;
  endDate: string;
  destination?: string;
  notes?: string;
  totalDays: number;
  includesWeekend: boolean;
  includesHolidays: Holiday[];
}

export interface TravelSuggestion {
  id: string;
  dates: {
    start: string;
    end: string;
  };
  totalDays: number;
  holidays: Holiday[];
  weekends: number;
  description: string;
} 