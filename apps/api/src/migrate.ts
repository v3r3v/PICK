import {resolve} from 'node:path';
import {SqliteStore} from './store.ts';
const store=new SqliteStore(resolve(process.env.PICK_DB_PATH||'.local/pick.sqlite'));
const backup=resolve(`.local/before-queue-${Date.now()}.sqlite`);
store.db.prepare('VACUUM INTO ?').run(backup);
console.log('Private local backup:',backup);
console.log(store.migrateQueue());store.close();
