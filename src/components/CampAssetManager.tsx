import React, { useState, useMemo } from 'react';
import { CampAsset } from '../types';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  Printer, 
  Boxes, 
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { downloadAssetsInventoryCSV } from '../utils/reports';

interface CampAssetManagerProps {
  assets: CampAsset[];
  onAddAsset: (asset: Omit<CampAsset, 'id' | 'lastUpdated'>) => void;
  onUpdateAsset: (asset: CampAsset) => void;
  onDeleteAsset: (id: string) => void;
}

// Standard items specified by the user for fast one-click presets
const STANDARD_CAMP_PRESETS = [
  { name: 'Agility Pole', category: 'Fitness & Agility' as const, defaultUnit: 'pcs', defaultLoc: 'Ground Shed A', icon: '🚩' },
  { name: 'Marker Small', category: 'Training Equipment' as const, defaultUnit: 'pcs', defaultLoc: 'Equipment Bag 1', icon: '📍' },
  { name: 'Marker Big', category: 'Training Equipment' as const, defaultUnit: 'pcs', defaultLoc: 'Equipment Bag 1', icon: '⭕' },
  { name: 'Cone Small', category: 'Training Equipment' as const, defaultUnit: 'pcs', defaultLoc: 'Equipment Bag 2', icon: '🔺' },
  { name: 'Cone Big', category: 'Training Equipment' as const, defaultUnit: 'pcs', defaultLoc: 'Equipment Bag 2', icon: '🔶' },
  { name: 'Pulling Band', category: 'Fitness & Agility' as const, defaultUnit: 'pcs', defaultLoc: 'Fitness Kit Bag', icon: '🎗️' },
  { name: 'Moveable Goal Post', category: 'Pitch & Goals' as const, defaultUnit: 'sets', defaultLoc: 'Main Pitch', icon: '🥅' }
];

export default function CampAssetManager({
  assets,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset
}: CampAssetManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<CampAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<CampAsset['category']>('Training Equipment');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState('pcs');
  const [condition, setCondition] = useState<CampAsset['condition']>('Good');
  const [storageLocation, setStorageLocation] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [purchasedDate, setPurchasedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Quick Open Modal with Preset or Blank
  const handleOpenAddModal = (presetName?: string) => {
    if (presetName) {
      const existing = assets.find(a => a.itemName.toLowerCase() === presetName.toLowerCase());
      if (existing) {
        // Edit existing
        handleOpenEditModal(existing);
        return;
      }
      const presetInfo = STANDARD_CAMP_PRESETS.find(p => p.name === presetName);
      setItemName(presetName);
      setCategory(presetInfo?.category || 'Training Equipment');
      setUnit(presetInfo?.defaultUnit || 'pcs');
      setStorageLocation(presetInfo?.defaultLoc || '');
      setQuantity(10);
    } else {
      setItemName('');
      setCategory('Training Equipment');
      setQuantity(10);
      setUnit('pcs');
      setStorageLocation('Main Camp Shed');
    }
    setCondition('Good');
    setEstimatedCost('');
    setPurchasedDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setEditingAsset(null);
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (asset: CampAsset) => {
    setEditingAsset(asset);
    setItemName(asset.itemName);
    setCategory(asset.category);
    setQuantity(asset.quantity);
    setUnit(asset.unit || 'pcs');
    setCondition(asset.condition);
    setStorageLocation(asset.storageLocation || '');
    setEstimatedCost(asset.estimatedCost ? String(asset.estimatedCost) : '');
    setPurchasedDate(asset.purchasedDate || new Date().toISOString().split('T')[0]);
    setNotes(asset.notes || '');
    setShowAddEditModal(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const payload = {
      itemName: itemName.trim(),
      category,
      quantity: Number(quantity) || 0,
      unit: unit.trim() || 'pcs',
      condition,
      storageLocation: storageLocation.trim() || 'Camp Ground',
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      purchasedDate,
      notes: notes.trim()
    };

    if (editingAsset) {
      onUpdateAsset({
        ...editingAsset,
        ...payload
      });
    } else {
      onAddAsset(payload);
    }

    setShowAddEditModal(false);
    setEditingAsset(null);
  };

  // Quick Quantity Stepper
  const handleQuickQtyAdjust = (asset: CampAsset, delta: number) => {
    const newQty = Math.max(0, asset.quantity + delta);
    onUpdateAsset({
      ...asset,
      quantity: newQty
    });
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchSearch = 
        asset.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.storageLocation && asset.storageLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.notes && asset.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchCat = selectedCategory === 'All' || asset.category === selectedCategory;
      const matchCond = selectedCondition === 'All' || asset.condition === selectedCondition;

      return matchSearch && matchCat && matchCond;
    });
  }, [assets, searchTerm, selectedCategory, selectedCondition]);

  // Overall Statistics
  const totalUnits = useMemo(() => assets.reduce((sum, a) => sum + (a.quantity || 0), 0), [assets]);
  const totalValuation = useMemo(() => assets.reduce((sum, a) => sum + (a.estimatedCost || 0), 0), [assets]);
  const goodConditionCount = useMemo(() => assets.filter(a => a.condition === 'Good').length, [assets]);
  const needsAttentionCount = useMemo(() => assets.filter(a => a.condition === 'Needs Repair' || a.condition === 'Needs Replacement').length, [assets]);

  return (
    <div className="space-y-6" id="camp-asset-management-module">
      
      {/* Header & Quick Action Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 md:p-7 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-mono font-bold border border-emerald-500/30">
              <Boxes size={13} />
              <span>Camp Assets & Equipment Inventory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white">
              Ground & Training Gear Stock
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track, audit, and manage all football training equipment, poles, markers, cones, bands, goal posts, and custom club gear in real time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => downloadAssetsInventoryCSV(assets)}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-600 shadow-sm cursor-pointer"
              title="Download Assets Inventory CSV"
            >
              <FileDown size={15} className="text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => handleOpenAddModal()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Add New Asset Entry</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="mt-6 pt-5 border-t border-slate-700/70 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Total Gear Units</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{totalUnits}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across {assets.length} items</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Distinct Item Types</span>
            <span className="text-2xl font-black text-yellow-400 font-mono">{assets.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Equipment categories</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Good Condition</span>
            <span className="text-2xl font-black text-teal-300 font-mono">{goodConditionCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Match ready</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Estimated Valuation</span>
            <span className="text-2xl font-black text-amber-300 font-mono">₹{totalValuation.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Capital assets value</span>
          </div>
        </div>
      </div>

      {/* QUICK PRESET SELECTORS (Agility Pole, Marker Small, Marker Big, Cone Small, Cone Big, Pulling Band, Moveable Goal Post) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="text-xs font-mono font-bold text-gray-900 uppercase tracking-wider">
              Quick Camp Equipment Entry Presets
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 font-normal">Click to quick-add or edit quantity</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {STANDARD_CAMP_PRESETS.map((preset) => {
            const existing = assets.find(a => a.itemName.toLowerCase() === preset.name.toLowerCase());
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleOpenAddModal(preset.name)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  existing
                    ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-amber-50/80 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{preset.icon}</span>
                  {existing ? (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-mono font-extrabold shadow-2xs">
                      {existing.quantity} {existing.unit || 'pcs'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                      + Add
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-gray-900 leading-snug">{preset.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{preset.category}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH, CATEGORY & CONDITION FILTERS */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items, categories, storage sheds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Training Equipment', 'Fitness & Agility', 'Pitch & Goals', 'Balls & Footwear', 'First Aid & Safety'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Condition Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-gray-400 font-bold uppercase">Condition:</span>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="All">All Conditions</option>
            <option value="Good">Good (Ready)</option>
            <option value="Fair">Fair (Usable)</option>
            <option value="Needs Repair">Needs Repair</option>
            <option value="Needs Replacement">Needs Replacement</option>
          </select>
        </div>
      </div>

      {/* ASSET INVENTORY TABLE & CARDS */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
            <Package size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Assets Matching Filter</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search keywords or click below to log a new camp equipment item.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={14} /> Add Asset Entry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-4 pl-6">Equipment Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Stock Quantity</th>
                  <th className="p-4">Condition</th>
                  <th className="p-4">Storage Location</th>
                  <th className="p-4">Est. Cost</th>
                  <th className="p-4">Last Audit</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.map((asset) => {
                  const conditionBadge = {
                    'Good': 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    'Fair': 'bg-blue-100 text-blue-800 border-blue-300',
                    'Needs Repair': 'bg-amber-100 text-amber-900 border-amber-300',
                    'Needs Replacement': 'bg-rose-100 text-rose-800 border-rose-300'
                  }[asset.condition] || 'bg-gray-100 text-gray-800 border-gray-200';

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="p-4 pl-6 font-bold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                            {asset.itemName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-slate-900">{asset.itemName}</div>
                            {asset.notes && (
                              <div className="text-[11px] text-gray-500 font-normal line-clamp-1 max-w-xs">{asset.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200">
                          {asset.category}
                        </span>
                      </td>

                      {/* Quantity & Quick +/- Steppers */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleQuickQtyAdjust(asset, -1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                            title="Decrease quantity by 1"
                          >
                            -
                          </button>
                          <span className="min-w-12 font-mono font-black text-sm text-slate-900">
                            {asset.quantity} <span className="text-[10px] font-medium text-gray-500">{asset.unit || 'pcs'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickQtyAdjust(asset, 1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                            title="Increase quantity by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${conditionBadge}`}>
                          {asset.condition === 'Good' && <CheckCircle2 size={12} />}
                          {asset.condition === 'Needs Repair' && <AlertTriangle size={12} />}
                          {asset.condition}
                        </span>
                      </td>

                      {/* Storage */}
                      <td className="p-4 text-gray-700 font-medium">
                        {asset.storageLocation || 'Main Camp Shed'}
                      </td>

                      {/* Est Cost */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {asset.estimatedCost ? `₹${asset.estimatedCost.toLocaleString('en-IN')}` : '-'}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-[11px] text-gray-500 font-mono">
                        {asset.lastUpdated || asset.purchasedDate || '-'}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(asset)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Asset Details"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(asset.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT ASSET MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative border border-gray-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddEditModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl shrink-0">
                <Boxes size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingAsset ? 'Edit Camp Asset' : 'Log New Camp Asset Entry'}
                </h3>
                <p className="text-xs text-gray-500">Record equipment, quantity, and storage details</p>
              </div>
            </div>

            {/* Quick Item Picker Chips */}
            {!editingAsset && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-mono font-bold text-gray-600 uppercase">Quick Select Standard Item:</label>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_CAMP_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setItemName(preset.name);
                        setCategory(preset.category);
                        setUnit(preset.defaultUnit);
                        setStorageLocation(preset.defaultLoc);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        itemName === preset.name
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {preset.icon} {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveAsset} className="space-y-4 pt-1">
              {/* Item Name */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agility Pole, Cone Big, Moveable Goal Post, or custom item..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Training Equipment">Training Equipment</option>
                    <option value="Fitness & Agility">Fitness & Agility</option>
                    <option value="Pitch & Goals">Pitch & Goals</option>
                    <option value="Balls & Footwear">Balls & Footwear</option>
                    <option value="First Aid & Safety">First Aid & Safety</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Unit Type</label>
                  <input
                    type="text"
                    placeholder="pcs / sets / pairs / cones"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Quantity with quick buttons */}
              <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <label className="text-xs font-mono font-bold text-gray-800 uppercase flex items-center justify-between">
                  <span>Stock Quantity (Qty) <span className="text-rose-500">*</span></span>
                  <span className="text-emerald-700 font-mono font-extrabold">{quantity} {unit}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono font-black"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 5)}
                    className="px-2.5 py-2 bg-white hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 10)}
                    className="px-2.5 py-2 bg-white hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Condition & Storage Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Good">Good (Match Ready)</option>
                    <option value="Fair">Fair (Usable)</option>
                    <option value="Needs Repair">Needs Repair</option>
                    <option value="Needs Replacement">Needs Replacement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Shed A, Bag 1, Main Pitch"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Estimated Cost & Purchase Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Estimated Total Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3500"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Purchase / Audit Date</label>
                  <input
                    type="date"
                    value={purchasedDate}
                    onChange={(e) => setPurchasedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Notes & Specifications</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Brand, color, size, maintenance schedule, warranty details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check size={16} />
                  <span>{editingAsset ? 'Save Changes' : 'Save Asset Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">Delete Asset Record?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to remove this item from your equipment inventory?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmId) {
                    onDeleteAsset(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
