import React, { useState, useEffect } from 'react';
import { X, Plus, UserCheck, CreditCard, Award, Wallet, MapPin, FileText, Check, Smartphone, Upload, Eye, Image } from 'lucide-react';
import { MemberItem, PaymentItem, TrainerItem, PlanItem, ExpenseItem } from './App';

const handlePickContact = async (
  onSelect: (contact: { name?: string; phone?: string; address?: string }) => void
) => {
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const props = ['name', 'tel', 'address'];
      const opts = { multiple: false };
      // @ts-ignore
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const c = contacts[0];
        const selectedName = c.name && c.name[0] ? c.name[0] : '';
        const selectedPhone = c.tel && c.tel[0] ? c.tel[0] : '';
        let selectedAddress = '';
        if (c.address && c.address[0] && c.address[0].addressLine) {
          selectedAddress = c.address[0].addressLine.join(', ');
        }
        onSelect({ name: selectedName, phone: selectedPhone, address: selectedAddress });
        return;
      }
    } catch (err) {
      console.log('User cancelled contact picker or permission denied:', err);
    }
  } else {
    alert('Device Contacts API is supported on Android mobile devices running Chrome or Edge. On desktop browsers, please enter details manually.');
  }
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 my-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-200 [&::-webkit-scrollbar]:hidden">{children}</div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────
export function AddMemberModal({
  isOpen,
  onClose,
  onAdd,
  plans = []
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (m: MemberItem) => void;
  plans?: PlanItem[];
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [plan, setPlan] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const defaultPlans: PlanItem[] = [
    { name: 'Monthly Plan', duration: '1 Month', price: 2500, popular: false, features: [] },
    { name: 'Quarterly Plan', duration: '3 Months', price: 6500, popular: true, features: [] },
    { name: 'Half Yearly Plan', duration: '6 Months', price: 11000, popular: false, features: [] },
    { name: 'Yearly Plan', duration: '1 Year', price: 18000, popular: false, features: [] },
  ];

  const availablePlans = plans.length > 0 ? plans : defaultPlans;

  useEffect(() => {
    if (availablePlans.length > 0 && (!plan || !availablePlans.some(p => p.name === plan))) {
      setPlan(availablePlans[0].name);
    }
  }, [availablePlans, plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Calculate expiry date based on selected plan
    const sDate = new Date(startDate);
    const selectedPlanObj = availablePlans.find(p => p.name === plan);
    let days = 30;
    if (selectedPlanObj) {
      const durLower = selectedPlanObj.duration.toLowerCase();
      const nameLower = selectedPlanObj.name.toLowerCase();
      if (durLower.includes('year') || nameLower.includes('year')) {
        const num = parseInt(durLower) || 1;
        days = num * 365;
      } else if (durLower.includes('quarter') || durLower.includes('3 month') || nameLower.includes('quarter')) {
        days = 90;
      } else if (durLower.includes('half') || durLower.includes('6 month')) {
        days = 180;
      } else if (durLower.includes('month') || nameLower.includes('month')) {
        const num = parseInt(durLower) || 1;
        days = num * 30;
      } else if (durLower.includes('day')) {
        days = parseInt(durLower) || 30;
      }
    } else {
      if (plan === 'Quarterly Plan' || plan === 'Quarterly') days = 90;
      else if (plan === 'Half Yearly Plan' || plan === 'Half Year') days = 180;
      else if (plan === 'Yearly Plan' || plan === 'Yearly') days = 365;
    }
    sDate.setDate(sDate.getDate() + days);

    const formattedStart = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedExpiry = sDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    onAdd({
      id: `GM-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      phone,
      address,
      note,
      plan: plan || (availablePlans[0]?.name ?? 'Monthly Plan'),
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
    setAddress('');
    setNote('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Gym Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name *</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. Vikram Singh"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Phone Number *</label>
            <button
              type="button"
              onClick={() => {
                handlePickContact(({ name: cName, phone: cPhone, address: cAddress }) => {
                  if (cPhone) setPhone(cPhone);
                  if (cName && !name) setName(cName);
                  if (cAddress && !address) setAddress(cAddress);
                });
              }}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Pick from Android Contacts
            </button>
          </div>
          <div className="relative">
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500 pr-10"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => {
                handlePickContact(({ name: cName, phone: cPhone, address: cAddress }) => {
                  if (cPhone) setPhone(cPhone);
                  if (cName && !name) setName(cName);
                  if (cAddress && !address) setAddress(cAddress);
                });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Select contact from Android device"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Address</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. Flat 302, Green Valley Apartments, City"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Note / Remarks</label>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500 resize-none h-20"
            placeholder="e.g. Prefers morning workout, health issues, referral note"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Membership Plan</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={plan}
            onChange={e => setPlan(e.target.value)}
          >
            {availablePlans.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} (₹{p.price.toLocaleString()})
              </option>
            ))}
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
export function EditMemberModal({
  isOpen,
  onClose,
  member,
  onUpdate,
  plans = []
}: {
  isOpen: boolean;
  onClose: () => void;
  member: MemberItem | null;
  onUpdate: (m: MemberItem) => void;
  plans?: PlanItem[];
}) {
  if (!member) return null;

  const defaultPlans: PlanItem[] = [
    { name: 'Monthly Plan', duration: '1 Month', price: 2500, popular: false, features: [] },
    { name: 'Quarterly Plan', duration: '3 Months', price: 6500, popular: true, features: [] },
    { name: 'Half Yearly Plan', duration: '6 Months', price: 11000, popular: false, features: [] },
    { name: 'Yearly Plan', duration: '1 Year', price: 18000, popular: false, features: [] },
  ];

  const availablePlans = plans.length > 0 ? plans : defaultPlans;

  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [address, setAddress] = useState(member.address || '');
  const [note, setNote] = useState(member.note || '');
  const [plan, setPlan] = useState(member.plan);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setPhone(member.phone);
      setAddress(member.address || '');
      setNote(member.note || '');
      setPlan(member.plan);
    }
  }, [member]);

  const getISODateStr = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return isNaN(dateObj.getTime()) ? new Date().toISOString().split('T')[0] : dateObj.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [startDate, setStartDate] = useState(getISODateStr(member.start));

  useEffect(() => {
    if (member) {
      setStartDate(getISODateStr(member.start));
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const sDate = new Date(startDate);
    const selectedPlanObj = availablePlans.find(p => p.name === plan);
    let days = 30;
    if (selectedPlanObj) {
      const durLower = selectedPlanObj.duration.toLowerCase();
      const nameLower = selectedPlanObj.name.toLowerCase();
      if (durLower.includes('year') || nameLower.includes('year')) {
        const num = parseInt(durLower) || 1;
        days = num * 365;
      } else if (durLower.includes('quarter') || durLower.includes('3 month') || nameLower.includes('quarter')) {
        days = 90;
      } else if (durLower.includes('half') || durLower.includes('6 month')) {
        days = 180;
      } else if (durLower.includes('month') || nameLower.includes('month')) {
        const num = parseInt(durLower) || 1;
        days = num * 30;
      } else if (durLower.includes('day')) {
        days = parseInt(durLower) || 30;
      }
    } else {
      if (plan === 'Quarterly Plan' || plan === 'Quarterly') days = 90;
      else if (plan === 'Half Yearly Plan' || plan === 'Half Year') days = 180;
      else if (plan === 'Yearly Plan' || plan === 'Yearly') days = 365;
    }
    sDate.setDate(sDate.getDate() + days);

    const formattedStart = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedExpiry = sDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    onUpdate({
      ...member,
      name,
      phone,
      address,
      note,
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Phone Number *</label>
            <button
              type="button"
              onClick={() => {
                handlePickContact(({ name: cName, phone: cPhone, address: cAddress }) => {
                  if (cPhone) setPhone(cPhone);
                  if (cName) setName(cName);
                  if (cAddress) setAddress(cAddress);
                });
              }}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Pick from Android Contacts
            </button>
          </div>
          <div className="relative">
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500 pr-10"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => {
                handlePickContact(({ name: cName, phone: cPhone, address: cAddress }) => {
                  if (cPhone) setPhone(cPhone);
                  if (cName) setName(cName);
                  if (cAddress) setAddress(cAddress);
                });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Select contact from Android device"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Address</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="e.g. Flat 302, Green Valley Apartments"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Note / Remarks</label>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500 resize-none h-20"
            placeholder="e.g. Prefers morning workout"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Membership Plan</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={plan}
            onChange={e => setPlan(e.target.value)}
          >
            {availablePlans.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} (₹{p.price.toLocaleString()})
              </option>
            ))}
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

// ─── View Member Modal ────────────────────────────────────────────────────────
export function ViewMemberModal({
  isOpen,
  onClose,
  member
}: {
  isOpen: boolean;
  onClose: () => void;
  member: MemberItem | null;
}) {
  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gym Member Details">
      <div className="space-y-4 text-sm text-slate-200">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-lg">
            {member.avatar || member.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-base font-bold text-white">{member.name}</h4>
            <p className="text-xs text-slate-400 font-mono">ID: {member.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Phone</p>
            <p className="text-white font-medium mt-0.5">{member.phone}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Plan</p>
            <p className="text-orange-400 font-medium mt-0.5">{member.plan}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-0.5">Address</p>
          <p className="text-white font-medium">{member.address || '— Not provided —'}</p>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-0.5">Note / Remarks</p>
          <p className="text-slate-300 font-medium whitespace-pre-wrap">{member.note || '— No notes added —'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Joined / Start</p>
            <p className="text-white font-medium mt-0.5">{member.start || member.joined}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Expiry Date</p>
            <p className="text-white font-medium mt-0.5">{member.expiry}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase">Trainer</p>
            <p className="text-white font-medium mt-0.5">{member.trainer}</p>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase">Status</p>
            <p className={`font-medium mt-0.5 ${member.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>{member.status}</p>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase">Payment</p>
            <p className="text-blue-400 font-medium mt-0.5">{member.payment}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Plan Modal ──────────────────────────────────────────────────────────
export function AddPlanModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (p: PlanItem) => void }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('1 Month');
  const [price, setPrice] = useState('');
  const [popular, setPopular] = useState(false);
  const [featuresText, setFeaturesText] = useState('Full Gym Access, Locker Room, Free Fitness Assessment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    const featuresList = featuresText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    onAdd({
      name,
      duration,
      price: parseFloat(price),
      popular,
      features: featuresList.length > 0 ? featuresList : ['Full Gym Access', 'Locker Room'],
    });
    setName('');
    setPrice('');
    setPopular(false);
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
            placeholder="e.g. 1 Month / 3 Months / 1 Year"
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
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Features (comma separated)</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            placeholder="Full Gym Access, Locker Room, Personal Trainer"
            value={featuresText}
            onChange={e => setFeaturesText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="addPlanPopular"
            checked={popular}
            onChange={e => setPopular(e.target.checked)}
            className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
          />
          <label htmlFor="addPlanPopular" className="text-sm font-semibold text-slate-300 cursor-pointer">
            Mark as Popular / Featured Plan
          </label>
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Create Plan
        </button>
      </form>
    </Modal>
  );
}

// ─── Edit Plan Modal ──────────────────────────────────────────────────────────
export function EditPlanModal({
  isOpen,
  onClose,
  plan,
  onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanItem | null;
  onUpdate: (updated: PlanItem, oldName: string) => void;
}) {
  if (!plan) return null;

  const [name, setName] = useState(plan.name);
  const [duration, setDuration] = useState(plan.duration);
  const [price, setPrice] = useState(String(plan.price));
  const [popular, setPopular] = useState(plan.popular);
  const [featuresText, setFeaturesText] = useState((plan.features || []).join(', '));

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDuration(plan.duration);
      setPrice(String(plan.price));
      setPopular(plan.popular);
      setFeaturesText((plan.features || []).join(', '));
    }
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    const featuresList = featuresText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    onUpdate(
      {
        name,
        duration,
        price: parseFloat(price),
        popular,
        features: featuresList.length > 0 ? featuresList : ['Full Gym Access', 'Locker Room'],
      },
      plan.name
    );
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Membership Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Plan Title</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Duration</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
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
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Features (comma separated)</label>
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500"
            value={featuresText}
            onChange={e => setFeaturesText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="editPlanPopular"
            checked={popular}
            onChange={e => setPopular(e.target.checked)}
            className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
          />
          <label htmlFor="editPlanPopular" className="text-sm font-semibold text-slate-300 cursor-pointer">
            Mark as Popular / Featured Plan
          </label>
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Update Plan
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
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();

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
      receiptUrl,
    });

    setAmount('');
    setPaid('');
    setDiscount('0');
    setReceiptUrl(undefined);
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

        {/* Payment Receipt Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Upload Payment Receipt / Screenshot</label>
          <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/50 rounded-xl p-3 bg-slate-900/60 text-center transition-colors">
            {receiptUrl ? (
              <div className="relative group flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={receiptUrl} alt="Receipt preview" className="w-10 h-10 object-cover rounded-md border border-slate-700 flex-shrink-0" />
                  <span className="text-xs text-slate-200 truncate font-mono">Receipt_Attached.png</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptUrl(undefined)}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Remove receipt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-2 text-slate-400 hover:text-white transition-colors">
                <Upload className="w-5 h-5 mb-1 text-orange-400" />
                <span className="text-xs font-medium">Click to Upload Payment Screenshot / Receipt</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setReceiptUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer mt-2">
          Submit & Generate Invoice
        </button>
      </form>
    </Modal>
  );
}

export function ViewReceiptModal({
  isOpen,
  onClose,
  payment
}: {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentItem | null;
}) {
  if (!isOpen || !payment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payment Receipt — ${payment.invoice}`}>
      <div className="space-y-4 text-slate-200">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Member: </span>
            <span className="text-white font-semibold">{payment.member}</span>
          </div>
          <div>
            <span className="text-slate-400">Amount Paid: </span>
            <span className="text-green-400 font-semibold">₹{payment.paid.toLocaleString()}</span>
          </div>
        </div>

        {payment.receiptUrl ? (
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-center max-h-[60vh] overflow-hidden">
            <img
              src={payment.receiptUrl}
              alt={`Receipt for ${payment.invoice}`}
              className="max-h-[55vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
            <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-sm text-slate-300">No Receipt Screenshot Uploaded</p>
            <p className="text-xs text-slate-500 mt-1">This payment was recorded without an attached receipt screenshot.</p>
          </div>
        )}
      </div>
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

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

export function BulkWhatsAppModal({
  isOpen,
  onClose,
  expiredMembers,
  sendWhatsAppFn
}: {
  isOpen: boolean;
  onClose: () => void;
  expiredMembers: MemberItem[];
  sendWhatsAppFn: (m: MemberItem) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentSet, setSentSet] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSentSet({});
    }
  }, [isOpen]);

  if (!isOpen || expiredMembers.length === 0) return null;

  const currentMember = expiredMembers[currentIndex] || expiredMembers[0];
  const total = expiredMembers.length;
  const sentCount = Object.keys(sentSet).length;

  const handleSendCurrent = () => {
    if (!currentMember) return;
    sendWhatsAppFn(currentMember);
    setSentSet(prev => ({ ...prev, [currentMember.id]: true }));
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk WhatsApp Expiry Reminders">
      <div className="space-y-4 text-sm text-slate-200">
        {/* Progress header */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Progress</p>
            <p className="text-white font-bold text-base mt-0.5">
              Member {currentIndex + 1} of {total} ({sentCount} Sent)
            </p>
          </div>
          <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#25D366] h-full transition-all duration-300"
              style={{ width: `${Math.round(((sentCount) / total) * 100)}%` }}
            />
          </div>
        </div>

        {/* Current Member details card */}
        <div className="bg-slate-900 p-4 rounded-xl border border-orange-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">
                {currentMember.avatar || currentMember.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-white font-bold text-base">{currentMember.name}</h4>
                <p className="text-slate-400 text-xs font-mono">{currentMember.id} · {currentMember.phone}</p>
              </div>
            </div>
            {sentSet[currentMember.id] && (
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Sent
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400">Plan: </span>
              <span className="text-white font-semibold">{currentMember.plan}</span>
            </div>
            <div>
              <span className="text-slate-400">Expired: </span>
              <span className="text-red-400 font-semibold">{currentMember.expiry}</span>
            </div>
          </div>
        </div>

        {/* Send Action */}
        <button
          type="button"
          onClick={handleSendCurrent}
          className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
        >
          <WhatsAppIcon className="w-4 h-4 fill-white" />
          Send WhatsApp to {currentMember.name} {currentIndex < total - 1 ? '& Next ▶' : '✅'}
        </button>

        {/* Navigation & Skip */}
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              ◀ Previous Member
            </button>
          )}
          {currentIndex < total - 1 && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Skip Member ▶
            </button>
          )}
        </div>

        {/* Member List overview */}
        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Queue Overview ({total} Members)</p>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 [&::-webkit-scrollbar]:hidden">
            {expiredMembers.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => setCurrentIndex(idx)}
                className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  idx === currentIndex
                    ? 'bg-orange-500/20 border border-orange-500/40 text-white font-semibold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>{idx + 1}.</span>
                  <span className="truncate">{m.name}</span>
                  <span className="text-slate-400 font-mono">({m.phone})</span>
                </div>
                {sentSet[m.id] ? (
                  <span className="text-green-400 font-bold text-[10px] uppercase">Sent ✅</span>
                ) : (
                  <span className="text-amber-400 font-medium text-[10px] uppercase">Pending</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
