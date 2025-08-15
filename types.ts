export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  creatorId?: string;
  creatorName?: string;
  entryTimestamp?: string;
}

export interface Book {
  id: string;
  name: string;
  transactions: Transaction[];
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Member';
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
}

export interface Business {
  id:string;
  name: string;
  books: Book[];
  team: TeamMember[];
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark'
}

export type AppView = 'dashboard' | 'reports' | 'settings' | 'users' | 'transactions' | 'book-settings';

export type Currency = 'USD' | 'EUR' | 'JPY' | 'GBP' | 'CAD' | 'AUD' | 'SOS' | 'ETB' | 'INR';

export type EnrichedTransaction = Transaction & { bookId: string; };

export type SearchFilters = {
    text?: string;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    minAmount?: number;
    maxAmount?: number;
};