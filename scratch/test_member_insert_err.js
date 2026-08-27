import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function testMemberInsertWithAddress() {
  const memberWithAddress = {
    id: `GM-${Math.floor(1000 + Math.random() * 9000)}`,
    name: 'Test Member With Address',
    phone: '+91 99999 88888',
    address: '123 Test St',
    note: 'Test Note',
    plan: 'Monthly Plan',
    joined: '27 Aug 2026',
    start: '27 Aug 2026',
    expiry: '27 Sep 2026',
    trainer: 'General',
    status: 'Active',
    payment: 'Paid',
    avatar: 'TM'
  };

  const { data, error } = await supabase.from('members').insert([memberWithAddress]).select('*');
  console.log('Insert result:', { data, error });
}

testMemberInsertWithAddress();
