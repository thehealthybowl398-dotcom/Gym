import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

function sanitizePayload(obj, allowedKeys) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const key of allowedKeys) {
    if (key in obj && obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  }
  return clean;
}

const SCHEMAS = {
  members: ['id', 'name', 'phone', 'plan', 'joined', 'start', 'expiry', 'trainer', 'status', 'payment', 'avatar'],
  plans: ['name', 'duration', 'price', 'popular', 'features'],
  trainers: ['name', 'specialization', 'experience', 'salary', 'members', 'rating', 'avatar'],
  expenses: ['id', 'title', 'category', 'amount', 'vendor', 'date', 'mode', 'status'],
  payments: ['invoice', 'member', 'amount', 'discount', 'tax', 'paid', 'balance', 'date', 'mode', 'receiptUrl'],
  attendance: ['id', 'name', 'checkIn', 'checkOut', 'duration', 'date'],
  users: ['id', 'name', 'email', 'password', 'role'],
  audit_logs: ['id', 'timestamp', 'userName', 'userEmail', 'userRole', 'action', 'category', 'details']
};

async function testSuite() {
  console.log('--- Testing Member add/update/delete ---');
  const m = { id: `GM-${Date.now()}`, name: 'Suite Member', phone: '999', address: 'Extra', note: 'Extra', plan: 'Monthly Plan', joined: '27 Aug', start: '27 Aug', expiry: '27 Sep', trainer: 'General', status: 'Active', payment: 'Paid', avatar: 'SM' };
  const mAdd = await supabase.from('members').insert([sanitizePayload(m, SCHEMAS.members)]).select('*');
  console.log('Member add:', mAdd.error ? mAdd.error : 'OK');
  const mUp = await supabase.from('members').update(sanitizePayload({...m, name: 'Suite Member Updated'}, SCHEMAS.members)).eq('id', m.id).select('*');
  console.log('Member update:', mUp.error ? mUp.error : 'OK');
  const mDel = await supabase.from('members').delete().eq('id', m.id);
  console.log('Member delete:', mDel.error ? mDel.error : 'OK');

  console.log('--- Testing Expense add/update/delete ---');
  const e = { title: 'Suite Expense', category: 'Rent', amount: 1000, vendor: 'Landlord', date: '27 Aug 2026', mode: 'UPI', status: 'Paid' };
  const eAdd = await supabase.from('expenses').insert([sanitizePayload(e, SCHEMAS.expenses)]).select('*');
  console.log('Expense add:', eAdd.error ? eAdd.error : `OK, ID: ${eAdd.data?.[0]?.id}`);
  if (eAdd.data?.[0]?.id) {
    const eId = eAdd.data[0].id;
    const eUp = await supabase.from('expenses').update(sanitizePayload({ title: 'Suite Expense Upd', amount: 1200 }, SCHEMAS.expenses)).eq('id', eId).select('*');
    console.log('Expense update:', eUp.error ? eUp.error : 'OK');
    const eDel = await supabase.from('expenses').delete().eq('id', eId);
    console.log('Expense delete:', eDel.error ? eDel.error : 'OK');
  }

  console.log('--- Suite finished successfully ---');
}

testSuite();
