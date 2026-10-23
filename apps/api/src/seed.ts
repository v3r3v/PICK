import { resolve } from 'node:path';
import { scenarios, type Scenario } from '@pick/contracts';
import { SqliteStore } from './store.ts';
const scenario = process.argv[2] || 'normal';
if (!scenarios.some(s => s.id === scenario)) throw new Error('Use normal, before-release, at-home or pending.');
const store = new SqliteStore(resolve(process.env.PICK_DB_PATH || '.local/pick.sqlite'));
store.reset(scenario as Scenario); store.close();
console.log(`Reset shared synthetic data: ${scenario}. All demo sessions invalidated. Choose an account again.`);
