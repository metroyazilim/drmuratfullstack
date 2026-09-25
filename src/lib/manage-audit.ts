import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';

export type AuditEntryView = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorEmail: string;
  summary: string | null;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
};

const SENSITIVE_KEYS: Record<string, true> = {
  password: true,
  passwordhash: true,
  smtppassword: true,
  token: true,
  secret: true,
  authorization: true,
  cookie: true,
};

function sanitizeMetadata(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    sanitized[k] = SENSITIVE_KEYS[k.toLowerCase()] ? '[GİZLENDİ]' : sanitizeMetadata(v);
  }
  return sanitized;
}

export async function getRecentAuditEntries(take = 50): Promise<AuditEntryView[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      actorEmail: true,
      summary: true,
      createdAt: true,
      metadata: true,
    },
  });
  return rows.map((row) => ({
    ...row,
    metadata: sanitizeMetadata(row.metadata) as Prisma.JsonValue | null,
  }));
}
