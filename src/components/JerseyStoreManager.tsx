import React, { useState, useRef } from 'react';
import { CampJersey, JerseyOrder, Student } from '../types';
import { ShoppingBag, Plus, Edit2, Trash2, Check, X, Shirt, IndianRupee, Tag, Camera, Upload, CheckCircle2, AlertCircle, Clock, PackageCheck, Filter, Search, Phone } from 'lucide-react';

interface JerseyStoreManagerProps {
  jerseys: CampJersey[];
  orders: JerseyOrder[];
  students: Student[];
  onAddJersey: (jersey: Omit<CampJersey, 'id' | 'createdAt'>) => void;
  onUpdateJersey: (jersey: CampJersey) => void;
  onDeleteJersey: (jerseyId: string) => void;
  onUpdateOrder: (order: JerseyOrder) => void;
}

const DEFAULT_SIZES = ['6yrs', '8yrs', '10yrs', '12yrs', '14yrs', '15yrs', '16yrs'];

const PRESET_JERSEY_IMAGES = [
  { name: 'KSSB FC Official Red/Yellow Kit', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80' },
  { name: 'KSSB FC Away Blue Kit', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80' },
  { name: 'KSSB FC Training Green Jersey', url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1000&q=80' }
];

export default function JerseyStoreManager({
  jerseys,
  orders,
  students,
  onAddJersey,
  onUpdateJersey,
  onDeleteJersey,
  onUpdateOrder
}: JerseyStoreManagerProps) {
  const [activeTab, setActiveTab] = useState<'jerseys' | 'orders'>('jerseys');

  // New Jersey Form State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingJersey, setEditingJersey] = useState<CampJersey | null>(null);

  const [formName, setFormName] = useState('KSSB FC Camp Official Jersey 2026');
  const [formPrice, setFormPrice] = useState<number>(550);
  const [formDescription, setFormDescription] = useState('Official Kadamtala Subhas Bhowmick FC high-performance breathable football kit with club crest.');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_JERSEY_IMAGES[0].url);
  const [formAvailableSizes, setFormAvailableSizes] = useState<string[]>(DEFAULT_SIZES);
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);

  // Orders View Filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderSearch, setOrderSearch] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenAdd = () => {
    setEditingJersey(null);
    setFormName('KSSB FC Camp Official Jersey 2026');
    setFormPrice(550);
    setFormDescription('Official Kadamtala Subhas Bhowmick FC high-performance breathable football kit with club crest.');
    setFormImageUrl(PRESET_JERSEY_IMAGES[0].url);
    setFormAvailableSizes(DEFAULT_SIZES);
    setFormIsAvailable(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (j: CampJersey) => {
    setEditingJersey(j);
    setFormName(j.name);
    setFormPrice(j.price);
    setFormDescription(j.description);
    setFormImageUrl(j.imageUrl);
    setFormAvailableSizes(j.availableSizes && j.availableSizes.length > 0 ? j.availableSizes : DEFAULT_SIZES);
    setFormIsAvailable(j.isAvailable);
    setShowAddModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSize = (size: string) => {
    if (formAvailableSizes.includes(size)) {
      if (formAvailableSizes.length > 1) {
        setFormAvailableSizes(formAvailableSizes.filter(s => s !== size));
      }
    } else {
      setFormAvailableSizes([...formAvailableSizes, size]);
    }
  };

  const handleSubmitJersey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) return;

    if (editingJersey) {
      onUpdateJersey({
        ...editingJersey,
        name: formName,
        price: Number(formPrice),
        description: formDescription,
        imageUrl: formImageUrl || PRESET_JERSEY_IMAGES[0].url,
        availableSizes: formAvailableSizes,
        isAvailable: formIsAvailable
      });
    } else {
      onAddJersey({
        name: formName,
        price: Number(formPrice),
        description: formDescription,
        imageUrl: formImageUrl || PRESET_JERSEY_IMAGES[0].url,
        availableSizes: formAvailableSizes,
        isAvailable: formIsAvailable
      });
    }

    setShowAddModal(false);
  };

  // Filter Orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const searchLower = orderSearch.toLowerCase();
    const matchesSearch = !orderSearch || 
      o.studentName.toLowerCase().includes(searchLower) ||
      o.registrationNumber.toLowerCase().includes(searchLower) ||
      o.size.toLowerCase().includes(searchLower) ||
      o.jerseyName.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  return (
    <div className="space-y-6" id="jersey-store-manager-root">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Shirt className="text-yellow-400" size={24} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 font-mono text-[10px] font-bold uppercase rounded">
                  Admin Store Management
                </span>
                <span className="text-xs text-slate-400">Total Jerseys: <strong>{jerseys.length}</strong></span>
              </div>
              <h2 className="text-2xl font-bold font-sans tracking-tight text-white">Camp Jersey Store & Student Orders</h2>
              <p className="text-xs text-slate-400">
                Upload Jersey photos, decide prices, configure sizes (6yrs–16yrs), and manage student kit orders.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer border border-emerald-400/30 shrink-0"
          >
            <Plus size={16} /> Add New Camp Jersey
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('jerseys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'jerseys' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Shirt size={16} />
            Jerseys Catalog ({jerseys.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShoppingBag size={16} />
            Student Jersey Orders ({orders.length})
            {pendingOrdersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-500 text-slate-950 font-mono font-black text-[10px] rounded-full animate-pulse">
                {pendingOrdersCount} New
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: JERSEYS CATALOG */}
      {activeTab === 'jerseys' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jerseys.map(j => (
              <div key={j.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="h-52 bg-slate-950 relative overflow-hidden group">
                    <img 
                      src={j.imageUrl} 
                      alt={j.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-3 right-3 bg-slate-900/90 text-yellow-400 font-mono font-black text-sm px-3 py-1 rounded-xl shadow border border-yellow-400/30">
                      ₹{j.price}.00
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase shadow ${
                        j.isAvailable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {j.isAvailable ? 'Available in Store' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-gray-900 text-lg leading-snug">{j.name}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{j.description}</p>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">Available Sizes for Dropdown:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {j.availableSizes.map(size => (
                          <span key={size} className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono text-[11px] font-bold rounded-md">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-gray-500">Added: {j.createdAt}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(j)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Edit2 size={13} /> Edit / Price
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${j.name}?`)) {
                          onDeleteJersey(j.id);
                        }
                      }}
                      className="px-2.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {jerseys.length === 0 && (
              <div className="col-span-full p-12 bg-white border border-dashed border-gray-300 rounded-2xl text-center space-y-3">
                <Shirt size={48} className="mx-auto text-gray-400" />
                <h3 className="text-lg font-bold text-gray-800">No Camp Jerseys Added Yet</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Click "Add New Camp Jersey" above to upload jersey pictures, set prices, and make them available to students in their profiles.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add Jersey Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT ORDERS LIST */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={22} className="text-emerald-700" />
                Student Jersey Orders Ledger
              </h3>
              <p className="text-xs text-gray-500">Track kit orders placed by students from their profiles with selected sizes and contact numbers.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student, reg no, size..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white"
              >
                <option value="All">All Statuses ({orders.length})</option>
                <option value="Pending">Pending ({orders.filter(o => o.status === 'Pending').length})</option>
                <option value="Confirmed">Confirmed ({orders.filter(o => o.status === 'Confirmed').length})</option>
                <option value="Delivered">Delivered ({orders.filter(o => o.status === 'Delivered').length})</option>
                <option value="Cancelled">Cancelled ({orders.filter(o => o.status === 'Cancelled').length})</option>
              </select>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                <tr>
                  <th className="p-3">Student Name / Reg No</th>
                  <th className="p-3">Jersey Title</th>
                  <th className="p-3">Selected Size</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => {
                    const studentData = students.find(s => s.id === order.studentId);
                    const phone = order.mobileNo || studentData?.mobileNo || studentData?.parentPhone || '';

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/60">
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{order.studentName}</div>
                          <div className="text-[10px] font-mono text-emerald-800 font-bold">{order.registrationNumber}</div>
                        </td>
                        <td className="p-3 font-semibold text-gray-800">
                          {order.jerseyName}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-mono font-black text-xs">
                            {order.size}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-gray-950 text-sm">
                          ₹{order.price}.00
                        </td>
                        <td className="p-3 text-gray-500 font-mono">
                          {order.orderDate}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {phone && (
                              <a
                                href={`https://wa.me/91${phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(order.studentName)},%20regarding%20your%20KSSB%20FC%20Jersey%20Order%20(${encodeURIComponent(order.size)})...`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                                title="Contact Student/Parent via WhatsApp"
                              >
                                <Phone size={14} />
                              </a>
                            )}

                            {order.status === 'Pending' && (
                              <button
                                onClick={() => onUpdateOrder({ ...order, status: 'Confirmed' })}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm cursor-pointer"
                              >
                                Confirm
                              </button>
                            )}

                            {order.status === 'Confirmed' && (
                              <button
                                onClick={() => onUpdateOrder({ ...order, status: 'Delivered', paymentStatus: 'Paid' })}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm cursor-pointer"
                              >
                                Mark Delivered
                              </button>
                            )}

                            {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                              <button
                                onClick={() => onUpdateOrder({ ...order, status: 'Cancelled' })}
                                className="px-2 py-1 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No jersey orders match the selected search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT JERSEY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase">
                {editingJersey ? 'Edit Jersey Details & Price' : 'Add New Camp Jersey'}
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                {editingJersey ? 'Update Camp Jersey' : 'Upload Jersey & Set Price'}
              </h3>
              <p className="text-xs text-gray-500">
                Price set here will automatically display to students in their profiles for ordering.
              </p>
            </div>

            <form onSubmit={handleSubmitJersey} className="space-y-4">
              
              {/* Jersey Name */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">
                  Jersey Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. KSSB FC Official Camp Jersey 2026"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Price (Decided by Admin) */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-emerald-900 uppercase flex items-center gap-1">
                  <Tag size={14} className="text-emerald-700" />
                  <span>Price of the Jersey (Decided by Admin in ₹) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    placeholder="e.g. 550"
                    className="w-full pl-8 pr-3.5 py-2.5 border-2 border-emerald-500 rounded-xl text-sm font-black text-gray-900 bg-emerald-50/40 focus:bg-white"
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  This price will show directly in the student portal when students select their jersey size.
                </p>
              </div>

              {/* Jersey Picture Section */}
              <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase flex items-center gap-1.5">
                  <Camera size={14} className="text-emerald-600" />
                  <span>Jersey Picture (Upload or Preset)</span>
                </label>

                {/* Picture Preview */}
                <div className="flex items-center gap-4">
                  <div className="w-24 h-28 bg-slate-950 rounded-xl border-2 border-emerald-600 overflow-hidden shrink-0 relative">
                    <img src={formImageUrl || PRESET_JERSEY_IMAGES[0].url} alt="Preview" className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={14} /> Upload Custom Jersey Pic
                    </button>

                    <div className="text-[10px] text-gray-500">Or paste image web URL below:</div>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://example.com/jersey.jpg"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white"
                    />
                  </div>
                </div>

                {/* Stock Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono text-gray-500 block">Or pick from official kit presets:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_JERSEY_IMAGES.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`p-1 rounded-lg border text-left text-[10px] font-semibold transition-all cursor-pointer ${
                          formImageUrl === preset.url ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/30' : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sizes Selection Dropdown Config */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">
                  Available Sizes for Student Dropdown
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SIZES.map(size => {
                    const isSelected = formAvailableSizes.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                          isSelected 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {size} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">
                  Description / Details
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Fabric specs, wash guidelines, kit includes shirt and shorts..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsAvailable"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="formIsAvailable" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Mark as Available in Student Store
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Save & Publish to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
