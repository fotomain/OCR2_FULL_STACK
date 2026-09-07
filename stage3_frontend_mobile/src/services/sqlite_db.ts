/**
 * SQLite Database Service for Multi-User Management and Scan Records
 * Powered by expo-sqlite with cross-platform fallback
 */
import { Platform } from 'react-native';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  auth_provider: string;
  created_at: string;
}

export interface ScanRecord {
  id: string;
  user_email: string;
  filename: string;
  document_type: string;
  confidence: number;
  total_amount?: number;
  currency: string;
  raw_json: string;
  created_at: string;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_1',
    email: 'executive.officer@nexus-biomed.org',
    name: 'Executive Officer',
    role: 'Corporate Approver',
    auth_provider: 'GOOGLE_OAUTH_2.0',
    created_at: new Date().toISOString()
  },
  {
    id: 'user_2',
    email: 'chief.radiologist@hospital.org',
    name: 'Dr. Evelyn Vance',
    role: 'Chief Radiologist',
    auth_provider: 'GOOGLE_OAUTH_2.0',
    created_at: new Date().toISOString()
  },
  {
    id: 'user_3',
    email: 'auditor.lead@global-compliance.com',
    name: 'Marcus Brody',
    role: 'Senior Compliance Auditor',
    auth_provider: 'EXPO_AUTH_SESSION',
    created_at: new Date().toISOString()
  }
];

class SQLiteStorageService {
  private users: UserAccount[] = [...DEFAULT_USERS];
  private scans: ScanRecord[] = [];
  private db: any = null;

  async initDatabase(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        const SQLite = require('expo-sqlite');
        this.db = await SQLite.openDatabaseAsync('ocr2_enterprise.db');
        await this.db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            name TEXT,
            role TEXT,
            auth_provider TEXT,
            created_at TEXT
          );
          CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            user_email TEXT,
            filename TEXT,
            document_type TEXT,
            confidence REAL,
            total_amount REAL,
            currency TEXT,
            raw_json TEXT,
            created_at TEXT
          );
        `);
        // Seed users if empty
        const countRes = await this.db.getFirstAsync('SELECT count(*) as count FROM users');
        if (countRes && countRes.count === 0) {
          for (const u of DEFAULT_USERS) {
            await this.db.runAsync(
              'INSERT INTO users (id, email, name, role, auth_provider, created_at) VALUES (?, ?, ?, ?, ?, ?)',
              [u.id, u.email, u.name, u.role, u.auth_provider, u.created_at]
            );
          }
        }
      }
    } catch (e) {
      console.warn('SQLite native initialization note (using in-memory store):', e);
    }
  }

  async getAllUsers(): Promise<UserAccount[]> {
    try {
      if (this.db && Platform.OS !== 'web') {
        const rows = await this.db.getAllAsync('SELECT * FROM users ORDER BY created_at ASC');
        return rows as UserAccount[];
      }
    } catch (e) {
      console.warn('Fallback users query:', e);
    }
    return this.users;
  }

  async addUser(email: string, name: string, role = 'Executive', provider = 'GOOGLE_OAUTH_2.0'): Promise<UserAccount> {
    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      email,
      name,
      role,
      auth_provider: provider,
      created_at: new Date().toISOString()
    };
    try {
      if (this.db && Platform.OS !== 'web') {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO users (id, email, name, role, auth_provider, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [newUser.id, newUser.email, newUser.name, newUser.role, newUser.auth_provider, newUser.created_at]
        );
      }
    } catch (e) {
      console.warn('Fallback user insert:', e);
    }
    this.users.push(newUser);
    return newUser;
  }

  async saveScanRecord(scan: Omit<ScanRecord, 'id' | 'created_at'>): Promise<ScanRecord> {
    const record: ScanRecord = {
      id: `scan_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...scan
    };
    try {
      if (this.db && Platform.OS !== 'web') {
        await this.db.runAsync(
          'INSERT INTO scans (id, user_email, filename, document_type, confidence, total_amount, currency, raw_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [record.id, record.user_email, record.filename, record.document_type, record.confidence, record.total_amount || 0, record.currency, record.raw_json, record.created_at]
        );
      }
    } catch (e) {
      console.warn('Fallback scan record insert:', e);
    }
    this.scans.unshift(record);
    return record;
  }

  async getScansForUser(userEmail: string): Promise<ScanRecord[]> {
    try {
      if (this.db && Platform.OS !== 'web') {
        const rows = await this.db.getAllAsync(
          'SELECT * FROM scans WHERE user_email = ? ORDER BY created_at DESC',
          [userEmail]
        );
        return rows as ScanRecord[];
      }
    } catch (e) {
      console.warn('Fallback scans query:', e);
    }
    return this.scans.filter(s => s.user_email === userEmail);
  }
}

export const sqliteService = new SQLiteStorageService();
