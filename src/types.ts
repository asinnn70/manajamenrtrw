export interface Resident {
  id: number;
  name: string;
  nik: string;
  address: string;
  rt: string;
  rw: string;
  status: string;
  phone: string;
  gender: string;
  maritalStatus: string;
  familyRelationship: string;
  familyCardNumber?: string;
}

export interface Mutation {
  id: number;
  residentId: number;
  type: 'Pindah' | 'Meninggal';
  date: string;
  details?: string;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  category: string;
}

export interface FinanceData {
  month: string;
  income: number;
  expense: number;
}

export interface Letter {
  id: number;
  type: string;
  resident: string;
  date: string;
  status: string;
  content?: string;
}

export interface Announcement {
  id: number;
  title: string;
  date: string;
  content: string;
}
