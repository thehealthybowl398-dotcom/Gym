import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qbgdhjwapdigmsimqctm.supabase.co";
const SUPABASE_SECRET_KEY = "sb_publishable_2XCMMAOQHIL6mSuhsc6Awg_rkcPlMj2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

function sanitizeForTable(obj, allowedKeys) {
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    if (allowedKeys.includes(key)) {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
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

async function testAll() {
  console.log('--- Test Member Insert & Update with Sanitization ---');
  const testId = `GM-${Math.floor(1000 + Math.random() * 9000)}`;
  const member = {
    id: testId,
    name: 'Sanitized Member',
    phone: '+91 90000 00000',
    address: 'Some Address',
    note: 'Some Note',
    plan: 'Monthly Plan',
    joined: '27 Aug 2026',
    start: '27 Aug 2026',
    expiry: '27 Sep 2026',
    trainer: 'General',
    status: 'Active',
    payment: 'Paid',
    avatar: 'SM'
  };

  const memberPayload = sanitizeForTable(member, SCHEMAS.members);
  const insRes = await supabase.from('members').insert([memberPayload]).select('*');
  console.log('Member insert:', { data: insRes.data, error: insRes.error });

  const updatedMember = { ...member, name: 'Sanitized Member Updated' };
  const updatePayload = sanitizeForTable(updatedMember, SCHEMAS.members);
  const upRes = await supabase.from('members').update(updatePayload).eq('id', testId).select('*');
  console.log('Member update:', { data: upRes.data, error: upRes.error });

  const delRes = await supabase.from('members').delete().eq('id', testId);
  console.log('Member delete:', { error: delRes.error });
}

testAll();
