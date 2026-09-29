import type { AuditLog } from '../types';
import { INITIAL_AUDIT_LOGS } from '../data';

const timestampFormatter = new Intl.DateTimeFormat('es-EC', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Guayaquil'
});

export function createAuditLogger(initialLogs: AuditLog[] = INITIAL_AUDIT_LOGS) {
  const logs = [...initialLogs];
  return {
    logs,
    add(log: Omit<AuditLog, 'id' | 'timestamp'>) {
      const entry: AuditLog = {
        ...log,
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: timestampFormatter.format(new Date())
      };
      logs.unshift(entry);
      return entry;
    }
  };
}
