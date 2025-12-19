import { Timestamp } from '@angular/fire/firestore';

export type AgreementStatus = 'draft' | 'active' | 'expired';

export interface Agreement {
  id: string;
  blueprintId: string;
  title: string;
  counterparty: string;
  status: AgreementStatus;
  effectiveDate: Date;
  value?: number;
}

export type AgreementDocument = Omit<Agreement, 'effectiveDate'> & {
  effectiveDate: Date | Timestamp;
};
