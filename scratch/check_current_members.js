import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function checkMembers() {
  const { data, error } = await supabase.from('members').select('*');
  console.log('Current members in Supabase:', { data, error });
}

checkMembers();
