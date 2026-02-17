export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationRequestUser {
  id: string;
  phone: string;
}

export interface RegistrationRequestItem {
  id: string;
  userId: string;
  street: string;
  number: string;
  letter: string | null;
  status: RegistrationStatus;
  createdAt: string;
  user: RegistrationRequestUser;
}

/** Item de la bitácora: registros ya aprobados o rechazados. */
export interface RegistrationRequestHistoryItem extends RegistrationRequestItem {
  updatedAt: string;
  validatedBy: RegistrationRequestUser | null;
}

export type UpdateStatusPayload = { status: 'approved' | 'rejected' };
