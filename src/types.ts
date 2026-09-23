export interface LessonEntry {
  id?: string;
  date: string;
  plan: string;
  done: boolean;
  grade: string;
  note: string;
}

export interface TabData {
  text: string;
  entries: LessonEntry[];
}

export interface PlannerData {
  tabs: string[];
  rows: Record<number, TabData>;
}

export type ColumnKey = 'date' | 'plan' | 'done' | 'grade' | 'note';

export interface Snapshot {
  timestamp: number;
  label: string;
  data: PlannerData;
}
