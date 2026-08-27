import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function testInserts() {
  console.log('--- Testing Plan Insert ---');
  const plan = { name: `Test Plan ${Date.now()}`, duration: '1 Month', price: 1500, popular: false, features: ['Test'] };
  const resPlan = await supabase.from('plans').insert([plan]).select('*');
  console.log('Plan insert:', resPlan);

  console.log('--- Testing Trainer Insert ---');
  const trainer = { name: `Test Trainer ${Date.now()}`, specialization: 'Gym', experience: '5 yrs', salary: '30000', members: 10, rating: 5, avatar: 'TT' };
  const resTrainer = await supabase.from('trainers').insert([trainer]).select('*');
  console.log('Trainer insert:', resTrainer);

  console.log('--- Testing Expense Insert ---');
  const expense = { title: 'Test Expense', category: 'Equipment', amount: 500, vendor: 'Test Vendor', date: '27 Aug 2026', mode: 'Cash', status: 'Paid' };
  const resExpense = await supabase.from('expenses').insert([expense]).select('*');
  console.log('Expense insert:', resExpense);

  console.log('--- Testing Payment Insert ---');
  const payment = { invoice: `INV-${Date.now()}`, member: 'Test Member', amount: 2500, discount: 0, tax: 0, paid: 2500, balance: 0, mode: 'UPI', date: '27 Aug 2026' };
  const resPayment = await supabase.from('payments').insert([payment]).select('*');
  console.log('Payment insert:', resPayment);

  console.log('--- Testing Attendance Insert ---');
  const attendance = { id: `ATT-${Date.now()}`, name: 'Test Member', checkIn: '10:00 AM', checkOut: '11:00 AM', duration: '1h', date: '27 Aug 2026' };
  const resAttendance = await supabase.from('attendance').insert([attendance]).select('*');
  console.log('Attendance insert:', resAttendance);

  console.log('--- Testing User Insert ---');
  const user = { id: `usr-${Date.now()}`, name: 'Test User', email: `test${Date.now()}@example.com`, password: 'password123', role: 'Manager' };
  const resUser = await supabase.from('users').insert([user]).select('*');
  console.log('User insert:', resUser);
}

testInserts();
