import { supabase, SUPABASE_URL } from '../lib/supabase';
import { MemberItem, PlanItem, TrainerItem, ExpenseItem, PaymentItem } from '../app/App';

export interface Gym {
  id: string;
  name: string;
  location: string;
  code: string;
  phone?: string;
}

export interface GymUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  gym_id?: string;
  created_at?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  category: string;
  details: string;
  gym_id?: string;
}

export interface AttendanceItem {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  date: string;
  gym_id?: string;
}

export const defaultGyms: Gym[] = [
  { id: 'gym-1', name: 'Champions Gym - Branch 1', location: 'Civil Lines, Main Road', code: 'CG-MAIN', phone: '+91 80 4567 8901' },
  { id: 'gym-2', name: 'Champions Gym - Branch 2', location: 'City Center, 2nd Floor', code: 'CG-B2', phone: '+91 80 4567 8902' }
];

// ─── Table Schemas for Payload Sanitization ─────────────────────────────────
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

function sanitizePayload<T>(obj: any, allowedKeys: string[]): T {
  if (!obj || typeof obj !== 'object') return obj;
  const clean: any = {};
  for (const key of allowedKeys) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      clean[key] = obj[key];
    }
  }
  return clean as T;
}

function filterByGym<T extends { gym_id?: string }>(items: T[], gymId?: string): T[] {
  const targetGym = gymId || 'gym-1';
  return (items || []).filter(item => (item.gym_id || 'gym-1') === targetGym);
}

let hasLoggedOfflineWarning = false;

function handleSupabaseError(action: string, error: any) {
  if (!error) return;
  const msg = typeof error === 'string' ? error : (error.message || error.details || JSON.stringify(error));
  if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    if (!hasLoggedOfflineWarning) {
      console.warn(`[DB Sync] Cloud DB unreachable (${action}). System running smoothly on local database storage.`);
      hasLoggedOfflineWarning = true;
    }
  } else {
    console.error(`[Supabase Error - ${action}]:`, error);
  }
}


// ─── Local Storage DB Fallback & In-Memory Store ────────────────────────────
const defaultPlans: PlanItem[] = [
  { name: 'Monthly Plan', duration: '1 Month', price: 2500, popular: false, features: ['Full Gym Access', 'Locker Room', 'Free Fitness Assessment'], gym_id: 'gym-1' },
  { name: 'Quarterly Plan', duration: '3 Months', price: 6500, popular: true, features: ['Full Gym Access', 'Locker Room', 'Personal Trainer (2 Sessions)', 'Diet Consultation'], gym_id: 'gym-1' },
  { name: 'Half Yearly Plan', duration: '6 Months', price: 11000, popular: false, features: ['Full Gym Access', 'Locker Room', 'Personal Trainer (5 Sessions)', 'Full Body Composition Analysis', 'Diet Plan'], gym_id: 'gym-1' },
  { name: 'Yearly Plan', duration: '1 Year', price: 18000, popular: false, features: ['Unlimited 24/7 Access', 'VIP Locker & Spa', 'Personal Trainer (12 Sessions)', 'Monthly Diet & Fitness Audit', 'Free Gym Merchandise'], gym_id: 'gym-1' },
];

const defaultUsers: GymUser[] = [
  { id: 'usr-1', name: 'Shivam Admin', email: 'shivamvr1998@gmail.com', password: 'Qwerty@123', role: 'Admin', gym_id: 'gym-1' },
  { id: 'usr-2', name: 'Admin User', email: 'admin@championsgym.com', password: 'admin123', role: 'Admin', gym_id: 'gym-1' },
  { id: 'usr-3', name: 'Manager Shivam', email: 'manager@championsgym.com', password: 'manager123', role: 'Manager', gym_id: 'gym-1' }
];

const defaultAuditLogs: AuditLogItem[] = [
  { id: 'log-1', timestamp: '08 Aug 2026, 10:00 AM', userName: 'Shivam Admin', userEmail: 'shivamvr1998@gmail.com', userRole: 'Admin', action: 'System Initialized', category: 'System', details: 'Database initialized with standard plans', gym_id: 'gym-1' }
];

const STORAGE_KEY = 'fitpeak_gym_db';
const getStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.gyms || parsed.gyms.length === 0) parsed.gyms = defaultGyms;
      if (!parsed.plans || parsed.plans.length === 0) parsed.plans = defaultPlans;
      if (!parsed.members) parsed.members = [];
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = defaultUsers;
      } else {
        parsed.users = parsed.users.map((u: GymUser) => ({
          ...u,
          password: u.password || (u.role === 'Admin' ? 'admin123' : 'manager123')
        }));
        if (!parsed.users.some((u: GymUser) => u.email.toLowerCase() === 'shivamvr1998@gmail.com')) {
          parsed.users.unshift(defaultUsers[0]);
        }
      }
      if (!parsed.auditLogs) parsed.auditLogs = defaultAuditLogs;
      return parsed;
    }
  } catch {}
  return {
    gyms: defaultGyms,
    members: [],
    plans: defaultPlans,
    trainers: [],
    expenses: [],
    payments: [],
    attendance: [],
    users: defaultUsers,
    auditLogs: defaultAuditLogs,
  };
};

async function syncToServerDB(store: any) {
  try {
    if (typeof fetch !== 'undefined') {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store)
      });
    }
  } catch {}
}

export async function syncFromServerDB(): Promise<void> {
  try {
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          let updated = false;
          const keys = ['gyms', 'members', 'plans', 'trainers', 'expenses', 'payments', 'attendance', 'users', 'auditLogs'];
          keys.forEach(key => {
            if (Array.isArray(data[key])) {
              localStore[key] = data[key];
              updated = true;
            }
          });
          if (updated) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(localStore));
            } catch {}
          }
        }
      }
    }
  } catch {}
}

const saveStored = (store: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
  syncToServerDB(store);
};

const localStore = getStored();
// Perform initial sync from server DB on load
syncFromServerDB();

// ─── Gyms DB API ────────────────────────────────────────────────────────────
export async function getGymsDB(): Promise<Gym[]> {
  try {
    const { data, error } = await supabase.from('gyms').select('*');
    if (error) handleSupabaseError('getGyms', error);
    if (!error && data && data.length > 0) {
      localStore.gyms = data as Gym[];
      saveStored(localStore);
      return data as Gym[];
    }
  } catch (err) {
    handleSupabaseError('getGyms', err);
  }
  return localStore.gyms || defaultGyms;
}

export async function addGymDB(gym: Gym): Promise<Gym> {
  try {
    const { data, error } = await supabase.from('gyms').insert([gym]).select('*');
    if (error) {
      handleSupabaseError('addGym', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as Gym;
      if (!localStore.gyms) localStore.gyms = [...defaultGyms];
      localStore.gyms = [inserted, ...localStore.gyms.filter(g => g.id !== inserted.id)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addGym', err);
  }
  if (!localStore.gyms) localStore.gyms = [...defaultGyms];
  localStore.gyms = [gym, ...localStore.gyms.filter(g => g.id !== gym.id)];
  saveStored(localStore);
  return gym;
}

// ─── Members DB API ─────────────────────────────────────────────────────────
export async function getMembersDB(gymId?: string): Promise<MemberItem[]> {
  const targetGym = gymId || 'gym-1';
  try {
    const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    if (error) {
      handleSupabaseError('getMembers', error);
      return filterByGym(localStore.members || [], targetGym);
    }
    const result = data ? (data as MemberItem[]) : [];
    // Sync local store
    localStore.members = result;
    saveStored(localStore);
    return filterByGym(result, targetGym);
  } catch (err) {
    handleSupabaseError('getMembers', err);
    return filterByGym(localStore.members || [], targetGym);
  }
}

export async function addMemberDB(member: MemberItem, gymId?: string): Promise<MemberItem> {
  const targetGym = member.gym_id || gymId || 'gym-1';
  const memberWithGym: MemberItem = { ...member, gym_id: targetGym };
  const payload = sanitizePayload<MemberItem>(memberWithGym, SCHEMAS.members);
  
  try {
    const { data, error } = await supabase.from('members').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addMember', error);
    } else if (data && data.length > 0) {
      const inserted = { ...memberWithGym, ...(data[0] as MemberItem) };
      localStore.members = [inserted, ...localStore.members.filter(m => m.id !== inserted.id)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addMember', err);
  }
  localStore.members = [memberWithGym, ...localStore.members.filter(m => m.id !== memberWithGym.id)];
  saveStored(localStore);
  return memberWithGym;
}

export async function updateMemberDB(updated: MemberItem): Promise<MemberItem> {
  const payload = sanitizePayload<MemberItem>(updated, SCHEMAS.members);
  try {
    const { error } = await supabase.from('members').update(payload).eq('id', updated.id);
    if (error) handleSupabaseError('updateMember', error);
  } catch (err) {
    handleSupabaseError('updateMember', err);
  }
  localStore.members = localStore.members.map((m: MemberItem) => m.id === updated.id ? updated : m);
  saveStored(localStore);
  return updated;
}

export async function deleteMemberDB(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) handleSupabaseError('deleteMember', error);
  } catch (err) {
    handleSupabaseError('deleteMember', err);
  }
  localStore.members = localStore.members.filter((m: MemberItem) => m.id !== id);
  saveStored(localStore);
}

// ─── Plans DB API ───────────────────────────────────────────────────────────
export async function getPlansDB(gymId?: string): Promise<PlanItem[]> {
  const targetGym = gymId || 'gym-1';
  try {
    const { data, error } = await supabase.from('plans').select('*');
    if (error) handleSupabaseError('getPlans', error);
    if (data && data.length > 0) {
      localStore.plans = data as PlanItem[];
      saveStored(localStore);
      const filtered = filterByGym(data as PlanItem[], targetGym);
      if (filtered.length > 0) return filtered;
    }
  } catch (err) {
    handleSupabaseError('getPlans', err);
  }
  
  let filtered = filterByGym(localStore.plans || [], targetGym);
  if (filtered.length === 0) {
    // Clone default plans for target gym if empty
    const gymDefaults = defaultPlans.map(p => ({ ...p, gym_id: targetGym }));
    localStore.plans = [...(localStore.plans || []), ...gymDefaults];
    saveStored(localStore);
    filtered = gymDefaults;
  }
  return filtered;
}

export async function addPlanDB(plan: PlanItem, gymId?: string): Promise<PlanItem> {
  const targetGym = plan.gym_id || gymId || 'gym-1';
  const planWithGym: PlanItem = { ...plan, gym_id: targetGym };
  const payload = sanitizePayload<PlanItem>(planWithGym, SCHEMAS.plans);
  try {
    const { data, error } = await supabase.from('plans').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addPlan', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as PlanItem;
      localStore.plans = [inserted, ...localStore.plans.filter(p => !(p.name === inserted.name && (p.gym_id || 'gym-1') === targetGym))];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addPlan', err);
  }
  localStore.plans = [planWithGym, ...localStore.plans.filter(p => !(p.name === planWithGym.name && (p.gym_id || 'gym-1') === targetGym))];
  saveStored(localStore);
  return planWithGym;
}

export async function updatePlanDB(updated: PlanItem, oldName?: string): Promise<PlanItem> {
  const targetName = oldName || updated.name;
  const payload = sanitizePayload<PlanItem>(updated, SCHEMAS.plans);
  try {
    const { error } = await supabase.from('plans').update(payload).eq('name', targetName);
    if (error) handleSupabaseError('updatePlan', error);
  } catch (err) {
    handleSupabaseError('updatePlan', err);
  }
  localStore.plans = localStore.plans.map((p: PlanItem) => p.name === targetName ? updated : p);
  saveStored(localStore);
  return updated;
}

export async function deletePlanDB(name: string): Promise<void> {
  try {
    const { error } = await supabase.from('plans').delete().eq('name', name);
    if (error) handleSupabaseError('deletePlan', error);
  } catch (err) {
    handleSupabaseError('deletePlan', err);
  }
  localStore.plans = localStore.plans.filter((p: PlanItem) => p.name !== name);
  saveStored(localStore);
}

// ─── Trainers DB API ────────────────────────────────────────────────────────
export async function getTrainersDB(gymId?: string): Promise<TrainerItem[]> {
  const targetGym = gymId || 'gym-1';
  try {
    const { data, error } = await supabase.from('trainers').select('*');
    if (error) handleSupabaseError('getTrainers', error);
    if (data && data.length > 0) {
      localStore.trainers = data as TrainerItem[];
      saveStored(localStore);
      return filterByGym(data as TrainerItem[], targetGym);
    }
  } catch (err) {
    handleSupabaseError('getTrainers', err);
  }
  return filterByGym(localStore.trainers || [], targetGym);
}

export async function addTrainerDB(trainer: TrainerItem, gymId?: string): Promise<TrainerItem> {
  const targetGym = trainer.gym_id || gymId || 'gym-1';
  const trainerWithGym: TrainerItem = { ...trainer, gym_id: targetGym };
  const payload = sanitizePayload<TrainerItem>(trainerWithGym, SCHEMAS.trainers);
  try {
    const { data, error } = await supabase.from('trainers').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addTrainer', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as TrainerItem;
      localStore.trainers = [inserted, ...localStore.trainers.filter(t => !(t.name === inserted.name && (t.gym_id || 'gym-1') === targetGym))];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addTrainer', err);
  }
  localStore.trainers = [trainerWithGym, ...localStore.trainers.filter(t => !(t.name === trainerWithGym.name && (t.gym_id || 'gym-1') === targetGym))];
  saveStored(localStore);
  return trainerWithGym;
}

export async function updateTrainerDB(updated: TrainerItem): Promise<TrainerItem> {
  const payload = sanitizePayload<TrainerItem>(updated, SCHEMAS.trainers);
  try {
    const { error } = await supabase.from('trainers').update(payload).eq('name', updated.name);
    if (error) handleSupabaseError('updateTrainer', error);
  } catch (err) {
    handleSupabaseError('updateTrainer', err);
  }
  localStore.trainers = localStore.trainers.map((t: TrainerItem) => t.name === updated.name ? updated : t);
  saveStored(localStore);
  return updated;
}

export async function deleteTrainerDB(name: string): Promise<void> {
  try {
    const { error } = await supabase.from('trainers').delete().eq('name', name);
    if (error) handleSupabaseError('deleteTrainer', error);
  } catch (err) {
    handleSupabaseError('deleteTrainer', err);
  }
  localStore.trainers = localStore.trainers.filter((t: TrainerItem) => t.name !== name);
  saveStored(localStore);
}

// ─── Expenses DB API ────────────────────────────────────────────────────────
export async function getExpensesDB(gymId?: string): Promise<ExpenseItem[]> {
  const targetGym = gymId || 'gym-1';
  try {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) handleSupabaseError('getExpenses', error);
    if (data && data.length > 0) {
      localStore.expenses = data as ExpenseItem[];
      saveStored(localStore);
      return filterByGym(data as ExpenseItem[], targetGym);
    }
  } catch (err) {
    handleSupabaseError('getExpenses', err);
  }
  return filterByGym(localStore.expenses || [], targetGym);
}

export async function addExpenseDB(expense: ExpenseItem, gymId?: string): Promise<ExpenseItem> {
  const targetGym = expense.gym_id || gymId || 'gym-1';
  const expenseWithGym: ExpenseItem = { ...expense, gym_id: targetGym };
  const payload = sanitizePayload<ExpenseItem>(expenseWithGym, SCHEMAS.expenses);
  try {
    const { data, error } = await supabase.from('expenses').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addExpense', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as ExpenseItem;
      localStore.expenses = [inserted, ...localStore.expenses];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addExpense', err);
  }
  localStore.expenses = [expenseWithGym, ...localStore.expenses];
  saveStored(localStore);
  return expenseWithGym;
}

export async function updateExpenseDB(idx: number, updated: ExpenseItem): Promise<ExpenseItem> {
  const target = localStore.expenses[idx];
  const payload = sanitizePayload<ExpenseItem>(updated, SCHEMAS.expenses);
  const targetId = (updated as any).id || (target as any)?.id;
  if (targetId) {
    try {
      const { error } = await supabase.from('expenses').update(payload).eq('id', targetId);
      if (error) handleSupabaseError('updateExpense', error);
    } catch (err) {
      handleSupabaseError('updateExpense', err);
    }
  }
  localStore.expenses = localStore.expenses.map((e: ExpenseItem, i: number) => i === idx ? updated : e);
  saveStored(localStore);
  return updated;
}

export async function deleteExpenseDB(idx: number): Promise<void> {
  const target = localStore.expenses[idx];
  const targetId = (target as any)?.id;
  if (targetId) {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', targetId);
      if (error) handleSupabaseError('deleteExpense', error);
    } catch (err) {
      handleSupabaseError('deleteExpense', err);
    }
  } else if (target?.title) {
    try {
      const { error } = await supabase.from('expenses').delete().eq('title', target.title).eq('date', target.date);
      if (error) handleSupabaseError('deleteExpense', error);
    } catch (err) {
      handleSupabaseError('deleteExpense', err);
    }
  }
  localStore.expenses = localStore.expenses.filter((_: any, i: number) => i !== idx);
  saveStored(localStore);
}

// ─── Payments DB API ────────────────────────────────────────────────────────
export async function getPaymentsDB(gymId?: string): Promise<PaymentItem[]> {
  const targetGym = gymId || 'gym-1';
  try {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (error) handleSupabaseError('getPayments', error);
    if (data && data.length > 0) {
      localStore.payments = data as PaymentItem[];
      saveStored(localStore);
      return filterByGym(data as PaymentItem[], targetGym);
    }
  } catch (err) {
    handleSupabaseError('getPayments', err);
  }
  return filterByGym(localStore.payments || [], targetGym);
}

export async function addPaymentDB(payment: PaymentItem, gymId?: string): Promise<PaymentItem> {
  const targetGym = payment.gym_id || gymId || 'gym-1';
  const paymentWithGym: PaymentItem = { ...payment, gym_id: targetGym };
  const payload = sanitizePayload<PaymentItem>(paymentWithGym, SCHEMAS.payments);
  try {
    const { data, error } = await supabase.from('payments').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addPayment', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as PaymentItem;
      if (!localStore.payments) localStore.payments = [];
      localStore.payments = [inserted, ...localStore.payments.filter(p => p.invoice !== inserted.invoice)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addPayment', err);
  }
  if (!localStore.payments) localStore.payments = [];
  localStore.payments = [paymentWithGym, ...localStore.payments.filter(p => p.invoice !== paymentWithGym.invoice)];
  saveStored(localStore);
  return paymentWithGym;
}

export async function deletePaymentDB(invoice: string): Promise<void> {
  try {
    const { error } = await supabase.from('payments').delete().eq('invoice', invoice);
    if (error) handleSupabaseError('deletePayment', error);
  } catch (err) {
    handleSupabaseError('deletePayment', err);
  }
  if (localStore.payments) {
    localStore.payments = localStore.payments.filter((p: PaymentItem) => p.invoice !== invoice);
  }
  saveStored(localStore);
}

// ─── Attendance DB API ──────────────────────────────────────────────────────
export async function getAttendanceDB(gymId?: string): Promise<AttendanceItem[]> {
  const targetGym = gymId || 'gym-1';
  try {
    const { data, error } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    if (error) handleSupabaseError('getAttendance', error);
    if (data && data.length > 0) {
      localStore.attendance = data as AttendanceItem[];
      saveStored(localStore);
      return filterByGym(data as AttendanceItem[], targetGym);
    }
  } catch (err) {
    handleSupabaseError('getAttendance', err);
  }
  return filterByGym(localStore.attendance || [], targetGym);
}

export async function addAttendanceDB(item: AttendanceItem, gymId?: string): Promise<AttendanceItem> {
  const targetGym = item.gym_id || gymId || 'gym-1';
  const itemWithGym: AttendanceItem = { ...item, gym_id: targetGym };
  const payload = sanitizePayload<AttendanceItem>(itemWithGym, SCHEMAS.attendance);
  try {
    const { data, error } = await supabase.from('attendance').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addAttendance', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as AttendanceItem;
      if (!localStore.attendance) localStore.attendance = [];
      localStore.attendance = [inserted, ...localStore.attendance];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addAttendance', err);
  }
  if (!localStore.attendance) localStore.attendance = [];
  localStore.attendance = [itemWithGym, ...localStore.attendance];
  saveStored(localStore);
  return itemWithGym;
}

export async function updateAttendanceDB(updated: AttendanceItem): Promise<AttendanceItem> {
  const payload = sanitizePayload<AttendanceItem>(updated, SCHEMAS.attendance);
  try {
    const { error } = await supabase.from('attendance').update(payload).eq('id', updated.id).eq('checkIn', updated.checkIn);
    if (error) handleSupabaseError('updateAttendance', error);
  } catch (err) {
    handleSupabaseError('updateAttendance', err);
  }
  if (!localStore.attendance) localStore.attendance = [];
  localStore.attendance = localStore.attendance.map((a: AttendanceItem) => (a.id === updated.id && a.checkIn === updated.checkIn) ? updated : a);
  saveStored(localStore);
  return updated;
}

export async function deleteAttendanceDB(id: string, checkIn: string): Promise<void> {
  try {
    const { error } = await supabase.from('attendance').delete().eq('id', id).eq('checkIn', checkIn);
    if (error) handleSupabaseError('deleteAttendance', error);
  } catch (err) {
    handleSupabaseError('deleteAttendance', err);
  }
  if (localStore.attendance) {
    localStore.attendance = localStore.attendance.filter((a: AttendanceItem) => !(a.id === id && a.checkIn === checkIn));
  }
  saveStored(localStore);
}

// ─── Users DB API ───────────────────────────────────────────────────────────
export async function getUsersDB(gymId?: string): Promise<GymUser[]> {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) handleSupabaseError('getUsers', error);
    if (data && data.length > 0) {
      localStore.users = data as GymUser[];
      saveStored(localStore);
    }
  } catch (err) {
    handleSupabaseError('getUsers', err);
  }
  const users = localStore.users || defaultUsers;
  if (!gymId) return users;
  return users.filter((u: GymUser) => !u.gym_id || u.gym_id === gymId);
}

export async function addUserDB(user: GymUser, gymId?: string): Promise<GymUser> {
  const targetGym = user.gym_id || gymId;
  const userWithGym: GymUser = { ...user, gym_id: targetGym };
  const payload = sanitizePayload<GymUser>(userWithGym, SCHEMAS.users);
  try {
    const { data, error } = await supabase.from('users').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addUser', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as GymUser;
      if (!localStore.users) localStore.users = [];
      localStore.users = [inserted, ...localStore.users.filter(u => u.id !== inserted.id)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addUser', err);
  }
  if (!localStore.users) localStore.users = [];
  localStore.users = [userWithGym, ...localStore.users.filter(u => u.id !== userWithGym.id)];
  saveStored(localStore);
  return userWithGym;
}

export async function deleteUserDB(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) handleSupabaseError('deleteUser', error);
  } catch (err) {
    handleSupabaseError('deleteUser', err);
  }
  if (localStore.users) {
    localStore.users = localStore.users.filter((u: GymUser) => u.id !== id);
  }
  saveStored(localStore);
}

// ─── Audit Logs DB API ────────────────────────────────────────────────────────
export async function getAuditLogsDB(gymId?: string): Promise<AuditLogItem[]> {
  const targetGym = gymId || 'gym-1';
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) handleSupabaseError('getAuditLogs', error);
    if (data && data.length > 0) {
      localStore.auditLogs = data as AuditLogItem[];
      saveStored(localStore);
      return filterByGym(data as AuditLogItem[], targetGym);
    }
  } catch (err) {
    handleSupabaseError('getAuditLogs', err);
  }
  return filterByGym(localStore.auditLogs || [], targetGym);
}

export async function addAuditLogDB(log: AuditLogItem, gymId?: string): Promise<AuditLogItem> {
  const targetGym = log.gym_id || gymId || 'gym-1';
  const logWithGym: AuditLogItem = { ...log, gym_id: targetGym };
  const payload = sanitizePayload<AuditLogItem>(logWithGym, SCHEMAS.audit_logs);
  try {
    const { data, error } = await supabase.from('audit_logs').insert([payload]).select('*');
    if (error) {
      handleSupabaseError('addAuditLog', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as AuditLogItem;
      if (!localStore.auditLogs) localStore.auditLogs = [];
      localStore.auditLogs = [inserted, ...localStore.auditLogs];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    handleSupabaseError('addAuditLog', err);
  }
  if (!localStore.auditLogs) localStore.auditLogs = [];
  localStore.auditLogs = [logWithGym, ...localStore.auditLogs];
  saveStored(localStore);
  return logWithGym;
}

export async function logUserActivity(
  currentUser: GymUser | null,
  action: string,
  category: string,
  details: string,
  gymId?: string
): Promise<AuditLogItem> {
  const logItem: AuditLogItem = {
    id: `log-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    userName: currentUser?.name || 'Admin User',
    userEmail: currentUser?.email || 'admin@fitpeakgym.com',
    userRole: currentUser?.role || 'Admin',
    action,
    category,
    details,
    gym_id: gymId || currentUser?.gym_id || 'gym-1'
  };
  return await addAuditLogDB(logItem, gymId);
}

export async function refreshAllDBData(gymId?: string) {
  const targetGym = gymId || 'gym-1';
  await syncFromServerDB();
  const [
    gyms,
    members,
    plans,
    trainers,
    expenses,
    payments,
    attendance,
    users,
    auditLogs
  ] = await Promise.all([
    getGymsDB(),
    getMembersDB(targetGym),
    getPlansDB(targetGym),
    getTrainersDB(targetGym),
    getExpensesDB(targetGym),
    getPaymentsDB(targetGym),
    getAttendanceDB(targetGym),
    getUsersDB(targetGym),
    getAuditLogsDB(targetGym)
  ]);

  return {
    gyms,
    members,
    plans,
    trainers,
    expenses,
    payments,
    attendance,
    users,
    auditLogs
  };
}
