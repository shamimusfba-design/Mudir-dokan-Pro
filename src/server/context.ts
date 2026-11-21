import { eq } from 'drizzle-orm';
import type { Response } from 'express';
import { db } from '../db/index.ts';
import { users, stores, storeSettings, auditLogs } from '../db/schema.ts';
import { provisionStoreForUser } from '../db/seed.ts';
import type { AuthRequest } from '../middleware/auth.ts';

export interface ResolvedStoreContext {
  uid: string;
  email: string;
  userName: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER';
  storeId: number;
  store: typeof stores.$inferSelect;
  settings: typeof storeSettings.$inferSelect;
}

export async function resolveUserStore(req: AuthRequest): Promise<ResolvedStoreContext> {
  if (!req.user?.uid) {
    throw new Error('Authentication required');
  }
  const uid = req.user.uid;
  const email = req.user.email || `${uid}@mudirdokan.local`;
  const displayName = req.user.name || email.split('@')[0] || 'Shop Owner';

  // Safe concurrent upsert of Firebase user into PostgreSQL
  let [userRow] = await db
    .insert(users)
    .values({
      uid,
      email,
      name: displayName,
      role: 'OWNER',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        updatedAt: new Date(),
      },
    })
    .returning();

  let storeId = userRow.storeId;
  if (!storeId) {
    storeId = await provisionStoreForUser(uid, displayName);
    const [updated] = await db
      .update(users)
      .set({ storeId, updatedAt: new Date() })
      .where(eq(users.uid, uid))
      .returning();
    if (updated) userRow = updated;
  }

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  let [settings] = await db.select().from(storeSettings).where(eq(storeSettings.storeId, storeId)).limit(1);

  if (!settings) {
    [settings] = await db
      .insert(storeSettings)
      .values({ storeId })
      .onConflictDoNothing()
      .returning();
    if (!settings) {
      [settings] = await db.select().from(storeSettings).where(eq(storeSettings.storeId, storeId)).limit(1);
    }
  }

  const role = (userRow.role as 'OWNER' | 'MANAGER' | 'CASHIER') || 'OWNER';

  return {
    uid,
    email: userRow.email,
    userName: userRow.name,
    role,
    storeId,
    store,
    settings,
  };
}

export async function logAudit(
  storeId: number,
  actorUid: string,
  action: string,
  entityType: string,
  entityId: number | null,
  details: string
) {
  try {
    await db.insert(auditLogs).values({
      storeId,
      actorUid,
      action,
      entityType,
      entityId,
      details,
    });
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}

export function handleApiError(res: Response, error: unknown, fallbackMessage: string) {
  console.error(fallbackMessage, error);
  if (error instanceof Error) {
    const status = (error as { statusCode?: number }).statusCode || 400;
    if (status >= 400 && status < 500) {
      return res.status(status).json({ error: error.message });
    }
  }
  return res.status(500).json({ error: fallbackMessage });
}

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
