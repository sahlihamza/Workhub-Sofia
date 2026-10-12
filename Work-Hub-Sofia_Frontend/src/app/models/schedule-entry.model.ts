export interface ScheduleEntry {
  id?: number;
  date: string;
  status: 'present' | 'remote' | 'holiday';
  notes?: string;
  user?: any;
}
