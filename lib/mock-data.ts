// lib/mock-data.ts
import { Ticket } from '@/types';

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TCK-001',
    studentName: 'Carlos Mendoza',
    studentId: '2021640123',
    subjectName: 'Estructura de Datos',
    type: 'BAJA',
    status: 'REVISIÓN',
    reason: 'Empalme de horario con materia obligatoria.',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-10-01'
  },
  {
    id: 'TCK-002',
    studentName: 'Ana Sofía Torres',
    studentId: '2021640456',
    subjectName: 'Bases de Datos Avanzadas',
    type: 'ALTA',
    status: 'APROBADO',
    reason: 'Prerrequisito cubierto en periodo de verano.',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-09-28'
  }
];