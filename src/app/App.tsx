import { useState, useEffect } from "react";
import { SplashScreen } from '@capacitor/splash-screen';
import { AddMemberModal, EditMemberModal, ViewMemberModal, AddPlanModal, EditPlanModal, AddTrainerModal, AddExpenseModal, AddPaymentModal, AddAttendanceModal, BulkWhatsAppModal, ViewReceiptModal } from "./ActionModals";
import {
  getMembersDB, addMemberDB, updateMemberDB, deleteMemberDB,
  getPlansDB, addPlanDB, updatePlanDB, deletePlanDB,
  getTrainersDB, addTrainerDB, updateTrainerDB, deleteTrainerDB,
  getExpensesDB, addExpenseDB, updateExpenseDB, deleteExpenseDB,
  getPaymentsDB, addPaymentDB, deletePaymentDB,
  getAttendanceDB, addAttendanceDB, updateAttendanceDB, deleteAttendanceDB,
  getUsersDB, addUserDB, deleteUserDB,
  getAuditLogsDB, addAuditLogDB, logUserActivity, AuditLogItem,
  AttendanceItem, GymUser
} from "../lib/db";
import { shareInvoicePDFOnWhatsApp } from "../lib/pdfGenerator";
import {
  LayoutDashboard, Users, CalendarCheck, CreditCard, TrendingUp,
  Dumbbell, Apple, FileText, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Search, Plus, Sun, Moon,
  Menu, X, ArrowUpRight, ArrowDownRight, MoreVertical,
  Filter, Download, Upload, Eye, Edit2, Trash2, UserPlus,
  Check, Clock, AlertCircle, Activity, DollarSign,
  Wallet, BarChart3, PieChart, RefreshCw, Send,
  Receipt, Building2, Zap, Star, Award, Target,
  ChevronDown, ShoppingBag, Banknote, UserCheck
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RePieChart, Pie, Cell
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface MemberItem {
  id: string;
  name: string;
  phone: string;
  address?: string;
  note?: string;
  plan: string;
  joined: string;
  start: string;
  expiry: string;
  trainer: string;
  status: string;
  payment: string;
  avatar: string;
}

export interface PaymentItem {
  invoice: string;
  member: string;
  amount: number;
  discount: number;
  tax: number;
  paid: number;
  balance: number;
  mode: string;
  date: string;
  receiptUrl?: string;
}

export interface TrainerItem {
  name: string;
  specialization: string;
  experience: string;
  salary: string;
  members: number;
  rating: number;
  avatar: string;
}

export interface PlanItem {
  name: string;
  duration: string;
  price: number;
  popular: boolean;
  features: string[];
}

export interface ExpenseItem {
  title: string;
  category: string;
  amount: number;
  vendor: string;
  date: string;
  mode: string;
  status: string;
}

// ─── Data Constants ─────────────────────────────────────────────────────────
const revenueData: { month: string; revenue: number; expenses: number }[] = [];
const attendanceData: { day: string; checkins: number }[] = [];
const membershipData: { name: string; value: number; color: string }[] = [];
const payments: { invoice: string; member: string; amount: number; discount: number; tax: number; paid: number; balance: number; mode: string; date: string }[] = [];
const todayAttendance: { name: string; id: string; checkIn: string; checkOut: string; duration: string }[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Avatar({ initials, size = "md", color }: { initials: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const colors = ["#FF6B00", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#EF4444", "#06B6D4"];
  const bg = color ?? colors[(initials || "GM").charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`} style={{ backgroundColor: bg }}>
      {initials || "GM"}
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant: "success" | "danger" | "warning" | "info" | "muted" | "orange" }) {
  const styles = {
    success: "bg-green-500/15 text-green-400 border-green-500/20",
    danger: "bg-red-500/15 text-red-400 border-red-500/20",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    muted: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    orange: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, delta, deltaLabel, icon, color }: {
  label: string; value: string; delta?: number; deltaLabel?: string;
  icon: React.ReactNode; color: string;
}) {
  const up = delta !== undefined && delta >= 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: color + "22" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}>
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-foreground text-2xl font-bold">{value}</p>
        {deltaLabel && <p className="text-muted-foreground text-xs mt-1">{deltaLabel}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-foreground text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, icon }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md"; onClick?: () => void; icon?: React.ReactNode;
}) {
  const base = "inline-flex items-center gap-2 font-semibold rounded-xl transition-all cursor-pointer border";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-primary text-primary-foreground border-primary hover:opacity-90",
    secondary: "bg-card text-foreground border-border hover:border-primary/40 hover:text-primary",
    ghost: "bg-transparent text-muted-foreground border-transparent hover:bg-card hover:text-foreground",
    danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]}`} onClick={onClick}>
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
  { id: "members", label: "Members", icon: <Users className="w-4.5 h-4.5" /> },
  { id: "attendance", label: "Attendance", icon: <CalendarCheck className="w-4.5 h-4.5" /> },
  { id: "plans", label: "Membership Plans", icon: <Award className="w-4.5 h-4.5" /> },
  { id: "payments", label: "Payments", icon: <CreditCard className="w-4.5 h-4.5" /> },
  { id: "expenses", label: "Expenses", icon: <Wallet className="w-4.5 h-4.5" /> },
  { id: "trainers", label: "Trainers", icon: <UserCheck className="w-4.5 h-4.5" /> },
  { id: "workout", label: "Workout Plans", icon: <Dumbbell className="w-4.5 h-4.5" /> },
  { id: "diet", label: "Diet Plans", icon: <Apple className="w-4.5 h-4.5" /> },
  { id: "reports", label: "Reports", icon: <BarChart3 className="w-4.5 h-4.5" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4.5 h-4.5" />, badge: 3 },
  { id: "settings", label: "Settings", icon: <Settings className="w-4.5 h-4.5" /> },
];

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

function isMemberExpired(m: MemberItem): boolean {
  if (m.status === "Expired") return true;
  if (!m.expiry) return false;
  try {
    const expDate = new Date(m.expiry);
    if (isNaN(expDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate < today;
  } catch {
    return false;
  }
}

function sendWhatsAppExpiryReminder(m: MemberItem) {
  let cleanPhone = m.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
  const message = `Hello ${m.name}, your Champions Gym membership plan (${m.plan}) has expired on ${m.expiry}. Please renew your membership to continue your workouts! 🏋️‍♂️💪`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage({ members, plans, trainers, expenses, onOpenBulkWhatsApp }: { members: MemberItem[]; plans: PlanItem[]; trainers: TrainerItem[]; expenses: ExpenseItem[]; onOpenBulkWhatsApp: () => void }) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1E293B] border border-border rounded-xl p-3 text-xs shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: ₹{p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  const AttendanceTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1E293B] border border-border rounded-xl p-3 text-xs shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p style={{ color: "#FF6B00" }} className="font-semibold">Check-ins: {payload[0]?.value}</p>
      </div>
    );
  };

  // Dynamic Metrics Calculations
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === "Active").length;
  const expiredMembers = members.filter(m => isMemberExpired(m));

  // Dynamic Revenue estimation from monthly plans
  const totalRevenue = members.reduce((acc, m) => {
    // Check custom plans first
    const matchedPlan = plans.find(p => p.name.toLowerCase() === m.plan?.toLowerCase());
    if (matchedPlan) return acc + Number(matchedPlan.price);
    
    // Fallback standard rate mapping
    const standardPlans: Record<string, number> = {
      monthly: 2500,
      quarterly: 6500,
      "half year": 11000,
      yearly: 18000
    };
    const key = (m.plan || "monthly").toLowerCase();
    return acc + (standardPlans[key] ?? 2500);
  }, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard Overview"
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Btn>
            <Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Quick Add</Btn>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={String(totalMembers)} delta={0} deltaLabel="Live member list count" icon={<Users className="w-5 h-5" />} color="#3B82F6" />
        <StatCard label="Active Members" value={String(activeMembers)} delta={0} deltaLabel="Currently active" icon={<Activity className="w-5 h-5" />} color="#22C55E" />
        <StatCard label="Today's Check-ins" value="0" delta={0} deltaLabel="vs yesterday" icon={<CalendarCheck className="w-5 h-5" />} color="#FF6B00" />
        <StatCard label="Monthly Revenue" value={`₹${totalRevenue.toLocaleString()}`} delta={0} deltaLabel="Based on member plans" icon={<DollarSign className="w-5 h-5" />} color="#A855F7" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Expenses" value={`₹${totalExpenses.toLocaleString()}`} delta={0} deltaLabel="Sum of all expenses" icon={<Wallet className="w-5 h-5" />} color="#F59E0B" />
        <StatCard label="Monthly Profit" value={`₹${netProfit.toLocaleString()}`} delta={0} deltaLabel="Revenue minus expenses" icon={<TrendingUp className="w-5 h-5" />} color="#22C55E" />
        <StatCard label="Pending Payments" value="₹0" delta={0} deltaLabel="0 members" icon={<Receipt className="w-5 h-5" />} color="#EF4444" />
        <StatCard label="Expired Memberships" value={String(expiredMembers.length)} deltaLabel="Need plan renewal" icon={<AlertCircle className="w-5 h-5" />} color="#EF4444" />
      </div>

      {/* Expired Memberships Alert & WhatsApp Reminders */}
      <div className="bg-card border border-border rounded-2xl p-5 border-amber-500/30 bg-amber-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-base">Expired Memberships Alert ({expiredMembers.length})</h3>
              <p className="text-muted-foreground text-xs">Members whose plans have expired — send instant WhatsApp renewal reminders</p>
            </div>
          </div>
          {expiredMembers.length > 0 && (
            <button
              onClick={onOpenBulkWhatsApp}
              className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition-colors cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              Notify All Expired on WhatsApp
            </button>
          )}
        </div>

        {expiredMembers.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground bg-card/50 rounded-xl border border-border/60">
            <Check className="w-8 h-8 text-green-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-sm text-foreground">No Expired Memberships!</p>
            <p className="text-xs text-muted-foreground mt-0.5">All gym members currently have active plan subscriptions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {expiredMembers.map(m => (
              <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-amber-500/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar initials={m.avatar || m.name.slice(0, 2).toUpperCase()} size="sm" />
                    <div>
                      <h4 className="text-foreground font-bold text-sm">{m.name}</h4>
                      <p className="text-muted-foreground text-xs font-mono">{m.id} · {m.phone}</p>
                    </div>
                  </div>
                  <Badge label="Expired" variant="danger" />
                </div>

                <div className="bg-secondary/60 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">Plan: </span>
                    <span className="text-foreground font-semibold">{m.plan}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expired: </span>
                    <span className="text-red-400 font-semibold">{m.expiry}</span>
                  </div>
                </div>

                <button
                  onClick={() => sendWhatsAppExpiryReminder(m)}
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow transition-colors cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  Send WhatsApp Expiry Reminder
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-foreground font-semibold">Revenue vs Expenses</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Monthly comparison for 2024</p>
            </div>
            <Btn variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Btn>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FF6B00" strokeWidth={2} fill="url(#rev)" dot={false} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#3B82F6" strokeWidth={2} fill="url(#exp)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="mb-5">
            <h3 className="text-foreground font-semibold">Membership Split</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Plan distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <RePieChart>
              <Pie data={membershipData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {membershipData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {membershipData.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-muted-foreground">{m.name}</span>
                </div>
                <span className="text-foreground font-semibold">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-foreground font-semibold">Weekly Attendance Trend</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Check-ins this week</p>
          </div>
          <span className="text-primary font-semibold text-sm">Total: 612</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<AttendanceTooltip />} />
            <Bar dataKey="checkins" fill="#FF6B00" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Attendance */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-semibold">Today's Attendance</h3>
            <Badge label={`${todayAttendance.length} Members`} variant="orange" />
          </div>
          <div className="space-y-3">
            {todayAttendance.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <Avatar initials={a.name.split(" ").map(n => n[0]).join("")} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{a.name}</p>
                  <p className="text-muted-foreground text-xs">{a.checkIn} — {a.checkOut}</p>
                </div>
                <Badge label={a.duration === "Active" ? "Active" : a.duration}
                  variant={a.duration === "Active" ? "success" : "muted"} />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Payments */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-semibold">Latest Payments</h3>
            <Btn variant="ghost" size="sm">View All</Btn>
          </div>
          <div className="space-y-3">
            {payments.slice(0, 5).map((p) => (
              <div key={p.invoice} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{p.member}</p>
                  <p className="text-muted-foreground text-xs">{p.invoice} · {p.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-foreground text-sm font-semibold">₹{p.paid.toLocaleString()}</p>
                  <Badge label={p.balance === 0 ? "Paid" : "Pending"} variant={p.balance === 0 ? "success" : "danger"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Members Page ─────────────────────────────────────────────────────────────
function MembersPage({ membersList, onOpenAddMember, onEditMember, onViewMember, onDeleteMember }: { membersList: MemberItem[]; onOpenAddMember: () => void; onEditMember: (m: MemberItem) => void; onViewMember: (m: MemberItem) => void; onDeleteMember: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const statusVariant = (s: string) => {
    if (s === "Active") return "success";
    if (s === "Expired") return "danger";
    if (s === "Suspended") return "warning";
    return "muted";
  };
  const payVariant = (s: string) => {
    if (s === "Paid") return "success";
    if (s === "Overdue") return "danger";
    if (s === "Pending") return "warning";
    if (s === "Partial") return "info";
    return "muted";
  };

  const filtered = membersList.filter(m =>
    (filterStatus === "All" || m.status === filterStatus) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <SectionHeader
        title="Members"
        subtitle={`${membersList.length} total members`}
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>Import</Btn>
            <Btn variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Btn>
            <Btn variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={onOpenAddMember}>Add Member</Btn>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {["All", "Active", "Expired", "Suspended"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${filterStatus === s
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Btn variant="secondary" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>More Filters</Btn>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Member", "Phone", "Plan", "Joined", "Expiry", "Trainer", "Status", "Payment", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${i === filtered.length - 1 ? "border-0" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={m.avatar} size="sm" />
                      <div>
                        <p className="text-foreground font-medium">{m.name}</p>
                        <p className="text-muted-foreground text-xs font-mono">{m.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.phone}</td>
                  <td className="px-4 py-3">
                    <Badge label={m.plan} variant="info" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.joined}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.expiry}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.trainer}</td>
                  <td className="px-4 py-3"><Badge label={m.status} variant={statusVariant(m.status) as any} /></td>
                  <td className="px-4 py-3"><Badge label={m.payment} variant={payVariant(m.payment) as any} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => sendWhatsAppExpiryReminder(m)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-[#25D366] transition-colors cursor-pointer" title="Send WhatsApp Expiry Reminder"><WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" /></button>
                      <button onClick={() => onViewMember(m)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors cursor-pointer" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onEditMember(m)} className="p-1.5 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground transition-colors cursor-pointer" title="Edit Member"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDeleteMember(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors cursor-pointer" title="Delete Member"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <p className="text-muted-foreground">Showing {filtered.length} of {membersList.length} members</p>
        <div className="flex gap-1">
          {[1, 2, 3, "...", 12].map((p, i) => (
            <button key={i} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${p === 1 ? "bg-primary text-white" : "text-muted-foreground hover:bg-card hover:text-foreground border border-border"}`}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Page ──────────────────────────────────────────────────────────
function AttendancePage({
  attendanceList,
  membersList,
  onOpenCheckIn,
  onCheckOut,
  onDelete
}: {
  attendanceList: AttendanceItem[];
  membersList: MemberItem[];
  onOpenCheckIn: () => void;
  onCheckOut: (id: string, checkIn: string) => void;
  onDelete: (id: string, checkIn: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Filter logs based on search and tab selection
  const filteredLogs = attendanceList.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if the attendance date matches today's date
    const logDate = a.date || todayStr;
    const isToday = logDate === todayStr;

    if (activeTab === "today") {
      return matchesSearch && isToday;
    } else {
      return matchesSearch; // History shows all
    }
  });

  const checkinsToday = attendanceList.filter(a => (a.date || todayStr) === todayStr).length;
  const activeCount = attendanceList.filter(a => (a.date || todayStr) === todayStr && (!a.checkOut || a.checkOut === "—")).length;
  const completedCount = attendanceList.filter(a => (a.date || todayStr) === todayStr && (a.checkOut && a.checkOut !== "—")).length;

  return (
    <div>
      <SectionHeader
        title="Attendance"
        subtitle="Track member check-ins and check-outs"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Zap className="w-3.5 h-3.5" />} onClick={onOpenCheckIn}>QR Check-In</Btn>
            <Btn variant="primary" size="sm" icon={<UserCheck className="w-3.5 h-3.5" />} onClick={onOpenCheckIn}>Manual Check-In</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Check-ins" value={String(checkinsToday)} delta={0} icon={<CalendarCheck className="w-5 h-5" />} color="#FF6B00" />
        <StatCard label="Currently Active" value={String(activeCount)} icon={<Activity className="w-5 h-5" />} color="#22C55E" />
        <StatCard label="Completed Today" value={String(completedCount)} icon={<Clock className="w-5 h-5" />} color="#F59E0B" />
        <StatCard label="Avg Duration" value={completedCount > 0 ? "1h 12m" : "—"} icon={<Target className="w-5 h-5" />} color="#3B82F6" />
      </div>

      <div className="flex gap-2 mb-5">
        {(["today", "history"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer capitalize ${activeTab === t ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>
            {t === "today" ? "Today's Log" : "History"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="bg-secondary border border-border rounded-xl pl-9 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors w-full"
              placeholder="Search member..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-muted-foreground text-xs">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Member", "Member ID", "Check In", "Check Out", "Duration", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No attendance records found.</td>
              </tr>
            ) : (
              filteredLogs.map((a, i) => {
                const isActive = !a.checkOut || a.checkOut === "—";
                return (
                  <tr key={i} className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${i === filteredLogs.length - 1 ? "border-0" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={a.name.split(" ").map(n => n[0]).join("")} size="sm" />
                        <span className="text-foreground font-medium">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{a.id}</td>
                    <td className="px-4 py-3 text-foreground">{a.checkIn}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.checkOut || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge label={a.duration || "Active"} variant={isActive ? "orange" : "success"} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={isActive ? "Checked In" : "Completed"} variant={isActive ? "orange" : "success"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {isActive && (
                          <Btn variant="primary" size="sm" onClick={() => onCheckOut(a.id, a.checkIn)}>Check Out</Btn>
                        )}
                        <button onClick={() => onDelete(a.id, a.checkIn)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors cursor-pointer" title="Delete Log">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ─── Plans Page ───────────────────────────────────────────────────────────────
function PlansPage({ plansList, onOpenAddPlan, onEditPlan, onDeletePlan }: { plansList: PlanItem[]; onOpenAddPlan: () => void; onEditPlan: (p: PlanItem) => void; onDeletePlan: (name: string) => void }) {
  return (
    <div>
      <SectionHeader
        title="Membership Plans"
        subtitle="Manage pricing and plan features"
        action={<Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onOpenAddPlan}>Add New Plan</Btn>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plansList.map((plan) => (
          <div key={plan.name} className={`relative bg-card border rounded-2xl p-6 flex flex-col gap-4 transition-all hover:border-primary/60 ${plan.popular ? "border-primary" : "border-border"}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Popular
                </span>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">{plan.duration}</p>
              <h3 className="text-foreground text-xl font-bold">{plan.name}</h3>
              <div className="mt-3">
                <span className="text-primary text-3xl font-black">₹{plan.price.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm"> / {plan.duration.toLowerCase()}</span>
              </div>
            </div>
            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <Btn variant="primary" size="sm">Assign</Btn>
              <Btn variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => onEditPlan(plan)}>Edit</Btn>
              <button onClick={() => onDeletePlan(plan.name)} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer" title="Delete Plan">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payments Page ────────────────────────────────────────────────────────────
function PaymentsPage({ paymentsList, membersList, onOpenAddPayment, onDeletePayment, onViewReceipt }: { paymentsList: PaymentItem[]; membersList: MemberItem[]; onOpenAddPayment: () => void; onDeletePayment: (invoice: string) => void; onViewReceipt: (p: PaymentItem) => void }) {
  const totalAmount = paymentsList.reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = paymentsList.reduce((acc, p) => acc + p.paid, 0);
  const totalBalance = paymentsList.reduce((acc, p) => acc + p.balance, 0);
  const outstandingCount = paymentsList.filter(p => p.balance > 0).length;

  const sendWhatsAppInvoice = (p: PaymentItem) => {
    const matchedMember = membersList.find(m => m.name.toLowerCase() === p.member.toLowerCase());
    shareInvoicePDFOnWhatsApp(p, matchedMember?.phone);
  };

  return (
    <div>
      <SectionHeader
        title="Payments"
        subtitle="Track collections and outstanding dues"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={onOpenAddPayment}>Generate Invoice</Btn>
            <Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onOpenAddPayment}>Receive Payment</Btn>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Collection" value={`₹${totalPaid.toLocaleString()}`} delta={0} icon={<DollarSign className="w-5 h-5" />} color="#22C55E" />
        <StatCard label="Monthly Collection" value={`₹${totalPaid.toLocaleString()}`} delta={0} icon={<Banknote className="w-5 h-5" />} color="#3B82F6" />
        <StatCard label="Pending Amount" value={`₹${totalBalance.toLocaleString()}`} delta={0} icon={<AlertCircle className="w-5 h-5" />} color="#EF4444" />
        <StatCard label="Outstanding Members" value={String(outstandingCount)} icon={<Users className="w-5 h-5" />} color="#F59E0B" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Invoice", "Member", "Amount", "Discount", "Tax", "Paid", "Balance", "Mode", "Date", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paymentsList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No payments received yet.</td>
                </tr>
              ) : (
                paymentsList.map((p, i) => (
                  <tr key={p.invoice} className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${i === paymentsList.length - 1 ? "border-0" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.invoice}</td>
                    <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">{p.member}</td>
                    <td className="px-4 py-3 text-foreground font-semibold">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">{p.discount > 0 ? `-₹${p.discount.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">₹{p.tax.toLocaleString()}</td>
                    <td className="px-4 py-3 text-foreground font-bold">₹{p.paid.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {p.balance > 0 ? <span className="text-red-400 font-semibold">₹{p.balance.toLocaleString()}</span> : <span className="text-green-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.mode}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            // Trigger native browser printing window fallback with premium styling
                            const printWindow = window.open("", "_blank");
                            if (printWindow) {
                              const calculatedTotal = p.amount + p.tax - p.discount;
                              printWindow.document.write(`
                                <html>
                                <head>
                                  <title>Invoice - ${p.invoice}</title>
                                  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                                  <style>
                                    * { margin: 0; padding: 0; box-sizing: border-box; }
                                    body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px 20px; background-color: #f8fafc; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                    .invoice-card { max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); overflow: hidden; padding: 40px; }
                                    .invoice-header { display: flex; justify-content: space-between; align-items: start; border-b: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
                                    .brand { display: flex; align-items: center; gap: 8px; }
                                    .brand-icon { width: 32px; height: 32px; background: #FF6B00; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
                                    .brand-name { font-size: 20px; font-weight: 800; color: #0f172a; }
                                    .invoice-title { text-align: right; }
                                    .invoice-title h1 { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
                                    .invoice-meta { margin-top: 4px; font-size: 13px; color: #64748b; font-weight: 500; }
                                    .meta-grid { display: grid; grid-cols: 2; gap: 24px; margin-bottom: 32px; }
                                    .meta-col { display: flex; flex-direction: column; gap: 4px; }
                                    .meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
                                    .meta-value { font-size: 14px; font-weight: 600; color: #334155; }
                                    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; text-align: left; }
                                    .invoice-table th { padding: 12px 16px; background: #f8fafc; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
                                    .invoice-table td { padding: 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0; }
                                    .totals-section { display: flex; justify-content: flex-end; }
                                    .totals-table { width: 280px; font-size: 14px; }
                                    .totals-table tr td { padding: 8px 0; }
                                    .totals-table tr td:last-child { text-align: right; font-weight: 600; color: #0f172a; }
                                    .totals-table tr.grand-total td { font-size: 18px; font-weight: 800; color: #FF6B00; border-top: 2px solid #e2e8f0; padding-top: 12px; }
                                    .footer-note { text-align: center; margin-top: 40px; padding-top: 20px; border-t: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; font-weight: 500; }
                                    .btn-container { display: flex; gap: 12px; justify-content: center; margin-top: 30px; }
                                    .btn-action { padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; border: 0; transition: opacity 0.2s; }
                                    .btn-print { background: #FF6B00; color: white; }
                                    .btn-whatsapp { background: #25D366; color: white; }
                                    .btn-close { background: #e2e8f0; color: #475569; }
                                    .btn-action:hover { opacity: 0.9; }
                                    @media print { .btn-container { display: none; } body { padding: 0; background: #fff; } .invoice-card { border: 0; box-shadow: none; padding: 0; } }
                                  </style>
                                </head>
                                <body>
                                  <div class="invoice-card">
                                    <div class="invoice-header">
                                      <div class="brand">
                                        <div class="brand-icon">G</div>
                                        <div class="brand-name">Champions Gym</div>
                                      </div>
                                      <div class="invoice-title">
                                        <h1>INVOICE</h1>
                                        <div class="invoice-meta">#${p.invoice}</div>
                                      </div>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
                                      <div class="meta-col">
                                        <span class="meta-label">Billed To</span>
                                        <span class="meta-value" style="font-size: 16px; color: #0f172a;">${p.member}</span>
                                      </div>
                                      <div style="display: flex; gap: 40px;">
                                        <div class="meta-col" style="text-align: right;">
                                          <span class="meta-label">Date Issued</span>
                                          <span class="meta-value">${p.date}</span>
                                        </div>
                                        <div class="meta-col" style="text-align: right;">
                                          <span class="meta-label">Payment Mode</span>
                                          <span class="meta-value">${p.mode}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <table class="invoice-table">
                                      <thead>
                                        <tr>
                                          <th>Description</th>
                                          <th style="text-align: right;">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td>
                                            <div style="font-weight: 600; color: #0f172a;">Gym Membership Subscription</div>
                                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Standard Subscription Fees</div>
                                          </td>
                                          <td style="text-align: right; font-weight: 600;">₹${p.amount.toLocaleString()}</td>
                                        </tr>
                                      </tbody>
                                    </table>

                                    <div class="totals-section">
                                      <table class="totals-table">
                                        <tr>
                                          <td style="color: #64748b;">Subtotal</td>
                                          <td>₹${p.amount.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                          <td style="color: #64748b;">Tax (18% GST)</td>
                                          <td>+₹${p.tax.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                          <td style="color: #64748b;">Discount</td>
                                          <td style="color: #22c55e;">-₹${p.discount.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                          <td style="color: #64748b;">Total Paid</td>
                                          <td>₹${p.paid.toLocaleString()}</td>
                                        </tr>
                                        <tr class="grand-total">
                                          <td>Balance Due</td>
                                          <td>₹${p.balance.toLocaleString()}</td>
                                        </tr>
                                      </table>
                                    </div>

                                    <div class="footer-note">
                                      <p style="margin-bottom: 4px; font-weight: 600; color: #475569;">Thank you for your training with GymPro!</p>
                                      <p>For any billing queries, please contact gym administration.</p>
                                    </div>
                                  </div>

                                  <div class="btn-container">
                                    <button class="btn-action btn-close" onclick="window.close()">Close Window</button>
                                    <button class="btn-action btn-whatsapp" onclick="window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('🧾 GymPro Invoice ${p.invoice}\\nMember: ${p.member}\\nTotal Paid: ₹${p.paid.toLocaleString()}\\nBalance Due: ₹${p.balance.toLocaleString()}'), '_blank')">Share Invoice on WhatsApp</button>
                                    <button class="btn-action btn-print" onclick="window.print()">Print / Save PDF</button>
                                  </div>
                                </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors cursor-pointer"
                          title="Generate Invoice / Print PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => sendWhatsAppInvoice(p)}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 text-[#25D366] transition-colors cursor-pointer"
                          title="Share Invoice on WhatsApp"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                        </button>
                        {p.receiptUrl && (
                          <button
                            onClick={() => onViewReceipt(p)}
                            className="p-1.5 rounded-lg hover:bg-orange-500/10 text-orange-400 transition-colors cursor-pointer"
                            title="View Receipt Screenshot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => onDeletePayment(p.invoice)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors cursor-pointer" title="Delete Payment"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Page ────────────────────────────────────────────────────────────
function ExpensesPage({ expensesList, onOpenAddExpense, onDeleteExpense }: { expensesList: ExpenseItem[]; onOpenAddExpense: () => void; onDeleteExpense: (index: number) => void }) {
  const categoryColors: Record<string, string> = {
    Rent: "#EF4444", Electricity: "#F59E0B", Salary: "#3B82F6",
    Equipment: "#A855F7", Maintenance: "#22C55E", Marketing: "#FF6B00", Miscellaneous: "#64748B",
  };
  const totalExp = expensesList.reduce((acc, curr) => acc + curr.amount, 0);
  return (
    <div>
      <SectionHeader
        title="Expenses"
        subtitle="Monitor and manage operational costs"
        action={<Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onOpenAddExpense}>Add Expense</Btn>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Expenses" value={`₹${totalExp.toLocaleString()}`} icon={<Wallet className="w-5 h-5" />} color="#EF4444" />
        <StatCard label="Total Items" value={`${expensesList.length}`} icon={<BarChart3 className="w-5 h-5" />} color="#F59E0B" />
        <StatCard label="Pending Bills" value="₹0" icon={<AlertCircle className="w-5 h-5" />} color="#A855F7" />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Title", "Category", "Amount", "Vendor", "Date", "Mode", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expensesList.map((e, i) => (
                <tr key={i} className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${i === expensesList.length - 1 ? "border-0" : ""}`}>
                  <td className="px-4 py-3 text-foreground font-medium">{e.title}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: categoryColors[e.category] ?? "#64748B" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[e.category] ?? "#64748B" }} />
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground font-semibold">₹{e.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.vendor}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.mode}</td>
                  <td className="px-4 py-3"><Badge label={e.status} variant={e.status === "Paid" ? "success" : "warning"} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDeleteExpense(i)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Trainers Page ────────────────────────────────────────────────────────────
function TrainersPage({ trainersList, onOpenAddTrainer, onDeleteTrainer }: { trainersList: TrainerItem[]; onOpenAddTrainer: () => void; onDeleteTrainer: (name: string) => void }) {
  return (
    <div>
      <SectionHeader
        title="Trainers"
        subtitle="Manage your fitness professionals"
        action={<Btn variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={onOpenAddTrainer}>Add Trainer</Btn>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {trainersList.map((t) => (
          <div key={t.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between">
              <Avatar initials={t.avatar} size="lg" />
              <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-xs font-semibold">{t.rating}</span>
              </div>
            </div>
            <div>
              <h3 className="text-foreground font-bold text-base">{t.name}</h3>
              <p className="text-primary text-xs font-semibold mt-0.5">{t.specialization}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/60 rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Experience</p>
                <p className="text-foreground text-sm font-semibold mt-0.5">{t.experience}</p>
              </div>
              <div className="bg-secondary/60 rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Members</p>
                <p className="text-foreground text-sm font-semibold mt-0.5">{t.members} assigned</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-foreground font-bold text-sm">{t.salary}<span className="text-muted-foreground font-normal text-xs">/mo</span></span>
              <div className="flex gap-1.5">
                <Btn variant="secondary" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>View</Btn>
                <button onClick={() => onDeleteTrainer(t.name)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Workout Plans Page ───────────────────────────────────────────────────────
function WorkoutPage() {
  const categories = ["Strength", "Cardio", "HIIT", "Yoga", "CrossFit", "Flexibility"];
  const exercises = [
    { name: "Barbell Back Squat", category: "Strength", sets: "4", reps: "8–10", rest: "2 min", muscle: "Quads, Glutes" },
    { name: "Incline Dumbbell Press", category: "Strength", sets: "3", reps: "10–12", rest: "90 sec", muscle: "Chest, Shoulders" },
    { name: "Treadmill HIIT", category: "HIIT", sets: "8", reps: "30s on / 30s off", rest: "2 min", muscle: "Full Body" },
    { name: "Deadlift", category: "Strength", sets: "4", reps: "6–8", rest: "3 min", muscle: "Hamstrings, Back" },
    { name: "Pull-ups", category: "Strength", sets: "3", reps: "To Failure", rest: "90 sec", muscle: "Lats, Biceps" },
    { name: "Box Jumps", category: "HIIT", sets: "4", reps: "10", rest: "60 sec", muscle: "Legs, Core" },
  ];

  return (
    <div>
      <SectionHeader
        title="Workout Plans"
        subtitle="Build and assign training programs"
        action={<Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Create Plan</Btn>}
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(c => (
          <button key={c} className="px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors cursor-pointer">
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exercises.map((e, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <Badge label={e.category} variant="info" />
            </div>
            <h3 className="text-foreground font-bold mb-1">{e.name}</h3>
            <p className="text-muted-foreground text-xs mb-3">{e.muscle}</p>
            <div className="grid grid-cols-3 gap-2">
              {[["Sets", e.sets], ["Reps", e.reps], ["Rest", e.rest]].map(([k, v]) => (
                <div key={k} className="bg-secondary/60 rounded-xl p-2 text-center">
                  <p className="text-muted-foreground text-xs">{k}</p>
                  <p className="text-foreground text-xs font-bold mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Btn variant="primary" size="sm">Assign</Btn>
              <Btn variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />}>Edit</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Diet Plans Page ──────────────────────────────────────────────────────────
function DietPage() {
  const meals = [
    { meal: "Breakfast", time: "7:00 AM", items: ["Oatmeal with berries", "2 Boiled eggs", "Whey protein shake"], cal: 520, protein: 38, carbs: 65, fat: 12 },
    { meal: "Lunch", time: "1:00 PM", items: ["Grilled chicken breast", "Brown rice (1 cup)", "Steamed broccoli", "Mixed salad"], cal: 680, protein: 52, carbs: 78, fat: 14 },
    { meal: "Snack", time: "4:30 PM", items: ["Greek yogurt", "Mixed nuts (30g)", "Apple"], cal: 310, protein: 18, carbs: 35, fat: 10 },
    { meal: "Dinner", time: "8:00 PM", items: ["Salmon fillet (200g)", "Sweet potato", "Sautéed spinach"], cal: 540, protein: 45, carbs: 48, fat: 16 },
  ];
  const total = { cal: 2050, protein: 153, carbs: 226, fat: 52 };
  const mealColors: Record<string, string> = { Breakfast: "#F59E0B", Lunch: "#22C55E", Snack: "#3B82F6", Dinner: "#A855F7" };

  return (
    <div>
      <SectionHeader
        title="Diet Plans"
        subtitle="Nutrition programs and meal tracking"
        action={<Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Create Diet Plan</Btn>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["Total Calories", `${total.cal} kcal`, "#FF6B00"], ["Protein", `${total.protein}g`, "#22C55E"], ["Carbs", `${total.carbs}g`, "#3B82F6"], ["Fat", `${total.fat}g`, "#F59E0B"]].map(([l, v, c]) => (
          <div key={l as string} className="bg-card border border-border rounded-2xl p-5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">{l}</p>
            <p className="text-foreground text-2xl font-bold" style={{ color: c as string }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meals.map((m) => (
          <div key={m.meal} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: mealColors[m.meal] + "22" }}>
                  <Apple className="w-5 h-5" style={{ color: mealColors[m.meal] }} />
                </div>
                <div>
                  <h3 className="text-foreground font-bold">{m.meal}</h3>
                  <p className="text-muted-foreground text-xs">{m.time}</p>
                </div>
              </div>
              <span className="text-primary font-bold text-sm">{m.cal} kcal</span>
            </div>
            <ul className="space-y-1 mb-4">
              {m.items.map(item => (
                <li key={item} className="text-muted-foreground text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
              {[["Protein", `${m.protein}g`, "#22C55E"], ["Carbs", `${m.carbs}g`, "#3B82F6"], ["Fat", `${m.fat}g`, "#F59E0B"]].map(([k, v, c]) => (
                <div key={k as string} className="text-center">
                  <p className="text-muted-foreground text-xs">{k}</p>
                  <p className="font-bold text-sm mt-0.5" style={{ color: c as string }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
function ReportsPage() {
  const reportTypes = [
    { name: "Revenue Report", desc: "Monthly revenue breakdown", icon: <DollarSign className="w-5 h-5" />, color: "#FF6B00" },
    { name: "Expense Report", desc: "Category-wise expenditure", icon: <Wallet className="w-5 h-5" />, color: "#3B82F6" },
    { name: "Attendance Report", desc: "Member check-in analytics", icon: <CalendarCheck className="w-5 h-5" />, color: "#22C55E" },
    { name: "Membership Report", desc: "Plan distribution & renewals", icon: <Award className="w-5 h-5" />, color: "#F59E0B" },
    { name: "Payment Report", desc: "Collection & outstanding dues", icon: <Receipt className="w-5 h-5" />, color: "#A855F7" },
    { name: "Trainer Performance", desc: "Trainer ratings & metrics", icon: <Star className="w-5 h-5" />, color: "#EF4444" },
  ];
  return (
    <div>
      <SectionHeader title="Reports" subtitle="Generate and export comprehensive reports" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reportTypes.map((r) => (
          <div key={r.name} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors flex flex-col gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: r.color + "20" }}>
              <span style={{ color: r.color }}>{r.icon}</span>
            </div>
            <div>
              <h3 className="text-foreground font-bold">{r.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{r.desc}</p>
            </div>
            <div className="flex gap-2 mt-auto">
              <Btn variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>PDF</Btn>
              <Btn variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Excel</Btn>
              <Btn variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>CSV</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────
function NotificationsPage({ notificationsList }: { notificationsList: { type: string; message: string; time: string; read: boolean }[] }) {
  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    expiry: { icon: <AlertCircle className="w-4 h-4" />, color: "#EF4444" },
    payment: { icon: <CreditCard className="w-4 h-4" />, color: "#F59E0B" },
    birthday: { icon: <Star className="w-4 h-4" />, color: "#A855F7" },
    alert: { icon: <Bell className="w-4 h-4" />, color: "#3B82F6" },
    renewal: { icon: <RefreshCw className="w-4 h-4" />, color: "#22C55E" },
  };
  return (
    <div>
      <SectionHeader
        title="Notifications"
        subtitle="Stay on top of important updates"
        action={<Btn variant="ghost" size="sm">Mark all read</Btn>}
      />
      <div className="space-y-3">
        {notificationsList.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">No notifications present.</p>
        ) : (
          notificationsList.map((n, i) => {
            const cfg = iconMap[n.type] ?? { icon: <Bell className="w-4 h-4" />, color: "#FF6B00" };
            return (
              <div key={i} className={`bg-card border rounded-2xl p-4 flex items-center gap-4 transition-colors hover:border-primary/30 ${n.read ? "border-border opacity-60" : "border-border"}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.color + "20" }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{n.message}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{n.time}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
// ─── Settings Page ────────────────────────────────────────────────────────────
function SettingsPage({
  usersList,
  auditLogsList,
  onAddUser,
  onDeleteUser
}: {
  usersList: GymUser[];
  auditLogsList: AuditLogItem[];
  onAddUser: (u: GymUser) => void;
  onDeleteUser: (id: string) => void;
}) {
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Manager');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;

    onAddUser({
      id: `usr-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
  };

  const sections = [
    {
      title: "Gym Profile",
      fields: [
        { label: "Gym Name", value: "Champions Gym & Fitness" },
        { label: "GST Number", value: "29ABCDE1234F1Z5" },
        { label: "Phone", value: "+91 80 4567 8901" },
        { label: "Email", value: "admin@championsgym.com" },
        { label: "Address", value: "123, MG Road, Bengaluru, Karnataka 560001" },
        { label: "Working Hours", value: "5:00 AM – 11:00 PM (Mon–Sun)" },
      ]
    },
    {
      title: "Financial Settings",
      fields: [
        { label: "Currency", value: "INR (₹)" },
        { label: "GST Rate", value: "18%" },
        { label: "Late Fee", value: "₹100 per week" },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Configure your gym profile, user roles & audit logs" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map(s => (
          <div key={s.title} className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-foreground font-bold mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> {s.title}
            </h3>
            <div className="space-y-4">
              {s.fields.map(f => (
                <div key={f.label}>
                  <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block mb-1">{f.label}</label>
                  <input
                    defaultValue={f.value}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
              ))}
              <Btn variant="primary">Save Changes</Btn>
            </div>
          </div>
        ))}

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-foreground font-bold mb-5 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" /> Logo & Branding
          </h3>
          <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-primary/40 transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold text-sm mb-1">Upload Gym Logo</p>
            <p className="text-muted-foreground text-xs">PNG, JPG up to 5MB · Recommended 512×512</p>
            <Btn variant="secondary" size="sm">Browse File</Btn>
          </div>
        </div>

        {/* User Management Module */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="text-foreground font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> User Management
          </h3>
          
          {/* Add user form */}
          <form onSubmit={handleAddSubmit} className="space-y-3 p-4 bg-secondary/40 border border-border rounded-xl">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Create New User Profile</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                placeholder="Full Name"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/60"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/60"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUserPassword}
                onChange={e => setNewUserPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/60"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/60 flex-1"
              >
                <option value="Admin">Admin (Full Access)</option>
                <option value="Manager">Manager (Dues/Members)</option>
                <option value="Trainer">Trainer (Workouts/Diets)</option>
                <option value="Receptionist">Receptionist (Check-in/Members)</option>
              </select>
              <button type="submit" className="bg-primary hover:opacity-90 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer">
                Create User
              </button>
            </div>
          </form>

          {/* User List */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered Portal Users</p>
            {usersList.length === 0 ? (
              <p className="text-muted-foreground text-xs">No portal users configured.</p>
            ) : (
              usersList.map((usr) => (
                <div key={usr.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground text-sm font-semibold">{usr.name}</p>
                      <Badge label={usr.role} variant={usr.role === "Admin" ? "orange" : "info"} />
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">{usr.email} · Password: <span className="font-mono text-slate-300">{usr.password ? '••••••••' : 'Default'}</span></p>
                  </div>
                  {usr.role !== "Admin" && (
                    <button
                      onClick={() => onDeleteUser(usr.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Database Audit Activity Log */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-foreground font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Database Audit Logs & Activity History
            </h3>
            <span className="text-xs text-muted-foreground font-mono">{auditLogsList.length} Entries Logged</span>
          </div>
          <p className="text-muted-foreground text-xs">Complete audit trail of which user created, modified, or deleted records in the system</p>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[600px]">
                <thead className="sticky top-0 bg-secondary border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-muted-foreground uppercase font-bold whitespace-nowrap">Timestamp</th>
                    <th className="px-3 py-2 text-muted-foreground uppercase font-bold whitespace-nowrap">User / Admin</th>
                    <th className="px-3 py-2 text-muted-foreground uppercase font-bold whitespace-nowrap">Action</th>
                    <th className="px-3 py-2 text-muted-foreground uppercase font-bold whitespace-nowrap">Category</th>
                    <th className="px-3 py-2 text-muted-foreground uppercase font-bold whitespace-nowrap">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {auditLogsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">No audit logs recorded yet.</td>
                    </tr>
                  ) : (
                    auditLogsList.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/40">
                        <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-foreground">{log.userName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{log.userEmail} ({log.userRole})</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            log.action.toLowerCase().includes('delete')
                              ? 'bg-red-500/20 text-red-400'
                              : log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('edit')
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-foreground">{log.category}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder Pages ────────────────────────────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-80 gap-4">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
        <Dumbbell className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-foreground text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground text-sm">This module is coming soon.</p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dynamic state loaded from DB
  const [membersList, setMembersList] = useState<MemberItem[]>([]);
  const [plansList, setPlansList] = useState<PlanItem[]>([]);
  const [trainersList, setTrainersList] = useState<TrainerItem[]>([]);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [usersList, setUsersList] = useState<GymUser[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>([]);

  // Modal Visibility States
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [viewingMember, setViewingMember] = useState<MemberItem | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<PaymentItem | null>(null);

  const [notificationsList, setNotificationsList] = useState<{ type: string; message: string; time: string; read: boolean }[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<GymUser | null>(() => {
    try {
      const stored = localStorage.getItem("fitpeak_gym_session");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    // Hide native splash screen once React mounts
    SplashScreen.hide().catch(() => {});
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both registered email and password.");
      return;
    }

    // Search email in usersList
    const matched = usersList.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!matched) {
      setLoginError("Access denied. Email address not registered in system users list.");
      return;
    }

    if (matched.password && matched.password !== loginPassword) {
      setLoginError("Incorrect password. Please verify your credentials.");
      return;
    }

    setLoggedInUser(matched);
    try {
      localStorage.setItem("fitpeak_gym_session", JSON.stringify(matched));
    } catch {}
    setLoginError("");
    logUserActivity(matched, "User Login", "Auth", `User ${matched.name} logged into portal`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  // Initial DB Load & Expiry Checker
  useEffect(() => {
    getMembersDB().then(setMembersList);
    getPlansDB().then(setPlansList);
    getTrainersDB().then(setTrainersList);
    getExpensesDB().then(setExpensesList);
    getPaymentsDB().then(setPaymentsList);
    getAttendanceDB().then(setAttendanceList);
    getUsersDB().then(setUsersList);
    getAuditLogsDB().then(setAuditLogsList);
  }, []);

  // Expiry Checker Alert logic
  useEffect(() => {
    if (membersList.length === 0) return;
    
    const expiredMembers = membersList.filter(m => {
      if (!m.expiry) return false;
      const expDate = new Date(m.expiry);
      if (isNaN(expDate.getTime())) return false; // Skip invalid dates
      return expDate < new Date();
    });

    if (expiredMembers.length > 0) {
      // Add system notifications dynamically
      const newNotifications = expiredMembers.map(m => ({
        type: "expiry",
        message: `Alert: Membership for ${m.name} has expired on ${m.expiry}!`,
        time: "Just now",
        read: false
      }));
      setNotificationsList(prev => {
        // Prevent duplicate alerts in state
        const unique = [...newNotifications, ...prev].filter((v, i, a) => 
          a.findIndex(t => t.message === v.message) === i
        );
        return unique;
      });

      // System notifications are added dynamically
    }
  }, [membersList]);

  const handleAddMember = async (m: MemberItem) => {
    const newM = await addMemberDB(m);
    setMembersList(prev => [newM, ...prev]);
    logUserActivity(loggedInUser, "Create Member", "Member", `Added member ${m.name} (${m.id})`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleUpdateMember = async (m: MemberItem) => {
    const updated = await updateMemberDB(m);
    setMembersList(prev => prev.map(item => item.id === updated.id ? updated : item));
    setEditingMember(null);
    logUserActivity(loggedInUser, "Update Member", "Member", `Updated details for ${m.name} (${m.id})`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleDeleteMember = async (id: string) => {
    await deleteMemberDB(id);
    setMembersList(prev => prev.filter(m => m.id !== id));
    logUserActivity(loggedInUser, "Delete Member", "Member", `Deleted member ID ${id}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleAddPlan = async (p: PlanItem) => {
    const newP = await addPlanDB(p);
    setPlansList(prev => [newP, ...prev]);
    logUserActivity(loggedInUser, "Create Plan", "Plan", `Created plan ${p.name} (₹${p.price})`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleUpdatePlan = async (p: PlanItem, oldName: string) => {
    const updated = await updatePlanDB(p, oldName);
    setPlansList(prev => prev.map(item => item.name === oldName ? updated : item));
    setEditingPlan(null);
    logUserActivity(loggedInUser, "Update Plan", "Plan", `Updated plan ${p.name}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleDeletePlan = async (name: string) => {
    await deletePlanDB(name);
    setPlansList(prev => prev.filter(p => p.name !== name));
    logUserActivity(loggedInUser, "Delete Plan", "Plan", `Deleted plan ${name}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleAddTrainer = async (t: TrainerItem) => {
    const newT = await addTrainerDB(t);
    setTrainersList(prev => [newT, ...prev]);
    logUserActivity(loggedInUser, "Create Trainer", "Trainer", `Added trainer ${t.name}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleDeleteTrainer = async (name: string) => {
    await deleteTrainerDB(name);
    setTrainersList(prev => prev.filter(t => t.name !== name));
    logUserActivity(loggedInUser, "Delete Trainer", "Trainer", `Deleted trainer ${name}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleAddExpense = async (e: ExpenseItem) => {
    const newE = await addExpenseDB(e);
    setExpensesList(prev => [newE, ...prev]);
    logUserActivity(loggedInUser, "Create Expense", "Expense", `Recorded expense ${e.title} (₹${e.amount})`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleDeleteExpense = async (idx: number) => {
    await deleteExpenseDB(idx);
    setExpensesList(prev => prev.filter((_, i) => i !== idx));
    logUserActivity(loggedInUser, "Delete Expense", "Expense", `Deleted expense index ${idx}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleAddPayment = async (p: PaymentItem) => {
    const newP = await addPaymentDB(p);
    setPaymentsList(prev => [newP, ...prev]);
    logUserActivity(loggedInUser, "Create Invoice", "Payment", `Recorded payment ₹${p.paid} for ${p.member} (${p.invoice})`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleDeletePayment = async (invoice: string) => {
    await deletePaymentDB(invoice);
    setPaymentsList(prev => prev.filter(p => p.invoice !== invoice));
    logUserActivity(loggedInUser, "Delete Payment", "Payment", `Deleted invoice ${invoice}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleCheckIn = async (item: AttendanceItem) => {
    const newA = await addAttendanceDB(item);
    setAttendanceList(prev => [newA, ...prev]);
  };

  const handleCheckOut = async (id: string, checkInTime: string) => {
    const matched = attendanceList.find(a => a.id === id && a.checkIn === checkInTime);
    if (!matched) return;
    
    // Calculate duration details (e.g. 1h 15m)
    let duration = "Active";
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const start = new Date(`${todayStr}T${checkInTime}`);
      const now = new Date();
      if (!isNaN(start.getTime())) {
        const diffMs = now.getTime() - start.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins > 0) {
          const hrs = Math.floor(mins / 60);
          const remMins = mins % 60;
          duration = hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
        } else {
          duration = "1m";
        }
      }
    } catch {}

    const checkOutTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const updated: AttendanceItem = {
      ...matched,
      checkOut: checkOutTime,
      duration
    };
    await updateAttendanceDB(updated);
    setAttendanceList(prev => prev.map(a => (a.id === id && a.checkIn === checkInTime) ? updated : a));
  };

  const handleDeleteAttendance = async (id: string, checkIn: string) => {
    await deleteAttendanceDB(id, checkIn);
    setAttendanceList(prev => prev.filter(a => !(a.id === id && a.checkIn === checkIn)));
  };

  const handleAddUser = async (u: GymUser) => {
    const newU = await addUserDB(u);
    setUsersList(prev => [newU, ...prev]);
    logUserActivity(loggedInUser, "Create User", "User", `Created user ${u.name} (${u.email}) - Role: ${u.role}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUserDB(id);
    setUsersList(prev => prev.filter(u => u.id !== id));
    logUserActivity(loggedInUser, "Delete User", "User", `Deleted user ID ${id}`).then(log => setAuditLogsList(prev => [log, ...prev]));
  };

  const pageComponents: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage members={membersList} plans={plansList} trainers={trainersList} expenses={expensesList} onOpenBulkWhatsApp={() => setIsBulkWhatsAppOpen(true)} />,
    members: (
      <MembersPage
        membersList={membersList}
        onOpenAddMember={() => setIsMemberModalOpen(true)}
        onEditMember={(m) => setEditingMember(m)}
        onViewMember={(m) => setViewingMember(m)}
        onDeleteMember={handleDeleteMember}
      />
    ),
    attendance: (
      <AttendancePage
        attendanceList={attendanceList}
        membersList={membersList}
        onOpenCheckIn={() => setIsAttendanceModalOpen(true)}
        onCheckOut={handleCheckOut}
        onDelete={handleDeleteAttendance}
      />
    ),
    plans: (
      <PlansPage
        plansList={plansList}
        onOpenAddPlan={() => setIsPlanModalOpen(true)}
        onEditPlan={(p) => setEditingPlan(p)}
        onDeletePlan={handleDeletePlan}
      />
    ),
    payments: (
      <PaymentsPage
        paymentsList={paymentsList}
        membersList={membersList}
        onOpenAddPayment={() => setIsPaymentModalOpen(true)}
        onDeletePayment={handleDeletePayment}
        onViewReceipt={(p) => setViewingReceipt(p)}
      />
    ),
    expenses: (
      <ExpensesPage
        expensesList={expensesList}
        onOpenAddExpense={() => setIsExpenseModalOpen(true)}
        onDeleteExpense={handleDeleteExpense}
      />
    ),
    trainers: (
      <TrainersPage
        trainersList={trainersList}
        onOpenAddTrainer={() => setIsTrainerModalOpen(true)}
        onDeleteTrainer={handleDeleteTrainer}
      />
    ),
    workout: <WorkoutPage />,
    diet: <DietPage />,
    reports: <ReportsPage />,
    notifications: <NotificationsPage notificationsList={notificationsList} />,
    settings: (
      <SettingsPage
        usersList={usersList}
        auditLogsList={auditLogsList}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
      />
    ),
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "members", label: "Members", icon: <Users className="w-4 h-4" /> },
    { id: "attendance", label: "Attendance", icon: <CalendarCheck className="w-4 h-4" /> },
    { id: "plans", label: "Plans", icon: <CreditCard className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "expenses", label: "Expenses", icon: <DollarSign className="w-4 h-4" /> },
    { id: "trainers", label: "Trainers", icon: <Award className="w-4 h-4" /> },
    { id: "workout", label: "Workout Plans", icon: <Dumbbell className="w-4 h-4" /> },
    { id: "diet", label: "Diet Plans", icon: <Apple className="w-4 h-4" /> },
    { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />, badge: notificationsList.filter(n => !n.read).length || undefined },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const currentLabel = navItems.find(n => n.id === activePage)?.label ?? "Dashboard";
  const unreadCount = notificationsList.filter(n => !n.read).length;
  if (!loggedInUser) {
    return (
      <div className="flex h-screen w-screen bg-[#0F172A] items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-card/65 border border-border/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative max-h-[95vh] overflow-y-auto my-auto">
          <div className="flex flex-col items-center text-center gap-2 mb-8">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-foreground text-2xl font-black tracking-tight mt-2">Welcome to Champions Gym</h1>
            <p className="text-muted-foreground text-sm">Sign in to access your administrative dashboard</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Registered Email Address</label>
              <input
                type="email"
                placeholder="e.g. admin@championsgym.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
                required
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-xs font-medium leading-relaxed bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">{loginError}</p>
            )}

            <button type="submit" className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-sm">
              Sign In to Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 lg:z-auto h-full flex flex-col
        bg-sidebar border-r border-sidebar-border transition-all duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarOpen ? "w-60" : "w-16"}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${sidebarOpen ? "" : "justify-center px-0"}`}>
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-4.5 h-4.5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-foreground font-black text-sm leading-tight">Champions Gym</p>
              <p className="text-muted-foreground text-xs leading-tight">Manager</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActivePage(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer relative
                  ${active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }
                  ${!sidebarOpen ? "justify-center px-0" : ""}
                `}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className={`flex-shrink-0 ${active ? "text-primary" : ""}`}>{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && item.badge !== undefined && (
                  <span className="ml-auto bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
                {!sidebarOpen && item.badge !== undefined && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <button
            className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top nav */}
        <header className="bg-sidebar border-b border-sidebar-border px-5 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors cursor-pointer" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
              placeholder="Search members, payments..."
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsMemberModalOpen(true)}>
              <span className="hidden sm:inline">Quick Add</span>
            </Btn>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-muted-foreground hover:bg-card hover:text-foreground transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Date */}
            <span className="text-muted-foreground text-xs hidden md:block">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-border">
              <div className="flex items-center gap-2">
                <Avatar initials={loggedInUser.name.split(" ").map(n => n[0]).join("")} size="sm" color="#FF6B00" />
                <div className="hidden md:block">
                  <p className="text-foreground text-xs font-semibold leading-tight">{loggedInUser.name}</p>
                  <p className="text-muted-foreground text-xs leading-tight">{loggedInUser.role}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setLoggedInUser(null);
                  setLoginEmail("");
                  setLoginPassword("");
                  try {
                    localStorage.removeItem("fitpeak_gym_session");
                  } catch {}
                }}
                className="p-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                title="Logout Session"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 w-full max-w-full min-w-0 [&::-webkit-scrollbar]:hidden">
          {pageComponents[activePage] ?? <ComingSoon title={currentLabel} />}
        </main>
      </div>

      {/* Action Modals */}
      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onAdd={handleAddMember}
        plans={plansList}
      />
      <EditMemberModal
        isOpen={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onUpdate={handleUpdateMember}
        plans={plansList}
      />
      <ViewMemberModal
        isOpen={!!viewingMember}
        member={viewingMember}
        onClose={() => setViewingMember(null)}
      />
      <AddPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onAdd={handleAddPlan}
      />
      <EditPlanModal
        isOpen={!!editingPlan}
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
        onUpdate={handleUpdatePlan}
      />
      <AddTrainerModal
        isOpen={isTrainerModalOpen}
        onClose={() => setIsTrainerModalOpen(false)}
        onAdd={handleAddTrainer}
      />
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAdd={handleAddExpense}
      />
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        members={membersList}
        onAdd={handleAddPayment}
      />
      <AddAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        members={membersList}
        onCheckIn={handleCheckIn}
      />
      <BulkWhatsAppModal
        isOpen={isBulkWhatsAppOpen}
        onClose={() => setIsBulkWhatsAppOpen(false)}
        expiredMembers={membersList.filter(isMemberExpired)}
        sendWhatsAppFn={sendWhatsAppExpiryReminder}
      />
      <ViewReceiptModal
        isOpen={!!viewingReceipt}
        payment={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />
    </div>
  );
}
