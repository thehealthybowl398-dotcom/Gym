import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const tables = ['members', 'plans', 'trainers', 'expenses', 'payments', 'attendance', 'users', 'audit_logs'];

async function testAllTables() {
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    console.log(`Table '${table}':`, { count: data?.length, error: error?.message || null });
  }
}

testAllTables();
