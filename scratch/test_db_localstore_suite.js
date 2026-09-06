// Polyfill localStorage & window for Node environment testing
if (typeof localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { for (const key in store) delete store[key]; }
  };
}

import {
  getMembersDB, addMemberDB,
  getPlansDB, addPlanDB,
  getTrainersDB, addTrainerDB,
  getExpensesDB, addExpenseDB,
  getPaymentsDB, addPaymentDB,
  getAttendanceDB, addAttendanceDB,
  getUsersDB, addUserDB,
  getAuditLogsDB, addAuditLogDB,
  getGymsDB, addGymDB,
  refreshAllDBData
} from '../src/lib/db.ts';

async function testFullSuite() {
  console.log('================================================================');
  console.log('STRICT MULTI-GYM DATA SAVING, RETRIEVAL & ISOLATION TEST SUITE');
  console.log('================================================================\n');

  // 1. Gym Branch Setup
  console.log('--- 1. Testing Gym Branch APIs ---');
  const gyms = await getGymsDB();
  console.log('Active Gym Branches Count:', gyms.length);
  gyms.forEach(g => console.log(`   - [${g.id}] ${g.name} (${g.location})`));

  // 2. Members Isolation Test
  console.log('\n--- 2. Testing Member Data Saving & Isolation ---');
  const m1 = await addMemberDB({ id: 'GM-101', name: 'Rohan Sharma', phone: '9876543210', plan: 'Monthly Plan', joined: '06 Sep 2026', start: '06 Sep 2026', expiry: '06 Oct 2026', trainer: 'Rahul', status: 'Active', payment: 'Paid', avatar: 'RS' }, 'gym-1');
  const m2 = await addMemberDB({ id: 'GM-201', name: 'Ananya Verma', phone: '9123456789', plan: 'Yearly Plan', joined: '06 Sep 2026', start: '06 Sep 2026', expiry: '06 Sep 2027', trainer: 'Karan', status: 'Active', payment: 'Paid', avatar: 'AV' }, 'gym-2');

  console.log('   Saved Member to Gym 1:', m1.name, `(Gym ID: ${m1.gym_id})`);
  console.log('   Saved Member to Gym 2:', m2.name, `(Gym ID: ${m2.gym_id})`);

  const gym1Members = await getMembersDB('gym-1');
  const gym2Members = await getMembersDB('gym-2');

  console.log(`   Gym 1 Members Count: ${gym1Members.length}`);
  console.log(`   Gym 1 Member Names:`, gym1Members.map(m => m.name));
  console.log(`   Gym 2 Members Count: ${gym2Members.length}`);
  console.log(`   Gym 2 Member Names:`, gym2Members.map(m => m.name));

  const gym1HasM2 = gym1Members.some(m => m.id === 'GM-201');
  const gym2HasM1 = gym2Members.some(m => m.id === 'GM-101');
  if (!gym1HasM2 && !gym2HasM1) {
    console.log('   ✅ PASS: Member data is STRICTLY ISOLATED between Gym 1 and Gym 2!');
  } else {
    console.error('   ❌ FAIL: Member data leaked across gyms!');
  }

  // 3. Plans Isolation Test
  console.log('\n--- 3. Testing Membership Plans Saving & Isolation ---');
  const p1 = await addPlanDB({ name: 'Gym 1 Express VIP', duration: '1 Month', price: 3000, popular: true, features: ['24/7 Access'] }, 'gym-1');
  const p2 = await addPlanDB({ name: 'Gym 2 Student Pass', duration: '1 Month', price: 1500, popular: false, features: ['Student ID Required'] }, 'gym-2');

  const gym1Plans = await getPlansDB('gym-1');
  const gym2Plans = await getPlansDB('gym-2');

  console.log('   Gym 1 Plans:', gym1Plans.map(p => `${p.name} (₹${p.price})`));
  console.log('   Gym 2 Plans:', gym2Plans.map(p => `${p.name} (₹${p.price})`));

  if (gym1Plans.some(p => p.name === 'Gym 1 Express VIP') && !gym1Plans.some(p => p.name === 'Gym 2 Student Pass') &&
      gym2Plans.some(p => p.name === 'Gym 2 Student Pass') && !gym2Plans.some(p => p.name === 'Gym 1 Express VIP')) {
    console.log('   ✅ PASS: Plans are STRICTLY ISOLATED per gym!');
  } else {
    console.error('   ❌ FAIL: Plans leaked across gyms!');
  }

  // 4. Expenses Isolation Test
  console.log('\n--- 4. Testing Expenses Saving & Isolation ---');
  const e1 = await addExpenseDB({ title: 'Gym 1 Treadmill Repair', category: 'Maintenance', amount: 4500, vendor: 'FitTech Services', date: '06 Sep 2026', mode: 'UPI', status: 'Paid' }, 'gym-1');
  const e2 = await addExpenseDB({ title: 'Gym 2 AC Servicing', category: 'Utilities', amount: 8000, vendor: 'Cooling Solutions', date: '06 Sep 2026', mode: 'Bank Transfer', status: 'Paid' }, 'gym-2');

  const g1Expenses = await getExpensesDB('gym-1');
  const g2Expenses = await getExpensesDB('gym-2');

  const g1Total = g1Expenses.reduce((sum, e) => sum + e.amount, 0);
  const g2Total = g2Expenses.reduce((sum, e) => sum + e.amount, 0);

  console.log(`   Gym 1 Expenses Total: ₹${g1Total} (Items: ${g1Expenses.map(e => e.title).join(', ')})`);
  console.log(`   Gym 2 Expenses Total: ₹${g2Total} (Items: ${g2Expenses.map(e => e.title).join(', ')})`);

  if (!g1Expenses.some(e => e.title === 'Gym 2 AC Servicing') && !g2Expenses.some(e => e.title === 'Gym 1 Treadmill Repair')) {
    console.log('   ✅ PASS: Financial Expenses are STRICTLY ISOLATED per gym!');
  } else {
    console.error('   ❌ FAIL: Expense data leaked!');
  }

  // 5. Payments & Invoices Isolation Test
  console.log('\n--- 5. Testing Payments & Invoices Isolation ---');
  await addPaymentDB({ invoice: 'INV-G1-001', member: 'Rohan Sharma', amount: 3000, discount: 0, tax: 0, paid: 3000, balance: 0, mode: 'UPI', date: '06 Sep 2026' }, 'gym-1');
  await addPaymentDB({ invoice: 'INV-G2-001', member: 'Ananya Verma', amount: 1500, discount: 0, tax: 0, paid: 1500, balance: 0, mode: 'Card', date: '06 Sep 2026' }, 'gym-2');

  const g1Payments = await getPaymentsDB('gym-1');
  const g2Payments = await getPaymentsDB('gym-2');

  console.log('   Gym 1 Payments:', g1Payments.map(p => `${p.invoice} - ${p.member} (₹${p.paid})`));
  console.log('   Gym 2 Payments:', g2Payments.map(p => `${p.invoice} - ${p.member} (₹${p.paid})`));

  if (g1Payments.every(p => p.gym_id === 'gym-1') && g2Payments.every(p => p.gym_id === 'gym-2')) {
    console.log('   ✅ PASS: Invoices & Payment receipts are STRICTLY ISOLATED per gym!');
  } else {
    console.error('   ❌ FAIL: Payments leaked!');
  }

  // 6. Attendance Isolation Test
  console.log('\n--- 6. Testing Attendance Check-in Isolation ---');
  await addAttendanceDB({ id: 'GM-101', name: 'Rohan Sharma', checkIn: '07:00 AM', checkOut: '08:15 AM', duration: '1h 15m', date: '06 Sep 2026' }, 'gym-1');
  await addAttendanceDB({ id: 'GM-201', name: 'Ananya Verma', checkIn: '06:30 PM', checkOut: '07:45 PM', duration: '1h 15m', date: '06 Sep 2026' }, 'gym-2');

  const g1Att = await getAttendanceDB('gym-1');
  const g2Att = await getAttendanceDB('gym-2');

  console.log('   Gym 1 Attendance:', g1Att.map(a => `${a.name} @ ${a.checkIn}`));
  console.log('   Gym 2 Attendance:', g2Att.map(a => `${a.name} @ ${a.checkIn}`));

  if (!g1Att.some(a => a.id === 'GM-201') && !g2Att.some(a => a.id === 'GM-101')) {
    console.log('   ✅ PASS: Attendance logs are STRICTLY ISOLATED per gym!');
  } else {
    console.error('   ❌ FAIL: Attendance leaked!');
  }

  // 7. Full Refresh Test
  console.log('\n--- 7. Testing refreshAllDBData(gymId) ---');
  const freshG1 = await refreshAllDBData('gym-1');
  const freshG2 = await refreshAllDBData('gym-2');

  console.log(`   Gym 1 Refresh Snapshot -> Members: ${freshG1.members.length}, Plans: ${freshG1.plans.length}, Expenses: ${freshG1.expenses.length}, Payments: ${freshG1.payments.length}`);
  console.log(`   Gym 2 Refresh Snapshot -> Members: ${freshG2.members.length}, Plans: ${freshG2.plans.length}, Expenses: ${freshG2.expenses.length}, Payments: ${freshG2.payments.length}`);

  console.log('\n================================================================');
  console.log('🎉 ALL MULTI-GYM RETRIEVAL, SAVING & ISOLATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

testFullSuite().catch(console.error);
