import React, { useState, useEffect } from 'react';
import { X, Plus, UserCheck, CreditCard, Award, Wallet } from 'lucide-react';
import { MemberItem, PaymentItem, TrainerItem, PlanItem, ExpenseItem } from './App';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────
export function AddMemberModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (m: MemberItem) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('Monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    // Automatically calculate expiry date on submit
    const sDate = new Date(startDate);
    let days = 30;
    if (plan === 'Quarterly') days = 90;
    else if (plan === 'Half Year') days = 180;
    else if (plan === 'Yearly') days = 365;
    sDate.setDate(sDate.getDate() + days);

    const formattedStart = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedExpiry = sDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    onAdd({
      id: `GM-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      phone,
      plan,
      joined: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      start: formattedStart,
      expiry: formattedExpiry,
      trainer: 'General',
      status: 'Active',
      payment: 'Paid',
      avatar: initials,
    });
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Gym Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. Vikram Singh"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Membership Plan</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={plan}
            onChange={e => setPlan(e.target.value)}
          >
            <option value="Monthly">Monthly Plan (₹2,500)</option>
            <option value="Quarterly">Quarterly Plan (₹6,500)</option>
            <option value="Half Year">Half Yearly Plan (₹11,000)</option>
            <option value="Yearly">Yearly Plan (₹18,000)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Start Date</label>
          <input
            type="date"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Save Member
        </button>
      </form>
    </Modal>
  );
}

// ─── Edit Member Modal ────────────────────────────────────────────────────────
export function EditMemberModal({ isOpen, onClose, member, onUpdate }: { isOpen: boolean; onClose: () => void; member: MemberItem | null; onUpdate: (m: MemberItem) => void }) {
  if (!member) return null;
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [plan, setPlan] = useState(member.plan);

  const getISODateStr = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return isNaN(dateObj.getTime()) ? new Date().toISOString().split('T')[0] : dateObj.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [startDate, setStartDate] = useState(getISODateStr(member.start));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    // Automatically recalculate expiry date on save
    const sDate = new Date(startDate);
    let days = 30;
    if (plan === 'Quarterly') days = 90;
    else if (plan === 'Half Year') days = 180;
    else if (plan === 'Yearly') days = 365;
    sDate.setDate(sDate.getDate() + days);

    const formattedStart = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedExpiry = sDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    onUpdate({
      ...member,
      name,
      phone,
      plan,
      start: formattedStart,
      expiry: formattedExpiry,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Gym Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Membership Plan</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={plan}
            onChange={e => setPlan(e.target.value)}
          >
            <option value="Monthly">Monthly Plan (₹2,500)</option>
            <option value="Quarterly">Quarterly Plan (₹6,500)</option>
            <option value="Half Year">Half Yearly Plan (₹11,000)</option>
            <option value="Yearly">Yearly Plan (₹18,000)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Start Date</label>
          <input
            type="date"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Update Member
        </button>
      </form>
    </Modal>
  );
}

// ─── Add Plan Modal ──────────────────────────────────────────────────────────
export function AddPlanModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (p: PlanItem) => void }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('1 Month');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    onAdd({
      name,
      duration,
      price: parseFloat(price),
      popular: false,
      features: ['Full Gym Access', 'Locker Room', 'Free Fitness Assessment'],
    });
    setName('');
    setPrice('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Membership Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Plan Title</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. VIP Personal Training"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Duration</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. 1 Month / 6 Months"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Price (₹)</label>
          <input
            type="number"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="3500"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Create Plan
        </button>
      </form>
    </Modal>
  );
}

// ─── Add Trainer Modal ────────────────────────────────────────────────────────
export function AddTrainerModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (t: TrainerItem) => void }) {
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('Strength & Conditioning');
  const [salary, setSalary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    onAdd({
      name,
      specialization: spec,
      experience: '3 Years',
      salary: `₹${salary || '35,000'}`,
      members: 0,
      rating: 5.0,
      avatar: initials,
    });
    setName('');
    setSalary('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Trainer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Trainer Name</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. Ramesh Kumar"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Specialization</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. CrossFit / Bodybuilding"
            value={spec}
            onChange={e => setSpec(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monthly Salary (₹)</label>
          <input
            type="number"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="40000"
            value={salary}
            onChange={e => setSalary(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Save Trainer
        </button>
      </form>
    </Modal>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
export function AddExpenseModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (e: ExpenseItem) => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    onAdd({
      title,
      category,
      amount: parseFloat(amount),
      vendor: 'Vendor',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      mode: 'UPI',
      status: 'Paid',
    });
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record New Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Expense Title</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. Electricity Bill"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="Rent">Rent</option>
            <option value="Electricity">Electricity</option>
            <option value="Salary">Salary</option>
            <option value="Equipment">Equipment</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount (₹)</label>
          <input
            type="number"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="12000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Save Expense
        </button>
      </form>
    </Modal>
  );
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────
export function AddPaymentModal({ isOpen, onClose, members, onAdd }: { isOpen: boolean; onClose: () => void; members: MemberItem[]; onAdd: (p: PaymentItem) => void }) {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paid, setPaid] = useState('');
  const [discount, setDiscount] = useState('0');
  const [mode, setMode] = useState('UPI');

  useEffect(() => {
    if (members.length > 0 && !memberId) {
      setMemberId(members[0].id);
    }
  }, [members, memberId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = members.find(m => m.id === memberId);
    if (!selectedMember || !amount || !paid) return;

    const amtNum = parseFloat(amount);
    const paidNum = parseFloat(paid);
    const discNum = parseFloat(discount || '0');
    const taxNum = Math.round(amtNum * 0.18); // 18% GST standard calculation
    const balanceNum = amtNum - paidNum - discNum;

    onAdd({
      invoice: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      member: selectedMember.name,
      amount: amtNum,
      discount: discNum,
      tax: taxNum,
      paid: paidNum,
      balance: balanceNum < 0 ? 0 : balanceNum,
      mode,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    });

    setAmount('');
    setPaid('');
    setDiscount('0');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive Payment / Generate Invoice">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Member</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            required
          >
            <option value="">-- Choose Member --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.plan} Plan)</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Total Fee Amount (₹)</label>
            <input
              type="number"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
              placeholder="e.g. 2500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Paid Amount (₹)</label>
            <input
              type="number"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
              placeholder="e.g. 2500"
              value={paid}
              onChange={e => setPaid(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Discount Given (₹)</label>
            <input
              type="number"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
              placeholder="0"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Payment Mode</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
              value={mode}
              onChange={e => setMode(e.target.value)}
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Submit & Generate Invoice
        </button>
      </form>
    </Modal>
  );
}

// ─── Add Attendance Modal (QR & Manual Check-In) ──────────────────────────────
export function AddAttendanceModal({ isOpen, onClose, members, onCheckIn }: { isOpen: boolean; onClose: () => void; members: MemberItem[]; onCheckIn: (a: AttendanceItem) => void }) {
  const [memberId, setMemberId] = useState('');
  const [checkInTime, setCheckInTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Default check-in time to local time formatted appropriately (e.g., 09:30 AM)
      const now = new Date();
      setCheckInTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
      if (members.length > 0 && !memberId) {
        setMemberId(members[0].id);
      }
    }
  }, [isOpen, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = members.find(m => m.id === memberId);
    if (!selectedMember || !checkInTime) return;

    onCheckIn({
      id: selectedMember.id,
      name: selectedMember.name,
      checkIn: checkInTime,
      checkOut: '—',
      duration: 'Active',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    });

    setMemberId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual / QR Member Check-In">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Gym Member</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            required
          >
            <option value="">-- Choose Member --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Check-In Time</label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. 08:30 AM"
            value={checkInTime}
            onChange={e => setCheckInTime(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Check In Member
        </button>
      </form>
    </Modal>
  );
}
