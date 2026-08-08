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

const isConfigured = SUPABASE_URL && !SUPABASE_URL.includes('your-supabase-project-ref');

// ─── Local Storage DB Fallback (Persists items locally and syncs with Supabase when configured) ──────
const defaultPlans: PlanItem[] = [
  { name: 'Monthly Plan', duration: '1 Month', price: 2500, popular: false, features: ['Full Gym Access', 'Locker Room', 'Free Fitness Assessment'] },
  { name: 'Quarterly Plan', duration: '3 Months', price: 6500, popular: true, features: ['Full Gym Access', 'Locker Room', 'Personal Trainer (2 Sessions)', 'Diet Consultation'] },
  { name: 'Half Yearly Plan', duration: '6 Months', price: 11000, popular: false, features: ['Full Gym Access', 'Locker Room', 'Personal Trainer (5 Sessions)', 'Full Body Composition Analysis', 'Diet Plan'] },
  { name: 'Yearly Plan', duration: '1 Year', price: 18000, popular: false, features: ['Unlimited 24/7 Access', 'VIP Locker & Spa', 'Personal Trainer (12 Sessions)', 'Monthly Diet & Fitness Audit', 'Free Gym Merchandise'] },
];

const defaultMembers: MemberItem[] = [
  { id: 'GM-1001', name: 'Vikram Singh', phone: '+91 98765 43210', plan: 'Monthly Plan', joined: '01 Jul 2026', start: '01 Jul 2026', expiry: '01 Aug 2026', status: 'Expired', payment: 'Paid', avatar: 'VS', address: 'Flat 102, Shanti Heights, Main Road', note: 'Needs plan renewal' },
  { id: 'GM-1002', name: 'Priya Sharma', phone: '+91 98123 45678', plan: 'Quarterly Plan', joined: '15 May 2026', start: '15 May 2026', expiry: '15 Aug 2026', status: 'Active', payment: 'Paid', avatar: 'PS', address: 'B-45, Green Park Society', note: 'Prefers evening slot' },
  { id: 'GM-1003', name: 'Amit Kumar', phone: '+91 97111 22334', plan: 'Monthly Plan', joined: '05 Jun 2026', start: '05 Jun 2026', expiry: '05 Jul 2026', status: 'Expired', payment: 'Overdue', avatar: 'AK', address: 'Sector 14, Ring Road', note: 'Pending payment reminder sent' },
];

const defaultUsers: GymUser[] = [
  { id: 'usr-1', name: 'Shivam Admin', email: 'shivamvr1998@gmail.com', password: 'Qwerty@123', role: 'Admin' },
  { id: 'usr-2', name: 'Admin User', email: 'admin@championsgym.com', password: 'admin123', role: 'Admin' },
  { id: 'usr-3', name: 'Manager Shivam', email: 'manager@championsgym.com', password: 'manager123', role: 'Manager' }
];

const defaultAuditLogs: AuditLogItem[] = [
  { id: 'log-1', timestamp: '08 Aug 2026, 10:00 AM', userName: 'Shivam Admin', userEmail: 'shivamvr1998@gmail.com', userRole: 'Admin', action: 'System Initialized', category: 'System', details: 'Database initialized with standard plans and members' }
];

const STORAGE_KEY = 'fitpeak_gym_db';
const getStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.plans || parsed.plans.length === 0) {
        parsed.plans = defaultPlans;
      }
      if (!parsed.members || parsed.members.length === 0) {
        parsed.members = defaultMembers;
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
      if (!parsed.auditLogs) {
        parsed.auditLogs = defaultAuditLogs;
      }
      return parsed;
    }
  } catch {}
  return {
    members: defaultMembers,
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
      return localStore.members;
    }
    return data && data.length > 0 ? (data as MemberItem[]) : localStore.members;
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return localStore.members;
  }
}

export async function addMemberDB(member: MemberItem): Promise<MemberItem> {
  try {
    const { data, error } = await supabase.from('members').insert([member]).select('*');
    if (error) {
      console.error('Supabase addMember error:', error);
    } else if (data && data.length > 0) {
      const inserted = data[0] as MemberItem;
      localStore.members = [inserted, ...localStore.members];
      saveStored(localStore);
      return inserted;
    }
  } catch (err) {
    console.error('Supabase insert exception:', err);
  }
  localStore.members = [member, ...localStore.members];
  saveStored(localStore);
  return member;
}

export async function updateMemberDB(updated: MemberItem): Promise<MemberItem> {
  try {
    const { error } = await supabase.from('members').update(updated).eq('id', updated.id);
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
    if (error || !data || data.length === 0) {
      if (!localStore.plans || localStore.plans.length === 0) {
        localStore.plans = defaultPlans;
        saveStored(localStore);
      }
      return localStore.plans;
    }
    return data as PlanItem[];
  } catch {
    if (!localStore.plans || localStore.plans.length === 0) {
      localStore.plans = defaultPlans;
      saveStored(localStore);
    }
    return localStore.plans;
  }
}

export async function addPlanDB(plan: PlanItem): Promise<PlanItem> {
  try {
    await supabase.from('plans').insert([plan]);
  } catch (err) {
    console.error('Supabase addPlan error:', err);
  }
  localStore.plans = [plan, ...localStore.plans];
  saveStored(localStore);
  return plan;
}

export async function updatePlanDB(updated: PlanItem, oldName?: string): Promise<PlanItem> {
  const targetName = oldName || updated.name;
  try {
    await supabase.from('plans').update(updated).eq('name', targetName);
  } catch (err) {
    console.error('Supabase updatePlan error:', err);
  }
  localStore.plans = localStore.plans.map((p: PlanItem) => p.name === targetName ? updated : p);
  saveStored(localStore);
  return updated;
}

export async function deletePlanDB(name: string): Promise<void> {
  try {
    await supabase.from('plans').delete().eq('name', name);
  } catch (err) {
    console.error('Supabase deletePlan error:', err);
  }
  localStore.plans = localStore.plans.filter((p: PlanItem) => p.name !== name);
  saveStored(localStore);
}

// ─── Trainers DB API ────────────────────────────────────────────────────────
export async function getTrainersDB(): Promise<TrainerItem[]> {
  try {
    const { data, error } = await supabase.from('trainers').select('*');
    if (error || !data || data.length === 0) return localStore.trainers;
    return data as TrainerItem[];
  } catch {
    return localStore.trainers;
  }
}

export async function addTrainerDB(trainer: TrainerItem): Promise<TrainerItem> {
  try {
    await supabase.from('trainers').insert([trainer]);
  } catch (err) {
    console.error('Supabase addTrainer error:', err);
  }
  localStore.trainers = [trainer, ...localStore.trainers];
  saveStored(localStore);
  return trainer;
}

export async function updateTrainerDB(updated: TrainerItem): Promise<TrainerItem> {
  try {
    await supabase.from('trainers').update(updated).eq('name', updated.name);
  } catch (err) {
    console.error('Supabase updateTrainer error:', err);
  }
  localStore.trainers = localStore.trainers.map((t: TrainerItem) => t.name === updated.name ? updated : t);
  saveStored(localStore);
  return updated;
}

export async function deleteTrainerDB(name: string): Promise<void> {
  try {
    await supabase.from('trainers').delete().eq('name', name);
  } catch (err) {
    console.error('Supabase deleteTrainer error:', err);
  }
  localStore.trainers = localStore.trainers.filter((t: TrainerItem) => t.name !== name);
  saveStored(localStore);
}

// ─── Expenses DB API ────────────────────────────────────────────────────────
export async function getExpensesDB(): Promise<ExpenseItem[]> {
  try {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error || !data || data.length === 0) return localStore.expenses;
    return data as ExpenseItem[];
  } catch {
    return localStore.expenses;
  }
}

export async function addExpenseDB(expense: ExpenseItem): Promise<ExpenseItem> {
  try {
    await supabase.from('expenses').insert([expense]);
  } catch (err) {
    console.error('Supabase addExpense error:', err);
  }
  localStore.expenses = [expense, ...localStore.expenses];
  saveStored(localStore);
  return expense;
}

export async function updateExpenseDB(idx: number, updated: ExpenseItem): Promise<ExpenseItem> {
  localStore.expenses = localStore.expenses.map((e: ExpenseItem, i: number) => i === idx ? updated : e);
  saveStored(localStore);
  return updated;
}

export async function deleteExpenseDB(idx: number): Promise<void> {
  localStore.expenses = localStore.expenses.filter((_: any, i: number) => i !== idx);
  saveStored(localStore);
}

// ─── Payments DB API ────────────────────────────────────────────────────────
export async function getPaymentsDB(): Promise<PaymentItem[]> {
  try {
    const { data, error } = await supabase.from('payments').select('*');
    if (error || !data || data.length === 0) return localStore.payments || [];
    return data as PaymentItem[];
  } catch {
    return localStore.payments || [];
  }
}

export async function addPaymentDB(payment: PaymentItem): Promise<PaymentItem> {
  try {
    await supabase.from('payments').insert([payment]);
  } catch (err) {
    console.error('Supabase addPayment error:', err);
  }
  if (!localStore.payments) localStore.payments = [];
  localStore.payments = [payment, ...localStore.payments];
  saveStored(localStore);
  return payment;
}

export async function deletePaymentDB(invoice: string): Promise<void> {
  try {
    await supabase.from('payments').delete().eq('invoice', invoice);
  } catch (err) {
    console.error('Supabase deletePayment error:', err);
  }
  if (localStore.payments) {
    localStore.payments = localStore.payments.filter((p: PaymentItem) => p.invoice !== invoice);
  }
  saveStored(localStore);
}

// ─── Attendance DB API ──────────────────────────────────────────────────────
export async function getAttendanceDB(): Promise<AttendanceItem[]> {
  try {
    const { data, error } = await supabase.from('attendance').select('*');
    if (error || !data || data.length === 0) return localStore.attendance || [];
    return data as AttendanceItem[];
  } catch {
    return localStore.attendance || [];
  }
}

export async function addAttendanceDB(item: AttendanceItem): Promise<AttendanceItem> {
  try {
    await supabase.from('attendance').insert([item]);
  } catch (err) {
    console.error('Supabase addAttendance error:', err);
  }
  if (!localStore.attendance) localStore.attendance = [];
  localStore.attendance = [item, ...localStore.attendance];
  saveStored(localStore);
  return item;
}

export async function updateAttendanceDB(updated: AttendanceItem): Promise<AttendanceItem> {
  try {
    await supabase.from('attendance').update(updated).eq('id', updated.id).eq('checkIn', updated.checkIn);
  } catch (err) {
    console.error('Supabase updateAttendance error:', err);
  }
  if (!localStore.attendance) localStore.attendance = [];
  localStore.attendance = localStore.attendance.map((a: AttendanceItem) => (a.id === updated.id && a.checkIn === updated.checkIn) ? updated : a);
  saveStored(localStore);
  return updated;
}

export async function deleteAttendanceDB(id: string, checkIn: string): Promise<void> {
  try {
    await supabase.from('attendance').delete().eq('id', id).eq('checkIn', checkIn);
  } catch (err) {
    console.error('Supabase deleteAttendance error:', err);
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
    if (error || !data || data.length === 0) return localStore.users || [];
    return data as GymUser[];
  } catch {
    return localStore.users || [];
  }
}

export async function addUserDB(user: GymUser): Promise<GymUser> {
  try {
    await supabase.from('users').insert([user]);
  } catch (err) {
    console.error('Supabase addUser error:', err);
  }
  if (!localStore.users) localStore.users = [];
  localStore.users = [user, ...localStore.users];
  saveStored(localStore);
  return user;
}

export async function deleteUserDB(id: string): Promise<void> {
  try {
    await supabase.from('users').delete().eq('id', id);
  } catch (err) {
    console.error('Supabase deleteUser error:', err);
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
    if (error || !data || data.length === 0) return localStore.auditLogs || [];
    return data as AuditLogItem[];
  } catch {
    return localStore.auditLogs || [];
  }
}

export async function addAuditLogDB(log: AuditLogItem): Promise<AuditLogItem> {
  try {
    await supabase.from('audit_logs').insert([log]);
  } catch (err) {
    console.error('Supabase addAuditLog error:', err);
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
