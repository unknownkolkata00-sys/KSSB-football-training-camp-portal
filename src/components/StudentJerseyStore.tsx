import React, { useState } from 'react';
import { CampJersey, JerseyOrder, Student } from '../types';
import { Shirt, ShoppingBag, CheckCircle2, AlertCircle, Clock, Tag, CreditCard, ChevronDown, Check, PackageCheck } from 'lucide-react';

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
  // Store selected size per jersey id
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [orderingJersey, setOrderingJersey] = useState<CampJersey | null>(null);
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

  const handleSizeChange = (jerseyId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [jerseyId]: size }));
  };

  const handleConfirmOrder = () => {
    if (!orderingJersey) return;

    const sizeChosen = getSelectedSizeForJersey(orderingJersey);

    onPlaceOrder({
      studentId: student.id,
      studentName: student.name,
      registrationNumber: student.registrationNumber || 'KSSB-STU-' + student.id,
      jerseyId: orderingJersey.id,
      jerseyName: orderingJersey.name,
      jerseyImageUrl: orderingJersey.imageUrl,
      size: sizeChosen,
      price: orderingJersey.price,
      status: 'Pending',
      paymentStatus: 'Pending',
      mobileNo: student.mobileNo || student.parentPhone
    });

    setOrderSuccessMsg(`Successfully placed order for ${orderingJersey.name} (Size: ${sizeChosen}) at ₹${orderingJersey.price}!`);
    setOrderingJersey(null);

    setTimeout(() => setOrderSuccessMsg(null), 6000);
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
              Order your official Kadamtala Subhas Bhowmick Football Camp Jersey. Select your age size group from the drop-down (6yrs to 16yrs).
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
              const sizesList = jersey.availableSizes && jersey.availableSizes.length > 0 ? jersey.availableSizes : DEFAULT_SIZES;

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
                        ₹{jersey.price}.00
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
                      <div className="space-y-1.5 p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl">
                        <label className="text-[11px] font-mono font-bold text-gray-700 uppercase flex items-center justify-between">
                          <span>Select Jersey Size Group:</span>
                          <span className="text-emerald-700 font-bold font-sans">Active: {currentSize}</span>
                        </label>
                        <select
                          value={currentSize}
                          onChange={(e) => handleSizeChange(jersey.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-xs font-bold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                        >
                          {sizesList.map(sz => (
                            <option key={sz} value={sz}>
                              Size {sz} {sz === `${student.age}yrs` ? ' (Recommended for Age)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-gray-500">
                          Sizes available: {DEFAULT_SIZES.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Action Button */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedSizes(prev => ({ ...prev, [jersey.id]: currentSize }));
                        setOrderingJersey(jersey);
                      }}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} /> Order Jersey ({currentSize} — ₹{jersey.price})
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
                  <th className="p-3">Selected Size</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3">Kit Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {studentOrders.map(order => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 border border-gray-200/60 rounded-xl text-center text-xs text-gray-500">
            You have not ordered any camp jerseys yet. Select your size above and click "Order Jersey".
          </div>
        )}
      </div>

      {/* CONFIRMATION ORDER MODAL */}
      {orderingJersey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-emerald-100">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase">Confirm Jersey Order</span>
              <h4 className="text-lg font-bold text-gray-900">{orderingJersey.name}</h4>
              <p className="text-xs text-gray-500">Kadamtala Subhas Bhowmick Football Camp Kit</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Student Athlete:</span>
                <strong className="text-gray-900">{student.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registration No:</span>
                <strong className="text-emerald-800 font-mono">{student.registrationNumber || 'N/A'}</strong>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200">
                <span className="text-gray-700">Selected Size:</span>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-mono rounded font-extrabold">
                  {getSelectedSizeForJersey(orderingJersey)}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-emerald-900 pt-1">
                <span>Jersey Price:</span>
                <span className="font-mono">₹{orderingJersey.price}.00</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setOrderingJersey(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
