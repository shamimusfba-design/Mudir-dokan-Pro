import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.ts';
import { users, stores } from '../src/db/schema.ts';
import { loadDemoData, resetDemoData, verifyDemoReconciliation } from '../src/db/demo-seed.ts';

async function main() {
  const action = (process.argv[2] || 'load').toLowerCase();
  const explicitStoreId = process.argv[3] ? Number(process.argv[3]) : null;

  let storeId = explicitStoreId;
  let actorUid = 'system-demo-seed';

  if (!storeId) {
    const [activeUser] = await db.select().from(users).limit(1);
    if (activeUser && activeUser.storeId) {
      storeId = activeUser.storeId;
      actorUid = activeUser.uid;
    } else {
      const [firstStore] = await db.select().from(stores).limit(1);
      if (!firstStore) {
        console.error('No store found in database.');
        process.exit(1);
      }
      storeId = firstStore.id;
      actorUid = firstStore.ownerUid;
    }
  } else {
    const [st] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (st) actorUid = st.ownerUid;
  }

  console.log(`[Demo Seed CLI] Action=${action} StoreId=${storeId} Actor=${actorUid}`);

  if (action === 'reset') {
    const res = await resetDemoData(storeId);
    console.log('[Demo Seed CLI] Reset complete:', res);
    process.exit(0);
  }

  if (action === 'verify') {
    const report = await verifyDemoReconciliation(storeId);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.allPassed ? 0 : 1);
  }

  const t0 = Date.now();
  const summary = await loadDemoData(storeId, actorUid);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`[Demo Seed CLI] Loaded 6-month dataset in ${elapsed}s!`);
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.reconciliation.allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('[Demo Seed CLI] Error:', err);
  process.exit(1);
});
