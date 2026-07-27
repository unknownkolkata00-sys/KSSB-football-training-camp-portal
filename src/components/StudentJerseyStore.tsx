import React, { useState } from 'react';
import { CampJersey, JerseyOrder, Student } from '../types';
import { Shirt, ShoppingBag, CheckCircle2, AlertCircle, Clock, Tag, CreditCard, ChevronDown, Check, PackageCheck, Plus, Minus, ArrowLeft, X } from 'lucide-react';

interface StudentJerseyStoreProps {
  student: Student;
  jerseys: CampJersey[];
  orders: JerseyOrder[];
  onPlaceOrder: (order: Omit<JerseyOrder, 'id' | 'orderDate'>) => void;
}

const DEFAULT_SIZES = ['6yrs', '8yrs', '10yrs', '12yrs', '14yrs', '15yrs', '16yrs'];

export default function StudentJerseyStore({
  student,
  jerseys,
  orders,
  onPlaceOrder
}: StudentJerseyStoreProps) {
  // Store selected size & quantity per jersey id
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  
  const [orderingJersey, setOrderingJersey] = useState<CampJersey | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Student's own orders
  const studentOrders = orders.filter(o => o.studentId === student.id);

  const getSelectedSizeForJersey = (jersey: CampJersey) => {
    if (selectedSizes[jersey.id]) return selectedSizes[jersey.id];
    // Default to student age matching size if possible, or first size
    const available = jersey.availableSizes && jersey.availableSizes.length > 0 ? jersey.availableSizes : DEFAULT_SIZES;
    const ageMatch = `${student.age}yrs`;
    if (available.includes(ageMatch)) return ageMatch;
    return available[0] || '12yrs';
  };

  const getSelectedQuantityForJersey = (jerseyId: string) => {
    return selectedQuantities[jerseyId] || 1;
  };

  const handleSizeChange = (jerseyId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [jerseyId]: size }));
  };

  const handleQuantityChange = (jerseyId: string, qty: number) => {
    const safeQty = Math.max(1, Math.min(10, qty));
    setSelectedQuantities(prev => ({ ...prev, [jerseyId]: safeQty }));
  };

  const handleOpenOrderModal = (jersey: CampJersey) => {
    const size = getSelectedSizeForJersey(jersey);
    const qty = getSelectedQuantityForJersey(jersey.id);
    setSelectedSizes(prev => ({ ...prev, [jersey.id]: size }));
    setModalQuantity(qty);
    setOrderingJersey(jersey);
  };

  const handleConfirmOrder = () => {
    if (!orderingJersey) return;

    const sizeChosen = getSelectedSizeForJersey(orderingJersey);
    const qtyChosen = Math.max(1, modalQuantity);
    const totalAmount = orderingJersey.price * qtyChosen;

    onPlaceOrder({
      studentId: student.id,
      studentName: student.name,
      registrationNumber: student.registrationNumber || 'KSSB-STU-' + student.id,
      jerseyId: orderingJersey.id,
      jerseyName: orderingJersey.name,
      jerseyImageUrl: orderingJersey.imageUrl,
      size: sizeChosen,
      quantity: qtyChosen,
      price: orderingJersey.price,
      totalPrice: totalAmount,
      status: 'Pending',
      paymentStatus: 'Pending',
      mobileNo: student.mobileNo || student.parentPhone
    });

    setOrderSuccessMsg(`✅ Order Confirmed! Booked ${qtyChosen} unit(s) of ${orderingJersey.name} (Size: ${sizeChosen}) for Total Amount: ₹${totalAmount}.00!`);
    setOrderingJersey(null);

    setTimeout(() => setOrderSuccessMsg(null), 7000);
  };

  const activeJerseys = jerseys.filter(j => j.isAvailable);

  return (
    <div className="space-y-6" id="student-jersey-store-root">
      
      {/* Alert Banner */}
      {orderSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span>{orderSuccessMsg}</span>
          </div>
          <button onClick={() => setOrderSuccessMsg(null)} className="font-bold text-gray-400 hover:text-gray-600 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Camp Jersey Store Offer Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 font-mono text-[10px] font-bold uppercase rounded-full border border-yellow-400/30">
                Official KSSB FC Store
              </span>
              <span className="text-xs text-emerald-400 font-bold font-mono">
                Student Athlete Kit Portal
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Shirt className="text-yellow-400" size={28} />
              Camp Jersey Store
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Order official Kadamtala Subhas Bhowmick Football Camp Jerseys. Select your age size group (6yrs to 16yrs) and quantity before confirming your order.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-right text-xs space-y-1 shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Ordering Student:</span>
            <div className="font-bold text-amber-400">{student.name}</div>
            <div className="font-mono text-[11px] text-emerald-400 font-bold">{student.registrationNumber || 'Registered Player'}</div>
          </div>
        </div>
      </div>

      {/* AVAILABLE JERSEYS CATALOG */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-emerald-700" size={20} />
          Available Camp Jerseys ({activeJerseys.length})
        </h3>

        {activeJerseys.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeJerseys.map(jersey => {
              const currentSize = getSelectedSizeForJersey(jersey);
              const currentQty = getSelectedQuantityForJersey(jersey.id);
              const sizesList = jersey.availableSizes && jersey.availableSizes.length > 0 ? jersey.availableSizes : DEFAULT_SIZES;
              const cardTotal = jersey.price * currentQty;

              return (
                <div key={jersey.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    {/* Jersey Image & Badge */}
                    <div className="h-56 bg-slate-950 relative overflow-hidden group">
                      <img 
                        src={jersey.imageUrl} 
                        alt={jersey.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/logo.jpg';
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-slate-900/95 text-yellow-400 font-mono font-black text-base px-3.5 py-1 rounded-xl shadow-lg border border-yellow-400/40">
                        ₹{jersey.price}.00 / unit
                      </div>
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-emerald-300 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-slate-700">
                        Camp Kit 2026
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg leading-snug">{jersey.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{jersey.description}</p>
                      </div>

                      {/* Dropdown Size Selection */}
                      <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200/80 rounded-xl">
                        <label className="text-[11px] font-mono font-bold text-gray-700 uppercase flex items-center justify-between">
                          <span>Jersey Size Group:</span>
                          <span className="text-emerald-700 font-bold font-sans">Active: {currentSize}</span>
                        </label>
                        <select
                          value={currentSize}
                          onChange={(e) => handleSizeChange(jersey.id, e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border-2 border-emerald-500 rounded-xl text-xs font-bold text-gray-900 shadow-sm focus:outline-none cursor-pointer"
                        >
                          {sizesList.map(sz => (
                            <option key={sz} value={sz}>
                              Size {sz} {sz === `${student.age}yrs` ? ' (Recommended for Age)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Selector */}
                      <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200/80 rounded-xl">
                        <label className="text-[11px] font-mono font-bold text-gray-700 uppercase flex items-center justify-between">
                          <span>Select Quantity (Qty):</span>
                          <span className="text-amber-800 font-bold font-mono">Total: ₹{cardTotal}.00</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(jersey.id, currentQty - 1)}
                            className="w-9 h-9 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 flex items-center justify-center font-bold cursor-pointer shrink-0"
                          >
                            <Minus size={14} />
                          </button>
                          <input 
                            type="number" 
                            min={1} 
                            max={10}
                            value={currentQty}
                            onChange={(e) => handleQuantityChange(jersey.id, parseInt(e.target.value) || 1)}
                            className="w-full text-center py-1.5 bg-white border border-gray-300 rounded-xl text-sm font-black font-mono text-gray-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(jersey.id, currentQty + 1)}
                            className="w-9 h-9 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 flex items-center justify-center font-bold cursor-pointer shrink-0"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Action Button */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenOrderModal(jersey)}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} /> Order {currentQty} Jersey(s) — ₹{cardTotal}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 bg-white border border-gray-200 rounded-2xl text-center space-y-2">
            <Shirt size={40} className="mx-auto text-gray-400" />
            <p className="text-sm font-bold text-gray-700">No Camp Jerseys available in the store at this moment.</p>
            <p className="text-xs text-gray-500">The club admin will publish the jersey photos and pricing soon.</p>
          </div>
        )}
      </div>

      {/* MY JERSEY ORDERS SECTION */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PackageCheck className="text-emerald-700" size={20} />
          My Ordered Camp Jerseys ({studentOrders.length})
        </h3>

        {studentOrders.length > 0 ? (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                <tr>
                  <th className="p-3">Jersey Title</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Total Payable</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {studentOrders.map(order => {
                  const qty = order.quantity || 1;
                  const total = order.totalPrice || (order.price * qty);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60">
                      <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                        {order.jerseyImageUrl && (
                          <img 
                            src={order.jerseyImageUrl} 
                            alt={order.jerseyName} 
                            className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0" 
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.onerror = null;
                              img.src = '/logo.jpg';
                            }}
                          />
                        )}
                        <span>{order.jerseyName}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-mono font-black text-xs">
                          {order.size}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-900 text-xs">
                        x {qty}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-900 text-sm">
                        ₹{total}.00
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 border border-gray-200/60 rounded-xl text-center text-xs text-gray-500">
            You have not ordered any camp jerseys yet. Select your size and quantity above and click "Order Jersey".
          </div>
        )}
      </div>

      {/* CONFIRMATION ORDER MODAL */}
      {orderingJersey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-emerald-100 animate-fade-in">
            
            {/* Header Action Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setOrderingJersey(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                id="jersey-modal-top-back-btn"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wide">Review Jersey Order</span>

              <button
                type="button"
                onClick={() => setOrderingJersey(null)}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-rose-200"
                id="jersey-modal-top-close-btn"
              >
                <X size={16} /> Close
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-gray-900">{orderingJersey.name}</h4>
              <p className="text-xs text-gray-500">Kadamtala Subhas Bhowmick Football Camp Official Kit</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Student Athlete:</span>
                <strong className="text-gray-900 font-bold">{student.name}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Registration No:</span>
                <strong className="text-emerald-800 font-mono font-bold">{student.registrationNumber || 'N/A'}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Selected Size Group:</span>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-mono rounded-lg font-black">
                  Size {getSelectedSizeForJersey(orderingJersey)}
                </span>
              </div>
              
              {/* Modal Quantity Selector */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-700 font-bold">Order Quantity (Qty):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))}
                    className="w-7 h-7 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-mono font-black text-sm px-2 text-gray-900">{modalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(prev => Math.min(10, prev + 1))}
                    className="w-7 h-7 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Unit Price:</span>
                <span className="font-mono font-bold text-gray-800">₹{orderingJersey.price}.00</span>
              </div>

              <div className="flex justify-between items-center text-base font-black text-emerald-950 pt-2 border-t-2 border-emerald-500/20">
                <span>Total Amount Payable:</span>
                <span className="font-mono text-lg text-emerald-700 font-extrabold">
                  ₹{orderingJersey.price * modalQuantity}.00
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle size={14} className="text-amber-700 shrink-0" /> Note on Order Delivery:
              </span>
              <p>Once confirmed, your jersey order will be sent to the Academy Admin for processing and distribution during upcoming training sessions.</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setOrderingJersey(null)}
                className="px-4 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-1.5"
                id="jersey-modal-bottom-back-btn"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                id="jersey-modal-confirm-btn"
              >
                <CheckCircle2 size={16} /> Confirm Jersey Booking
              </button>
              <button
                type="button"
                onClick={() => setOrderingJersey(null)}
                className="px-4 py-3 bg-rose-50 text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-100 cursor-pointer border border-rose-200 flex items-center justify-center gap-1.5"
                id="jersey-modal-bottom-close-btn"
              >
                <X size={14} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

