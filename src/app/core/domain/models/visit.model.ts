export type VisitReason = 'visitante' | 'proveedor' | 'servicios' | 'otros';

export type IdentificationType = 'ine' | 'pasaporte' | 'licencia';

export interface CreateVisitRequest {
  visitorName: string;
  identificationType: IdentificationType;
  reason: VisitReason;
  entryOpenSchedule: boolean;
  exitOpenSchedule: boolean;
  entryAt?: string | null;
  exitAt?: string | null;
  description?: string;
}

export interface VisitResponse {
  id: string;
  visitorName: string;
  identificationType: IdentificationType;
  reason: VisitReason;
  entryOpenSchedule: boolean;
  exitOpenSchedule: boolean;
  entryAt: string | null;
  exitAt: string | null;
  description: string | null;
  street: string;
  number: string;
  letter: string | null;
  status: string;
  createdAt: string;
  /** Presente cuando un vigilante registró la entrada (solo en listado de bitácora). */
  scannedByEntryId?: string;
  /** Presente cuando un vigilante registró la salida (solo en listado de bitácora). */
  scannedByExitId?: string;
  /** Comentario o incidencia al registrar la salida (opcional). */
  exitComment?: string | null;
}

export const VISIT_REASON_OPTIONS: { value: VisitReason; label: string }[] = [
  { value: 'visitante', label: 'Visitante' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'otros', label: 'Otros' },
];

export const IDENTIFICATION_TYPE_OPTIONS: { value: IdentificationType; label: string }[] = [
  { value: 'ine', label: 'INE' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'licencia', label: 'Licencia' },
];
