// types/index.ts

export type TicketStatus = 'REVISIÓN' | 'APROBADO' | 'DENEGADO';
export type TicketType = 'ALTA' | 'BAJA';

export interface Ticket {
  id: string;
  studentName: string;
  studentId: string;
  subjectName: string;
  type: TicketType;
  status: TicketStatus;
  reason: string;
  documentUrl: string;
  createdAt: string;
}