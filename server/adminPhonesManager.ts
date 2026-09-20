import fs from 'fs';
import path from 'path';
import type { PhoneSpecs } from '../src/data/phones.ts';

const ADMIN_PHONES_FILE = path.join(process.cwd(), 'src', 'data', 'adminPhones.json');

export function loadAdminPhones(): PhoneSpecs[] {
  try {
    if (fs.existsSync(ADMIN_PHONES_FILE)) {
      const data = fs.readFileSync(ADMIN_PHONES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to read adminPhones.json:', error);
  }
  return [];
}

export function saveAdminPhones(phones: PhoneSpecs[]): void {
  try {
    const dir = path.dirname(ADMIN_PHONES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ADMIN_PHONES_FILE, JSON.stringify(phones, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write adminPhones.json:', error);
  }
}
