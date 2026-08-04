import { supabase, SUPABASE_URL } from '../lib/supabase';
import { MemberItem, PlanItem, TrainerItem, ExpenseItem, PaymentItem } from '../app/App';

export interface GymUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
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
const STORAGE_KEY = 'fitpeak_gym_db';
const getStored = () => {
  return {
    members: [],
    plans: [],
    trainers: [],
    expenses: [],
    payments: [],
    attendance: [],
    users: [
      { id: 'usr-1', name: 'Admin User', email: 'admin@fitpeakgym.com', role: 'Admin' },
      { id: 'usr-2', name: 'Manager Shivam', email: 'manager@fitpeakgym.com', role: 'Manager' }
    ]
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
    if (error || !data || data.length === 0) return localStore.plans;
    return data as PlanItem[];
  } catch {
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

export async function updatePlanDB(updated: PlanItem): Promise<PlanItem> {
  try {
    await supabase.from('plans').update(updated).eq('name', updated.name);
  } catch (err) {
    console.error('Supabase updatePlan error:', err);
  }
  localStore.plans = localStore.plans.map((p: PlanItem) => p.name === updated.name ? updated : p);
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
