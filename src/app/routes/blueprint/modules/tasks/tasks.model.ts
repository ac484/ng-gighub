import { Timestamp } from '@angular/fire/firestore';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  blueprintId: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt?: Date | null;
  description?: string;
  startAt?: Date | null;
  dueAt?: Date | null;
  progress?: number;
  parentId?: string | null;
}

export type TaskDocument = Omit<Task, 'id' | 'createdAt'> & {
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp | null;
  startAt?: Date | Timestamp | null;
  dueAt?: Date | Timestamp | null;
};
