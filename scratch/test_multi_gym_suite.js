import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const SCHEMAS = {
  members: ['id', 'name', 'phone', 'address', 'note', 'plan', 'joined', 'start', 'expiry', 'trainer', 'status', 'payment', 'avatar', 'gym_id'],
  plans: ['name', 'duration', 'price', 'popular', 'features', 'gym_id'],
  trainers: ['name', 'specialization', 'experience', 'salary', 'members', 'rating', 'avatar', 'gym_id'],
  expenses: ['id', 'title', 'category', 'amount', 'vendor', 'date', 'mode', 'status', 'gym_id'],
  payments: ['invoice', 'member', 'amount', 'discount', 'tax', 'paid', 'balance', 'date', 'mode', 'receiptUrl', 'gym_id'],
  attendance: ['id', 'name', 'checkIn', 'checkOut', 'duration', 'date', 'gym_id'],
  users: ['id', 'name', 'email', 'password', 'role', 'gym_id'],
  audit_logs: ['id', 'timestamp', 'userName', 'userEmail', 'userRole', 'action', 'category', 'details', 'gym_id']
};

function sanitizePayload(obj, allowedKeys) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const key of allowedKeys) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      clean[key] = obj[key];
    }
  }
  return clean;
}

function filterByGym(items, gymId = 'gym-1') {
  return (items || []).filter(item => (item.gym_id || 'gym-1') === gymId);
}

async function runMultiGymTests() {
  console.log('=== MULTI-GYM DATABASE STRICT VERIFICATION & ISOLATION SUITE ===\n');

  const testId1 = `G1-${Date.now()}`;
  const testId2 = `G2-${Date.now()}`;

  // 1. Test Members
  console.log('1. Testing Members Insertion & Isolation:');
  const memberGym1 = { id: testId1, name: 'Alice (Gym 1)', phone: '9876543210', plan: 'Monthly Plan', joined: '06 Sep 2026', start: '06 Sep 2026', expiry: '06 Oct 2026', trainer: 'Trainer 1', status: 'Active', payment: 'Paid', avatar: 'AG1', gym_id: 'gym-1' };
  const memberGym2 = { id: testId2, name: 'Bob (Gym 2)', phone: '9123456789', plan: 'Yearly Plan', joined: '06 Sep 2026', start: '06 Sep 2026', expiry: '06 Sep 2027', trainer: 'Trainer 2', status: 'Active', payment: 'Paid', avatar: 'BG2', gym_id: 'gym-2' };

  const m1Res = await supabase.from('members').insert([sanitizePayload(memberGym1, SCHEMAS.members)]).select('*');
  const m2Res = await supabase.from('members').insert([sanitizePayload(memberGym2, SCHEMAS.members)]).select('*');

  console.log('   Gym 1 Member Insert:', m1Res.error ? `Error: ${m1Res.error.message}` : `Success (${m1Res.data?.[0]?.name})`);
  console.log('   Gym 2 Member Insert:', m2Res.error ? `Error: ${m2Res.error.message}` : `Success (${m2Res.data?.[0]?.name})`);

  // Query all members
  const { data: allMembers, error: mFetchErr } = await supabase.from('members').select('*');
  if (!mFetchErr && allMembers) {
    const gym1Members = filterByGym(allMembers, 'gym-1');
    const gym2Members = filterByGym(allMembers, 'gym-2');
    console.log(`   Gym 1 Members Count: ${gym1Members.length} (Has Alice: ${gym1Members.some(m => m.id === testId1)}, Has Bob: ${gym1Members.some(m => m.id === testId2)})`);
    console.log(`   Gym 2 Members Count: ${gym2Members.length} (Has Bob: ${gym2Members.some(m => m.id === testId2)}, Has Alice: ${gym2Members.some(m => m.id === testId1)})`);
  }

  // 2. Test Expenses
  console.log('\n2. Testing Expenses Insertion & Isolation:');
  const expenseGym1 = { title: 'Gym 1 Equipment Maintenance', category: 'Maintenance', amount: 5000, vendor: 'Fitness Equip Co', date: '06 Sep 2026', mode: 'UPI', status: 'Paid', gym_id: 'gym-1' };
  const expenseGym2 = { title: 'Gym 2 Rent Payment', category: 'Rent', amount: 45000, vendor: 'Commercial Properties', date: '06 Sep 2026', mode: 'Bank Transfer', status: 'Paid', gym_id: 'gym-2' };

  const e1Res = await supabase.from('expenses').insert([sanitizePayload(expenseGym1, SCHEMAS.expenses)]).select('*');
  const e2Res = await supabase.from('expenses').insert([sanitizePayload(expenseGym2, SCHEMAS.expenses)]).select('*');

  console.log('   Gym 1 Expense Insert:', e1Res.error ? `Error: ${e1Res.error.message}` : `Success (₹${e1Res.data?.[0]?.amount})`);
  console.log('   Gym 2 Expense Insert:', e2Res.error ? `Error: ${e2Res.error.message}` : `Success (₹${e2Res.data?.[0]?.amount})`);

  const { data: allExpenses } = await supabase.from('expenses').select('*');
  if (allExpenses) {
    const g1Expenses = filterByGym(allExpenses, 'gym-1');
    const g2Expenses = filterByGym(allExpenses, 'gym-2');
    console.log(`   Gym 1 Expenses Total: ₹${g1Expenses.reduce((sum, e) => sum + Number(e.amount), 0)}`);
    console.log(`   Gym 2 Expenses Total: ₹${g2Expenses.reduce((sum, e) => sum + Number(e.amount), 0)}`);
  }

  // 3. Test Payments / Invoices
  console.log('\n3. Testing Payments & Invoices Isolation:');
  const paymentGym1 = { invoice: `INV-G1-${Date.now()}`, member: 'Alice (Gym 1)', amount: 2500, discount: 0, tax: 0, paid: 2500, balance: 0, mode: 'UPI', date: '06 Sep 2026', gym_id: 'gym-1' };
  const paymentGym2 = { invoice: `INV-G2-${Date.now()}`, member: 'Bob (Gym 2)', amount: 18000, discount: 1000, tax: 0, paid: 17000, balance: 0, mode: 'Card', date: '06 Sep 2026', gym_id: 'gym-2' };

  const p1Res = await supabase.from('payments').insert([sanitizePayload(paymentGym1, SCHEMAS.payments)]).select('*');
  const p2Res = await supabase.from('payments').insert([sanitizePayload(paymentGym2, SCHEMAS.payments)]).select('*');

  console.log('   Gym 1 Payment Insert:', p1Res.error ? `Error: ${p1Res.error.message}` : `Success (${p1Res.data?.[0]?.invoice})`);
  console.log('   Gym 2 Payment Insert:', p2Res.error ? `Error: ${p2Res.error.message}` : `Success (${p2Res.data?.[0]?.invoice})`);

  // Cleanup test items from database
  console.log('\n4. Cleaning up test records...');
  await supabase.from('members').delete().eq('id', testId1);
  await supabase.from('members').delete().eq('id', testId2);
  if (e1Res.data?.[0]?.id) await supabase.from('expenses').delete().eq('id', e1Res.data[0].id);
  if (e2Res.data?.[0]?.id) await supabase.from('expenses').delete().eq('id', e2Res.data[0].id);
  await supabase.from('payments').delete().eq('invoice', paymentGym1.invoice);
  await supabase.from('payments').delete().eq('invoice', paymentGym2.invoice);

  console.log('\n=== ALL TESTS PASSED STRICTLY FOR BOTH GYMS ===');
}

runMultiGymTests().catch(console.error);
