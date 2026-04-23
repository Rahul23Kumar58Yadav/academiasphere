import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Filter,
  Search
} from 'lucide-react';

const PayFees = () => {
  const [feeRecords, setFeeRecords] = useState([]);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('blockchain');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFeeRecords();
  }, []);

  const fetchFeeRecords = async () => {
    setLoading(true);
    // Simulated API call
    setTimeout(() => {
      setFeeRecords([
        {
          id: 'FEE001',
          type: 'Tuition Fee',
          academicYear: '2025-2026',
          term: 'First Term',
          amount: 45000,
          dueDate: '2026-03-15',
          status: 'pending',
          installment: 1,
          totalInstallments: 3
        },
        {
          id: 'FEE002',
          type: 'Laboratory Fee',
          academicYear: '2025-2026',
          term: 'First Term',
          amount: 5000,
          dueDate: '2026-03-15',
          status: 'pending',
          installment: 1,
          totalInstallments: 1
        },
        {
          id: 'FEE003',
          type: 'Tuition Fee',
          academicYear: '2024-2025',
          term: 'Third Term',
          amount: 45000,
          paidDate: '2025-11-10',
          status: 'paid',
          transactionHash: '0x1a2b3c4d5e6f...',
          installment: 3,
          totalInstallments: 3
        },
        {
          id: 'FEE004',
          type: 'Library Fee',
          academicYear: '2025-2026',
          term: 'First Term',
          amount: 2000,
          dueDate: '2026-02-28',
          status: 'overdue',
          installment: 1,
          totalInstallments: 1
        },
        {
          id: 'FEE005',
          type: 'Sports Fee',
          academicYear: '2025-2026',
          term: 'First Term',
          amount: 3000,
          paidDate: '2026-01-20',
          status: 'paid',
          transactionHash: '0xa1b2c3d4e5f6...',
          installment: 1,
          totalInstallments: 1
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const handlePayment = async () => {
    if (!selectedFee) return;
    
    setProcessing(true);
    // Simulated blockchain payment
    setTimeout(() => {
      const updatedRecords = feeRecords.map(fee => 
        fee.id === selectedFee.id 
          ? { 
              ...fee, 
              status: 'paid', 
              paidDate: new Date().toISOString().split('T')[0],
              transactionHash: `0x${Math.random().toString(36).substring(2, 15)}...`
            }
          : fee
      );
      setFeeRecords(updatedRecords);
      setSelectedFee(null);
      setProcessing(false);
      alert('Payment successful! Transaction recorded on blockchain.');
    }, 2000);
  };

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      paid: <CheckCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      overdue: <XCircle className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredRecords = feeRecords.filter(fee => {
    const matchesStatus = filterStatus === 'all' || fee.status === filterStatus;
    const matchesSearch = fee.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPending = feeRecords
    .filter(f => f.status === 'pending' || f.status === 'overdue')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPaid = feeRecords
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fee records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Fee Payment</h1>
          <p className="text-gray-600 mt-1">View and pay your academic fees securely</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">₹{totalPending.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">Blockchain</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by fee type or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fee Records Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fee.type}</p>
                        <p className="text-xs text-gray-500">ID: {fee.id}</p>
                        {fee.totalInstallments > 1 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Installment {fee.installment}/{fee.totalInstallments}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{fee.academicYear}</p>
                        <p className="text-xs text-gray-500">{fee.term}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">₹{fee.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {fee.status === 'paid' ? fee.paidDate : fee.dueDate}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fee.status === 'paid' ? 'Paid on' : 'Due by'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {fee.status === 'paid' ? (
                          <>
                            <button 
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                              title="Download Receipt"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedFee(fee)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No fee records found</p>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {selectedFee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Payment</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Fee Type:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedFee.type}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Fee ID:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedFee.id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-bold text-gray-900">₹{selectedFee.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedFee.dueDate}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-blue-500 rounded-lg cursor-pointer bg-blue-50">
                    <input
                      type="radio"
                      name="payment"
                      value="blockchain"
                      checked={paymentMethod === 'blockchain'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <Wallet className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Blockchain Wallet</span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Your payment will be securely processed using blockchain technology. 
                    You will receive a transaction hash for verification.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedFee(null)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Pay ₹{selectedFee.amount.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayFees;