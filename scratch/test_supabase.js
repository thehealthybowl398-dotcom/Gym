import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function test() {
  console.log('Testing members table...');
  const { data, error } = await supabase.from('members').select('*');
  console.log('Members result:', { data, error });

  console.log('Testing inserting a dummy member...');
  const { data: insData, error: insError } = await supabase.from('members').insert([{
    id: `TEST-${Date.now()}`,
    name: 'Test User',
    phone: '1234567890',
    plan: 'Monthly Plan',
    joined: '01 Aug 2026',
    start: '01 Aug 2026',
    expiry: '01 Sep 2026',
    trainer: 'General',
    status: 'Active',
    payment: 'Paid',
    avatar: 'TU'
  }]).select('*');
  console.log('Insert result:', { insData, insError });
}

test();
