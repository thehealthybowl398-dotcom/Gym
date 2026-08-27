import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const tables = ['members', 'plans', 'trainers', 'expenses', 'payments', 'attendance', 'users', 'audit_logs'];

async function checkSchemas() {
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} error:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Table ${table} keys:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${table} is empty.`);
    }
  }
}

checkSchemas();
