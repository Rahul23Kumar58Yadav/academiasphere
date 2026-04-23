import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  DollarSign, 
  Search,
  Filter,
  Download,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const FeeStructure = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [filteredStructures, setFilteredStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState('2025-2026');

  const [formData, setFormData] = useState({
    className: '',
    academicYear: '2025-2026',
    feeType: 'annual',
    currency: 'INR',
    feeComponents: [
      { name: 'Tuition Fee', amount: 0, mandatory: true },
      { name: 'Development Fee', amount: 0, mandatory: true },
      { name: 'Sports Fee', amount: 0, mandatory: false },
      { name: 'Lab Fee', amount: 0, mandatory: false },
      { name: 'Library Fee', amount: 0, mandatory: false },
      { name: 'Transportation Fee', amount: 0, mandatory: false }
    ],
    installments: [
      { installmentNumber: 1, dueDate: '', percentage: 25 },
      { installmentNumber: 2, dueDate: '', percentage: 25 },
      { installmentNumber: 3, dueDate: '', percentage: 25 },
      { installmentNumber: 4, dueDate: '', percentage: 25 }
    ],
    discounts: [
      { type: 'Sibling Discount', percentage: 10, conditions: 'For 2nd child onwards' },
      { type: 'Early Payment', percentage: 5, conditions: 'Pay full fee before 30th June' },
      { type: 'Merit Scholarship', percentage: 50, conditions: 'Above 95% marks' }
    ],
    lateFeePolicy: {
      enabled: true,
      gracePerioddDays: 7,
      penaltyPercentage: 2,
      maximumPenalty: 5000
    }
  });

  const classes = [
    'Nursery', 'LKG', 'UKG',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12'
  ];

  const academicYears = ['2024-2025', '2025-2026', '2026-2027'];

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  useEffect(() => {
    filterStructures();
  }, [searchTerm, filterClass, filterAcademicYear, feeStructures]);

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      // Simulated API call - Replace with actual API
      const mockData = [
        {
          id: 1,
          className: 'Grade 10',
          academicYear: '2025-2026',
          feeType: 'annual',
          totalAmount: 85000,
          feeComponents: [
            { name: 'Tuition Fee', amount: 50000, mandatory: true },
            { name: 'Development Fee', amount: 15000, mandatory: true },
            { name: 'Sports Fee', amount: 5000, mandatory: false },
            { name: 'Lab Fee', amount: 10000, mandatory: false },
            { name: 'Library Fee', amount: 3000, mandatory: false },
            { name: 'Transportation Fee', amount: 2000, mandatory: false }
          ],
          status: 'active'
        },
        {
          id: 2,
          className: 'Grade 9',
          academicYear: '2025-2026',
          feeType: 'annual',
          totalAmount: 75000,
          feeComponents: [
            { name: 'Tuition Fee', amount: 45000, mandatory: true },
            { name: 'Development Fee', amount: 12000, mandatory: true },
            { name: 'Sports Fee', amount: 5000, mandatory: false },
            { name: 'Lab Fee', amount: 8000, mandatory: false },
            { name: 'Library Fee', amount: 3000, mandatory: false },
            { name: 'Transportation Fee', amount: 2000, mandatory: false }
          ],
          status: 'active'
        }
      ];
      
      setFeeStructures(mockData);
      setFilteredStructures(mockData);
    } catch (error) {
      toast.error('Failed to fetch fee structures');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterStructures = () => {
    let filtered = [...feeStructures];

    if (searchTerm) {
      filtered = filtered.filter(structure =>
        structure.className.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterClass !== 'all') {
      filtered = filtered.filter(structure => structure.className === filterClass);
    }

    if (filterAcademicYear !== 'all') {
      filtered = filtered.filter(structure => structure.academicYear === filterAcademicYear);
    }

    setFilteredStructures(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeeComponentChange = (index, field, value) => {
    const updated = [...formData.feeComponents];
    updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({
      ...prev,
      feeComponents: updated
    }));
  };

  const handleInstallmentChange = (index, field, value) => {
    const updated = [...formData.installments];
    updated[index][field] = field === 'percentage' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({
      ...prev,
      installments: updated
    }));
  };

  const addFeeComponent = () => {
    setFormData(prev => ({
      ...prev,
      feeComponents: [
        ...prev.feeComponents,
        { name: '', amount: 0, mandatory: false }
      ]
    }));
  };

  const removeFeeComponent = (index) => {
    setFormData(prev => ({
      ...prev,
      feeComponents: prev.feeComponents.filter((_, i) => i !== index)
    }));
  };

  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [
        ...prev.installments,
        { 
          installmentNumber: prev.installments.length + 1, 
          dueDate: '', 
          percentage: 0 
        }
      ]
    }));
  };

  const removeInstallment = (index) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalAmount = () => {
    return formData.feeComponents.reduce((sum, component) => sum + component.amount, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = calculateTotalAmount();
      const payload = {
        ...formData,
        totalAmount,
        id: editingId || Date.now()
      };

      // Simulated API call - Replace with actual API
      if (editingId) {
        setFeeStructures(prev =>
          prev.map(item => item.id === editingId ? payload : item)
        );
        toast.success('Fee structure updated successfully');
      } else {
        setFeeStructures(prev => [...prev, payload]);
        toast.success('Fee structure created successfully');
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save fee structure');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (structure) => {
    setFormData({
      className: structure.className,
      academicYear: structure.academicYear,
      feeType: structure.feeType,
      currency: structure.currency || 'INR',
      feeComponents: structure.feeComponents,
      installments: structure.installments || formData.installments,
      discounts: structure.discounts || formData.discounts,
      lateFeePolicy: structure.lateFeePolicy || formData.lateFeePolicy
    });
    setEditingId(structure.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee structure?')) {
      return;
    }

    try {
      setFeeStructures(prev => prev.filter(item => item.id !== id));
      toast.success('Fee structure deleted successfully');
    } catch (error) {
      toast.error('Failed to delete fee structure');
      console.error(error);
    }
  };

  const handleDuplicate = (structure) => {
    setFormData({
      ...structure,
      className: '',
      academicYear: '2025-2026'
    });
    setEditingId(null);
    setShowModal(true);
    toast.info('Duplicated! Please update class and academic year');
  };

  const resetForm = () => {
    setFormData({
      className: '',
      academicYear: '2025-2026',
      feeType: 'annual',
      currency: 'INR',
      feeComponents: [
        { name: 'Tuition Fee', amount: 0, mandatory: true },
        { name: 'Development Fee', amount: 0, mandatory: true },
        { name: 'Sports Fee', amount: 0, mandatory: false },
        { name: 'Lab Fee', amount: 0, mandatory: false },
        { name: 'Library Fee', amount: 0, mandatory: false },
        { name: 'Transportation Fee', amount: 0, mandatory: false }
      ],
      installments: [
        { installmentNumber: 1, dueDate: '', percentage: 25 },
        { installmentNumber: 2, dueDate: '', percentage: 25 },
        { installmentNumber: 3, dueDate: '', percentage: 25 },
        { installmentNumber: 4, dueDate: '', percentage: 25 }
      ],
      discounts: [
        { type: 'Sibling Discount', percentage: 10, conditions: 'For 2nd child onwards' },
        { type: 'Early Payment', percentage: 5, conditions: 'Pay full fee before 30th June' },
        { type: 'Merit Scholarship', percentage: 50, conditions: 'Above 95% marks' }
      ],
      lateFeePolicy: {
        enabled: true,
        gracePeriodDays: 7,
        penaltyPercentage: 2,
        maximumPenalty: 5000
      }
    });
    setEditingId(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fee Structure Management</h1>
        <p className="text-gray-600 mt-2">Create and manage fee structures for different classes</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by class name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Class Filter */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            {/* Academic Year Filter */}
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Create New Structure
            </button>
          </div>
        </div>
      </div>

      {/* Fee Structures List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredStructures.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No fee structures found</p>
            <p className="text-sm mt-1">Create a new fee structure to get started</p>
          </div>
        ) : (
          filteredStructures.map((structure) => (
            <div key={structure.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{structure.className}</h3>
                  <span className="px-3 py-1 bg-white bg-opacity-30 rounded-full text-xs font-semibold">
                    {structure.academicYear}
                  </span>
                </div>
                <div className="text-3xl font-bold mt-4">
                  {formatCurrency(structure.totalAmount)}
                </div>
                <p className="text-sm opacity-90 mt-1">Total Annual Fee</p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Fee Components</h4>
                <div className="space-y-2 mb-4">
                  {structure.feeComponents.map((component, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        {component.mandatory && (
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        )}
                        {component.name}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(component.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(structure)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(structure)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(structure.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Fee Structure' : 'Create New Fee Structure'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="className"
                      value={formData.className}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fee Type
                    </label>
                    <select
                      name="feeType"
                      value={formData.feeType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="annual">Annual</option>
                      <option value="semester">Semester</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Fee Components */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Fee Components</h3>
                    <button
                      type="button"
                      onClick={addFeeComponent}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200"
                    >
                      <Plus size={16} />
                      Add Component
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.feeComponents.map((component, index) => (
                      <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          value={component.name}
                          onChange={(e) => handleFeeComponentChange(index, 'name', e.target.value)}
                          placeholder="Component Name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="number"
                          value={component.amount}
                          onChange={(e) => handleFeeComponentChange(index, 'amount', e.target.value)}
                          placeholder="Amount"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={component.mandatory}
                            onChange={(e) => handleFeeComponentChange(index, 'mandatory', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          Mandatory
                        </label>
                        {formData.feeComponents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeeComponent(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-4 bg-indigo-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(calculateTotalAmount())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Installments */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Installments</h3>
                    <button
                      type="button"
                      onClick={addInstallment}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                    >
                      <Plus size={16} />
                      Add Installment
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.installments.map((installment, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 w-24">
                          Installment {installment.installmentNumber}
                        </span>
                        <input
                          type="date"
                          value={installment.dueDate}
                          onChange={(e) => handleInstallmentChange(index, 'dueDate', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <input
                          type="number"
                          value={installment.percentage}
                          onChange={(e) => handleInstallmentChange(index, 'percentage', e.target.value)}
                          placeholder="%"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        {formData.installments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInstallment(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {editingId ? 'Update Structure' : 'Create Structure'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructure;