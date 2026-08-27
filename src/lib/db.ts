import { supabase, SUPABASE_URL } from '../lib/supabase';
import { MemberItem, PlanItem, TrainerItem, ExpenseItem, PaymentItem } from '../app/App';

export interface GymUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
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
}

export interface AttendanceItem {
  name: string;
  id: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  date: string;
}

// ─── Table Schemas for Payload Sanitization ─────────────────────────────────
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

// ─── Local Storage DB Fallback & In-Memory Store ────────────────────────────
const defaultPlans: PlanItem[] = [
  { name: 'Monthly Plan', duration: '1 Month', price: 2500, popular: false, features: ['Full Gym Access', 'Locker Room', 'Free Fitness Assessment'] },
  { name: 'Quarterly Plan', duration: '3 Months', price: 6500, popular: true, features: ['Full Gym Access', 'Locker Room', 'Personal Trainer (2 Sessions)', 'Diet Consultation'] },
  { name: 'Half Yearly Plan', duration: '6 Months', price: 11000, popular: false, features: ['Full Gym Access', 'Locker Room', 'Personal Trainer (5 Sessions)', 'Full Body Composition Analysis', 'Diet Plan'] },
  { name: 'Yearly Plan', duration: '1 Year', price: 18000, popular: false, features: ['Unlimited 24/7 Access', 'VIP Locker & Spa', 'Personal Trainer (12 Sessions)', 'Monthly Diet & Fitness Audit', 'Free Gym Merchandise'] },
];

const defaultMembers: MemberItem[] = [];

const defaultUsers: GymUser[] = [
  { id: 'usr-1', name: 'Shivam Admin', email: 'shivamvr1998@gmail.com', password: 'Qwerty@123', role: 'Admin' },
  { id: 'usr-2', name: 'Admin User', email: 'admin@championsgym.com', password: 'admin123', role: 'Admin' },
  { id: 'usr-3', name: 'Manager Shivam', email: 'manager@championsgym.com', password: 'manager123', role: 'Manager' }
];

const defaultAuditLogs: AuditLogItem[] = [
  { id: 'log-1', timestamp: '08 Aug 2026, 10:00 AM', userName: 'Shivam Admin', userEmail: 'shivamvr1998@gmail.com', userRole: 'Admin', action: 'System Initialized', category: 'System', details: 'Database initialized with standard plans' }
];

const STORAGE_KEY = 'fitpeak_gym_db';
const getStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.plans || parsed.plans.length === 0) parsed.plans = defaultPlans;
      if (!parsed.members) parsed.members = [];
      // Clean old hardcoded dummy members if present
      if (parsed.members && parsed.members.some((m: any) => m.id === 'GM-1001' || m.id === 'GM-1002' || m.id === 'GM-1003')) {
        parsed.members = parsed.members.filter((m: any) => m.id !== 'GM-1001' && m.id !== 'GM-1002' && m.id !== 'GM-1003');
      }
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

const saveStored = (store: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
};

const localStore = getStored();

// ─── Members DB API ─────────────────────────────────────────────────────────
export async function getMembersDB(): Promise<MemberItem[]> {
  try {
    const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase getMembers error:', error);
      return localStore.members || [];
    }
    const result = data ? (data as MemberItem[]) : [];
    localStore.members = result;
    saveStored(localStore);
    return result;
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return localStore.members || [];
  }
}

export async function addMemberDB(member: MemberItem): Promise<MemberItem> {
  const payload = sanitizePayload<MemberItem>(member, SCHEMAS.members);
  try {
    const { data, error } = await supabase.from('members').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addMember error:', error);
    } else if (data && data.length > 0) {
      const inserted = { ...member, ...(data[0] as MemberItem) };
      localStore.members = [inserted, ...localStore.members.filter(m => m.id !== inserted.id)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase insert exception:', err);
  }
  localStore.members = [member, ...localStore.members.filter(m => m.id !== member.id)];
  saveStored(localStore);
  return member;
}

export async function updateMemberDB(updated: MemberItem): Promise<MemberItem> {
  const payload = sanitizePayload<MemberItem>(updated, SCHEMAS.members);
  try {
    const { error } = await supabase.from('members').update(payload).eq('id', updated.id);
    if (error) console.error('Supabase updateMember error:', error);
  } catch (err) {
    console.error('Supabase update exception:', err);
  }
  localStore.members = localStore.members.map((m: MemberItem) => m.id === updated.id ? updated : m);
  saveStored(localStore);
  return updated;
}

export async function deleteMemberDB(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) console.error('Supabase deleteMember error:', error);
  } catch (err) {
    console.error('Supabase delete exception:', err);
  }
  localStore.members = localStore.members.filter((m: MemberItem) => m.id !== id);
  saveStored(localStore);
}

// ─── Plans DB API ───────────────────────────────────────────────────────────
export async function getPlansDB(): Promise<PlanItem[]> {
  try {
    const { data, error } = await supabase.from('plans').select('*');
    if (error) {
      console.error('Supabase getPlans error:', error);
      return localStore.plans;
    }
    if (data && data.length > 0) {
      localStore.plans = data as PlanItem[];
      saveStored(localStore);
      return data as PlanItem[];
    }
    return localStore.plans;
  } catch (err) {
    console.error('Supabase fetch plans exception:', err);
    return localStore.plans;
  }
}

export async function addPlanDB(plan: PlanItem): Promise<PlanItem> {
  const payload = sanitizePayload<PlanItem>(plan, SCHEMAS.plans);
  try {
    const { data, error } = await supabase.from('plans').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addPlan error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as PlanItem;
      localStore.plans = [inserted, ...localStore.plans.filter(p => p.name !== inserted.name)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase addPlan exception:', err);
  }
  localStore.plans = [plan, ...localStore.plans.filter(p => p.name !== plan.name)];
  saveStored(localStore);
  return plan;
}

export async function updatePlanDB(updated: PlanItem, oldName?: string): Promise<PlanItem> {
  const targetName = oldName || updated.name;
  const payload = sanitizePayload<PlanItem>(updated, SCHEMAS.plans);
  try {
    const { error } = await supabase.from('plans').update(payload).eq('name', targetName);
    if (error) console.error('Supabase updatePlan error:', error);
  } catch (err) {
    console.error('Supabase updatePlan exception:', err);
  }
  localStore.plans = localStore.plans.map((p: PlanItem) => p.name === targetName ? updated : p);
  saveStored(localStore);
  return updated;
}

export async function deletePlanDB(name: string): Promise<void> {
  try {
    const { error } = await supabase.from('plans').delete().eq('name', name);
    if (error) console.error('Supabase deletePlan error:', error);
  } catch (err) {
    console.error('Supabase deletePlan exception:', err);
  }
  localStore.plans = localStore.plans.filter((p: PlanItem) => p.name !== name);
  saveStored(localStore);
}

// ─── Trainers DB API ────────────────────────────────────────────────────────
export async function getTrainersDB(): Promise<TrainerItem[]> {
  try {
    const { data, error } = await supabase.from('trainers').select('*');
    if (error) console.error('Supabase getTrainers error:', error);
    if (data && data.length > 0) {
      localStore.trainers = data as TrainerItem[];
      saveStored(localStore);
      return data as TrainerItem[];
    }
    return localStore.trainers;
  } catch (err) {
    console.error('Supabase fetch trainers exception:', err);
    return localStore.trainers;
  }
}

export async function addTrainerDB(trainer: TrainerItem): Promise<TrainerItem> {
  const payload = sanitizePayload<TrainerItem>(trainer, SCHEMAS.trainers);
  try {
    const { data, error } = await supabase.from('trainers').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addTrainer error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as TrainerItem;
      localStore.trainers = [inserted, ...localStore.trainers.filter(t => t.name !== inserted.name)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase addTrainer exception:', err);
  }
  localStore.trainers = [trainer, ...localStore.trainers.filter(t => t.name !== trainer.name)];
  saveStored(localStore);
  return trainer;
}

export async function updateTrainerDB(updated: TrainerItem): Promise<TrainerItem> {
  const payload = sanitizePayload<TrainerItem>(updated, SCHEMAS.trainers);
  try {
    const { error } = await supabase.from('trainers').update(payload).eq('name', updated.name);
    if (error) console.error('Supabase updateTrainer error:', error);
  } catch (err) {
    console.error('Supabase updateTrainer exception:', err);
  }
  localStore.trainers = localStore.trainers.map((t: TrainerItem) => t.name === updated.name ? updated : t);
  saveStored(localStore);
  return updated;
}

export async function deleteTrainerDB(name: string): Promise<void> {
  try {
    const { error } = await supabase.from('trainers').delete().eq('name', name);
    if (error) console.error('Supabase deleteTrainer error:', error);
  } catch (err) {
    console.error('Supabase deleteTrainer exception:', err);
  }
  localStore.trainers = localStore.trainers.filter((t: TrainerItem) => t.name !== name);
  saveStored(localStore);
}

// ─── Expenses DB API ────────────────────────────────────────────────────────
export async function getExpensesDB(): Promise<ExpenseItem[]> {
  try {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) console.error('Supabase getExpenses error:', error);
    if (data && data.length > 0) {
      localStore.expenses = data as ExpenseItem[];
      saveStored(localStore);
      return data as ExpenseItem[];
    }
    return localStore.expenses;
  } catch (err) {
    console.error('Supabase fetch expenses exception:', err);
    return localStore.expenses;
  }
}

export async function addExpenseDB(expense: ExpenseItem): Promise<ExpenseItem> {
  const payload = sanitizePayload<ExpenseItem>(expense, SCHEMAS.expenses);
  try {
    const { data, error } = await supabase.from('expenses').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addExpense error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as ExpenseItem;
      localStore.expenses = [inserted, ...localStore.expenses];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase addExpense exception:', err);
  }
  localStore.expenses = [expense, ...localStore.expenses];
  saveStored(localStore);
  return expense;
}

export async function updateExpenseDB(idx: number, updated: ExpenseItem): Promise<ExpenseItem> {
  const target = localStore.expenses[idx];
  const payload = sanitizePayload<ExpenseItem>(updated, SCHEMAS.expenses);
  const targetId = (updated as any).id || (target as any)?.id;
  if (targetId) {
    try {
      const { error } = await supabase.from('expenses').update(payload).eq('id', targetId);
      if (error) console.error('Supabase updateExpense error:', error);
    } catch (err) {
      console.error('Supabase updateExpense exception:', err);
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
      if (error) console.error('Supabase deleteExpense error:', error);
    } catch (err) {
      console.error('Supabase deleteExpense exception:', err);
    }
  } else if (target?.title) {
    try {
      const { error } = await supabase.from('expenses').delete().eq('title', target.title).eq('date', target.date);
      if (error) console.error('Supabase deleteExpense error:', error);
    } catch (err) {
      console.error('Supabase deleteExpense exception:', err);
    }
  }
  localStore.expenses = localStore.expenses.filter((_: any, i: number) => i !== idx);
  saveStored(localStore);
}

// ─── Payments DB API ────────────────────────────────────────────────────────
export async function getPaymentsDB(): Promise<PaymentItem[]> {
  try {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (error) console.error('Supabase getPayments error:', error);
    if (data && data.length > 0) {
      localStore.payments = data as PaymentItem[];
      saveStored(localStore);
      return data as PaymentItem[];
    }
    return localStore.payments || [];
  } catch (err) {
    console.error('Supabase fetch payments exception:', err);
    return localStore.payments || [];
  }
}

export async function addPaymentDB(payment: PaymentItem): Promise<PaymentItem> {
  const payload = sanitizePayload<PaymentItem>(payment, SCHEMAS.payments);
  try {
    const { data, error } = await supabase.from('payments').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addPayment error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as PaymentItem;
      if (!localStore.payments) localStore.payments = [];
      localStore.payments = [inserted, ...localStore.payments.filter(p => p.invoice !== inserted.invoice)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase addPayment exception:', err);
  }
  if (!localStore.payments) localStore.payments = [];
  localStore.payments = [payment, ...localStore.payments.filter(p => p.invoice !== payment.invoice)];
  saveStored(localStore);
  return payment;
}

export async function deletePaymentDB(invoice: string): Promise<void> {
  try {
    const { error } = await supabase.from('payments').delete().eq('invoice', invoice);
    if (error) console.error('Supabase deletePayment error:', error);
  } catch (err) {
    console.error('Supabase deletePayment exception:', err);
  }
  if (localStore.payments) {
    localStore.payments = localStore.payments.filter((p: PaymentItem) => p.invoice !== invoice);
  }
  saveStored(localStore);
}

// ─── Attendance DB API ──────────────────────────────────────────────────────
export async function getAttendanceDB(): Promise<AttendanceItem[]> {
  try {
    const { data, error } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    if (error) console.error('Supabase getAttendance error:', error);
    if (data && data.length > 0) {
      localStore.attendance = data as AttendanceItem[];
      saveStored(localStore);
      return data as AttendanceItem[];
    }
    return localStore.attendance || [];
  } catch (err) {
    console.error('Supabase fetch attendance exception:', err);
    return localStore.attendance || [];
  }
}

export async function addAttendanceDB(item: AttendanceItem): Promise<AttendanceItem> {
  const payload = sanitizePayload<AttendanceItem>(item, SCHEMAS.attendance);
  try {
    const { data, error } = await supabase.from('attendance').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addAttendance error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as AttendanceItem;
      if (!localStore.attendance) localStore.attendance = [];
      localStore.attendance = [inserted, ...localStore.attendance];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase addAttendance exception:', err);
  }
  if (!localStore.attendance) localStore.attendance = [];
  localStore.attendance = [item, ...localStore.attendance];
  saveStored(localStore);
  return item;
}

export async function updateAttendanceDB(updated: AttendanceItem): Promise<AttendanceItem> {
  const payload = sanitizePayload<AttendanceItem>(updated, SCHEMAS.attendance);
  try {
    const { error } = await supabase.from('attendance').update(payload).eq('id', updated.id).eq('checkIn', updated.checkIn);
    if (error) console.error('Supabase updateAttendance error:', error);
  } catch (err) {
    console.error('Supabase updateAttendance exception:', err);
  }
  if (!localStore.attendance) localStore.attendance = [];
  localStore.attendance = localStore.attendance.map((a: AttendanceItem) => (a.id === updated.id && a.checkIn === updated.checkIn) ? updated : a);
  saveStored(localStore);
  return updated;
}

export async function deleteAttendanceDB(id: string, checkIn: string): Promise<void> {
  try {
    const { error } = await supabase.from('attendance').delete().eq('id', id).eq('checkIn', checkIn);
    if (error) console.error('Supabase deleteAttendance error:', error);
  } catch (err) {
    console.error('Supabase deleteAttendance exception:', err);
  }
  if (localStore.attendance) {
    localStore.attendance = localStore.attendance.filter((a: AttendanceItem) => !(a.id === id && a.checkIn === checkIn));
  }
  saveStored(localStore);
}

// ─── Users DB API ───────────────────────────────────────────────────────────
export async function getUsersDB(): Promise<GymUser[]> {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error('Supabase getUsers error:', error);
    if (data && data.length > 0) {
      localStore.users = data as GymUser[];
      saveStored(localStore);
      return data as GymUser[];
    }
    return localStore.users || [];
  } catch (err) {
    console.error('Supabase fetch users exception:', err);
    return localStore.users || [];
  }
}

export async function addUserDB(user: GymUser): Promise<GymUser> {
  const payload = sanitizePayload<GymUser>(user, SCHEMAS.users);
  try {
    const { data, error } = await supabase.from('users').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addUser error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as GymUser;
      if (!localStore.users) localStore.users = [];
      localStore.users = [inserted, ...localStore.users.filter(u => u.id !== inserted.id)];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase addUser exception:', err);
  }
  if (!localStore.users) localStore.users = [];
  localStore.users = [user, ...localStore.users.filter(u => u.id !== user.id)];
  saveStored(localStore);
  return user;
}

export async function deleteUserDB(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('Supabase deleteUser error:', error);
  } catch (err) {
    console.error('Supabase deleteUser exception:', err);
  }
  if (localStore.users) {
    localStore.users = localStore.users.filter((u: GymUser) => u.id !== id);
  }
  saveStored(localStore);
}

// ─── Audit Logs DB API ────────────────────────────────────────────────────────
export async function getAuditLogsDB(): Promise<AuditLogItem[]> {
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) console.error('Supabase getAuditLogs error:', error);
    if (data && data.length > 0) {
      localStore.auditLogs = data as AuditLogItem[];
      saveStored(localStore);
      return data as AuditLogItem[];
    }
    return localStore.auditLogs || [];
  } catch (err) {
    console.error('Supabase fetch audit logs exception:', err);
    return localStore.auditLogs || [];
  }
}

export async function addAuditLogDB(log: AuditLogItem): Promise<AuditLogItem> {
  const payload = sanitizePayload<AuditLogItem>(log, SCHEMAS.audit_logs);
  try {
    const { data, error } = await supabase.from('audit_logs').insert([payload]).select('*');
    if (error) {
      console.error('Supabase addAuditLog error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as AuditLogItem;
      if (!localStore.auditLogs) localStore.auditLogs = [];
      localStore.auditLogs = [inserted, ...localStore.auditLogs];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase addAuditLog exception:', err);
  }
  if (!localStore.auditLogs) localStore.auditLogs = [];
  localStore.auditLogs = [log, ...localStore.auditLogs];
  saveStored(localStore);
  return log;
}

export async function logUserActivity(
  currentUser: GymUser | null,
  action: string,
  category: string,
  details: string
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
    details
  };
  return await addAuditLogDB(logItem);
}

export async function refreshAllDBData() {
  const [
    members,
    plans,
    trainers,
    expenses,
    payments,
    attendance,
    users,
    auditLogs
  ] = await Promise.all([
    getMembersDB(),
    getPlansDB(),
    getTrainersDB(),
    getExpensesDB(),
    getPaymentsDB(),
    getAttendanceDB(),
    getUsersDB(),
    getAuditLogsDB()
  ]);

  return {
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

