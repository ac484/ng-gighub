import { Timestamp } from '@angular/fire/firestore';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  blueprintId: string;
  title: string;
  status: TaskStatus;
  createdAt: Date;
}

export type TaskDocument = Omit<Task, 'id' | 'createdAt'> & {
  createdAt: Date | Timestamp;
};
