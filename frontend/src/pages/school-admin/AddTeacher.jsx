// src/pages/school-admin/teachers/AddTeacher.jsx
import React, { useState, useRef, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Upload, Download, Check, X,
  ChevronRight, ChevronLeft, AlertCircle, CheckCircle, FileText,
  BookOpen, DollarSign, Save, Send, Eye, Camera, Briefcase,
  GraduationCap, Award, Heart, Shield, Home, CreditCard, Building,
  Clock, Target, Users, Star, TrendingUp, RefreshCw, Info, HelpCircle,
  ArrowRight, ArrowLeft, Plus, Trash2, Edit, Copy,
} from 'lucide-react';

// ✅ Import BOTH instances — api for teacher CRUD, uploadApi for file uploads
import api, { uploadApi } from '../../config/axios.config';

const AddTeacher = ({ onClose, onSubmit, initialData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName:    initialData?.firstName    || '',
    middleName:   initialData?.middleName   || '',
    lastName:     initialData?.lastName     || '',
    dateOfBirth:  initialData?.dateOfBirth  ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
    gender:       initialData?.gender       || '',
    bloodGroup:   initialData?.bloodGroup   || '',
    nationality:  initialData?.nationality  || '',
    religion:     initialData?.religion     || '',
    maritalStatus: initialData?.maritalStatus || '',
    // photo stores the uploaded URL (string), NOT a base64 data URI
    photo: initialData?.photo || '',

    // Contact Information
    email:          initialData?.email          || '',
    alternateEmail: initialData?.alternateEmail || '',
    phone:          initialData?.phone          || '',
    alternatePhone: initialData?.alternatePhone || '',
    address:        initialData?.address?.street || initialData?.address || '',
    city:           initialData?.address?.city   || '',
    state:          initialData?.address?.state  || '',
    zipCode:        initialData?.address?.zipCode || '',
    country:        initialData?.address?.country || '',

    // Academic Qualifications
    highestQualification:     initialData?.qualifications?.highestQualification     || '',
    university:               initialData?.qualifications?.university               || '',
    yearOfPassing:            initialData?.qualifications?.yearOfPassing            || '',
    specialization:           initialData?.qualifications?.specialization           || '',
    additionalCertifications: initialData?.qualifications?.additionalCertifications || '',
    teachingExperience:       initialData?.qualifications?.teachingExperience       || '',
    previousSchools:          initialData?.qualifications?.previousSchools          || '',

    // Employment Details
    teacherId:       initialData?.teacherId                      || '',
    department:      initialData?.employment?.department         || '',
    subjects:        initialData?.employment?.subjects           || [],
    designation:     initialData?.employment?.designation        || '',
    employmentType:  initialData?.employment?.employmentType     || 'Full-time',
    joinDate:        initialData?.employment?.joinDate
                       ? new Date(initialData.employment.joinDate).toISOString().split('T')[0] : '',
    contractEndDate: initialData?.employment?.contractEndDate
                       ? new Date(initialData.employment.contractEndDate).toISOString().split('T')[0] : '',
    probationPeriod: initialData?.employment?.probationPeriod || '',
    workingHours:    initialData?.employment?.workingHours    || '',

    // Salary & Benefits
    basicSalary:   initialData?.salary?.basicSalary              || '',
    allowances:    initialData?.salary?.allowances               || '',
    deductions:    initialData?.salary?.deductions               || '',
    paymentMode:   initialData?.salary?.paymentMode              || 'Bank Transfer',
    accountNumber: initialData?.salary?.bankDetails?.accountNumber || '',
    bankName:      initialData?.salary?.bankDetails?.bankName     || '',
    ifscCode:      initialData?.salary?.bankDetails?.ifscCode     || '',

    // Emergency Contact
    emergencyContactName:     initialData?.emergencyContact?.name     || '',
    emergencyContactRelation: initialData?.emergencyContact?.relation || '',
    emergencyContactPhone:    initialData?.emergencyContact?.phone    || '',
    emergencyContactAddress:  initialData?.emergencyContact?.address  || '',

    // Documents (File objects — replaced by URLs after upload)
    resume:                    null,
    idProof:                   null,
    addressProof:              null,
    qualificationCertificates: null,
    experienceCertificates:    null,
    policeVerification:        null,
    medicalCertificate:        null,

    // Additional Information
    skills:    initialData?.additional?.skills    || [],
    languages: initialData?.additional?.languages || [],
    hobbies:   initialData?.additional?.hobbies   || '',
    achievements: initialData?.additional?.achievements || '',
    references:   initialData?.additional?.references  || '',
    socialMediaLinks: {
      linkedin: initialData?.additional?.socialMedia?.linkedin || '',
      twitter:  initialData?.additional?.socialMedia?.twitter  || '',
      website:  initialData?.additional?.socialMedia?.website  || '',
    },
  });

  const [errors,          setErrors]          = useState({});
  const [uploadProgress,  setUploadProgress]  = useState({});
  const [isSubmitting,    setIsSubmitting]     = useState(false);
  const [submitError,     setSubmitError]      = useState('');
  const [photoPreview,    setPhotoPreview]     = useState(initialData?.photo || '');
  const [photoUploading,  setPhotoUploading]   = useState(false);

  const photoInputRef = useRef(null);

  // ── uploadFile defined INSIDE component so setSubmitError is in scope ──────
  const uploadFile = useCallback(async (file, fieldName) => {
    if (!file) return '';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('field', fieldName);
    try {
      const { data } = await uploadApi.post('', fd);
      return data.url || data.secure_url || '';
    } catch (err) {
      console.error(`Upload failed for ${fieldName}:`, err.response?.data || err.message);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setSubmitError('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        setSubmitError(`Upload failed for ${fieldName}: ${err.response?.data?.message || err.message}`);
      }
      throw err;
    }
  }, []);

  const steps = [
    { id: 1, name: 'Personal Info',     icon: User,          description: 'Basic details' },
    { id: 2, name: 'Contact Details',   icon: MapPin,        description: 'Address & contact' },
    { id: 3, name: 'Qualifications',    icon: GraduationCap, description: 'Education & experience' },
    { id: 4, name: 'Employment',        icon: Briefcase,     description: 'Job details' },
    { id: 5, name: 'Salary & Benefits', icon: DollarSign,    description: 'Compensation' },
    { id: 6, name: 'Emergency Contact', icon: Shield,        description: 'Emergency info' },
    { id: 7, name: 'Documents',         icon: FileText,      description: 'Upload documents' },
    { id: 8, name: 'Additional Info',   icon: Award,         description: 'Skills & interests' },
    { id: 9, name: 'Review',            icon: CheckCircle,   description: 'Review & submit' },
  ];

  const departments = [
    'Mathematics', 'Science', 'English', 'History', 'Computer Science',
    'Physical Education', 'Arts', 'Music', 'Languages', 'Social Studies',
  ];

  const subjectsByDepartment = {
    'Mathematics':        ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Trigonometry'],
    'Science':            ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
    'English':            ['Literature', 'Grammar', 'Creative Writing', 'Communication Skills'],
    'History':            ['World History', 'American History', 'Ancient Civilizations'],
    'Computer Science':   ['Programming', 'Web Development', 'Database', 'AI/ML'],
    'Physical Education': ['Sports', 'Fitness', 'Yoga', 'Athletics'],
    'Arts':               ['Drawing', 'Painting', 'Sculpture', 'Crafts'],
    'Music':              ['Vocal', 'Instrumental', 'Music Theory'],
    'Languages':          ['Spanish', 'French', 'German', 'Mandarin'],
    'Social Studies':     ['Geography', 'Civics', 'Economics', 'Sociology'],
  };

  const bloodGroups  = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const designations = ['Teacher', 'Senior Teacher', 'Department Head', 'Subject Coordinator', 'Vice Principal'];

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleArrayInput = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: array }));
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;
    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const next = (prev[field] || 0) + 10;
        if (next >= 100) {
          clearInterval(interval);
          return { ...prev, [field]: 100 };
        }
        return { ...prev, [field]: next };
      });
    }, 100);

    setTimeout(() => {
      setFormData(prev => ({ ...prev, [field]: file }));
      setUploadProgress(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }, 1200);
  };

  // Photo upload — upload immediately, store URL, show blob preview instantly
  const handlePhotoUpload = async (files) => {
    if (!files?.length) return;
    const file = files[0];
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setPhotoUploading(true);
    try {
      const uploadedUrl = await uploadFile(file, 'photo');
      setFormData(prev => ({ ...prev, photo: uploadedUrl }));
    } catch (err) {
      console.error('Photo upload failed:', err);
      setFormData(prev => ({ ...prev, photo: '' }));
    } finally {
      setPhotoUploading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date(), birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const calculateNetSalary = () => {
    const basic  = parseFloat(formData.basicSalary) || 0;
    const allow  = parseFloat(formData.allowances)  || 0;
    const deduct = parseFloat(formData.deductions)  || 0;
    return basic + allow - deduct;
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName   = 'First name is required';
        if (!formData.lastName.trim())  newErrors.lastName    = 'Last name is required';
        if (!formData.dateOfBirth)      newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender)           newErrors.gender      = 'Gender is required';
        if (!formData.bloodGroup)       newErrors.bloodGroup  = 'Blood group is required';
        break;
      case 2:
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim())   newErrors.phone   = 'Phone number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim())    newErrors.city    = 'City is required';
        if (!formData.state.trim())   newErrors.state   = 'State is required';
        break;
      case 3:
        if (!formData.highestQualification.trim()) newErrors.highestQualification = 'Qualification is required';
        if (!formData.university.trim())           newErrors.university           = 'University is required';
        if (!formData.teachingExperience)          newErrors.teachingExperience   = 'Teaching experience is required';
        break;
      case 4:
        if (!formData.department)           newErrors.department  = 'Department is required';
        if (formData.subjects.length === 0) newErrors.subjects    = 'At least one subject is required';
        if (!formData.designation)          newErrors.designation = 'Designation is required';
        if (!formData.joinDate)             newErrors.joinDate    = 'Join date is required';
        break;
      case 5:
        if (!formData.basicSalary) newErrors.basicSalary = 'Basic salary is required';
        if (formData.paymentMode === 'Bank Transfer' && !formData.accountNumber)
          newErrors.accountNumber = 'Account number is required';
        break;
      case 6:
        if (!formData.emergencyContactName.trim())  newErrors.emergencyContactName  = 'Emergency contact name is required';
        if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
        break;
      case 7:
        // Skip document validation when editing (docs already uploaded)
        if (!initialData) {
          if (!formData.resume)                    newErrors.resume                    = 'Resume is required';
          if (!formData.idProof)                   newErrors.idProof                   = 'ID proof is required';
          if (!formData.qualificationCertificates) newErrors.qualificationCertificates = 'Qualification certificates are required';
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 1️⃣  Upload document files → get back URL strings
      const DOC_FIELDS = [
        'resume', 'idProof', 'addressProof',
        'qualificationCertificates', 'experienceCertificates',
        'policeVerification', 'medicalCertificate',
      ];

      const docUrls = {};
      await Promise.all(
        DOC_FIELDS.map(async (field) => {
          if (formData[field] instanceof File) {
            docUrls[`${field}Url`] = await uploadFile(formData[field], field);
          }
        })
      );

      // 2️⃣  Build flat payload (matches buildTeacherDoc in controller)
      const payload = {
        // Personal
        firstName:    formData.firstName,
        middleName:   formData.middleName,
        lastName:     formData.lastName,
        dateOfBirth:  formData.dateOfBirth,
        gender:       formData.gender,
        bloodGroup:   formData.bloodGroup,
        nationality:  formData.nationality,
        religion:     formData.religion,
        maritalStatus: formData.maritalStatus,
        photo:        formData.photo ?? '',

        // Contact
        email:          formData.email,
        alternateEmail: formData.alternateEmail,
        phone:          formData.phone,
        alternatePhone: formData.alternatePhone,
        address:        formData.address,   // controller maps to address.street
        city:           formData.city,
        state:          formData.state,
        zipCode:        formData.zipCode,
        country:        formData.country,

        // Qualifications
        highestQualification:     formData.highestQualification,
        university:               formData.university,
        yearOfPassing:            formData.yearOfPassing,
        specialization:           formData.specialization,
        additionalCertifications: formData.additionalCertifications,
        teachingExperience:       formData.teachingExperience,
        previousSchools:          formData.previousSchools,

        // Employment
        teacherId:       formData.teacherId,
        department:      formData.department,
        subjects:        formData.subjects,
        designation:     formData.designation,
        employmentType:  formData.employmentType,
        joinDate:        formData.joinDate,
        contractEndDate: formData.contractEndDate,
        probationPeriod: formData.probationPeriod,
        workingHours:    formData.workingHours,

        // Salary
        basicSalary:   formData.basicSalary,
        allowances:    formData.allowances,
        deductions:    formData.deductions,
        paymentMode:   formData.paymentMode,
        accountNumber: formData.accountNumber,
        bankName:      formData.bankName,
        ifscCode:      formData.ifscCode,

        // Emergency
        emergencyContactName:     formData.emergencyContactName,
        emergencyContactRelation: formData.emergencyContactRelation,
        emergencyContactPhone:    formData.emergencyContactPhone,
        emergencyContactAddress:  formData.emergencyContactAddress,

        // Document URLs (uploaded above)
        ...docUrls,

        // Additional
        skills:           formData.skills,
        languages:        formData.languages,
        hobbies:          formData.hobbies,
        achievements:     formData.achievements,
        references:       formData.references,
        socialMediaLinks: formData.socialMediaLinks,
      };

      // 3️⃣  POST (add) or PUT (edit)
      let responseData;
      if (initialData?._id) {
        const { data } = await api.put(`/teachers/${initialData._id}`, payload);
        responseData = data.data ?? data;
      } else {
        const { data } = await api.post('/teachers', payload);
        responseData = data.data ?? data.teacher ?? data;
      }

      // 4️⃣  Notify parent and close
      if (onSubmit) onSubmit(responseData);
      if (onClose)  onClose();

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to save teacher. Please check your connection and try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step content ─────────────────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                {/* ✅ overflow-hidden on the circle div so img fills it correctly */}
                <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {photoPreview || formData.photo ? (
                    <img
                      src={photoPreview || formData.photo}
                      alt="Teacher"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {photoUploading
                    ? <RefreshCw className="w-5 h-5 animate-spin" />
                    : <Camera className="w-5 h-5" />}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {photoUploading ? 'Uploading photo…' : 'Upload teacher photo (optional)'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="First Name" required error={errors.firstName}>
                <input type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className={inputClassName(errors.firstName)} placeholder="Enter first name" />
              </FormField>
              <FormField label="Middle Name">
                <input type="text" value={formData.middleName} onChange={(e) => handleInputChange('middleName', e.target.value)} className={inputClassName()} placeholder="Enter middle name" />
              </FormField>
              <FormField label="Last Name" required error={errors.lastName}>
                <input type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className={inputClassName(errors.lastName)} placeholder="Enter last name" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Date of Birth" required error={errors.dateOfBirth}>
                <input type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} className={inputClassName(errors.dateOfBirth)} />
                {formData.dateOfBirth && <p className="text-xs text-gray-600 mt-1">Age: {calculateAge(formData.dateOfBirth)} years</p>}
              </FormField>
              <FormField label="Gender" required error={errors.gender}>
                <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)} className={inputClassName(errors.gender)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
              <FormField label="Blood Group" required error={errors.bloodGroup}>
                <select value={formData.bloodGroup} onChange={(e) => handleInputChange('bloodGroup', e.target.value)} className={inputClassName(errors.bloodGroup)}>
                  <option value="">Select blood group</option>
                  {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Nationality">
                <input type="text" value={formData.nationality} onChange={(e) => handleInputChange('nationality', e.target.value)} className={inputClassName()} placeholder="Enter nationality" />
              </FormField>
              <FormField label="Religion">
                <input type="text" value={formData.religion} onChange={(e) => handleInputChange('religion', e.target.value)} className={inputClassName()} placeholder="Enter religion" />
              </FormField>
              <FormField label="Marital Status">
                <select value={formData.maritalStatus} onChange={(e) => handleInputChange('maritalStatus', e.target.value)} className={inputClassName()}>
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </FormField>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email Address" required error={errors.email}>
                <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClassName(errors.email)} placeholder="teacher@example.com" />
              </FormField>
              <FormField label="Alternate Email">
                <input type="email" value={formData.alternateEmail} onChange={(e) => handleInputChange('alternateEmail', e.target.value)} className={inputClassName()} placeholder="alternate@example.com" />
              </FormField>
              <FormField label="Phone Number" required error={errors.phone}>
                <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={inputClassName(errors.phone)} placeholder="+91 98765 43210" />
              </FormField>
              <FormField label="Alternate Phone">
                <input type="tel" value={formData.alternatePhone} onChange={(e) => handleInputChange('alternatePhone', e.target.value)} className={inputClassName()} placeholder="+91 98765 43210" />
              </FormField>
            </div>
            <FormField label="Address" required error={errors.address}>
              <textarea value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className={inputClassName(errors.address)} placeholder="Enter complete address" rows="3" />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="City" required error={errors.city}>
                <input type="text" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} className={inputClassName(errors.city)} placeholder="Enter city" />
              </FormField>
              <FormField label="State" required error={errors.state}>
                <input type="text" value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} className={inputClassName(errors.state)} placeholder="Enter state" />
              </FormField>
              <FormField label="ZIP / PIN Code">
                <input type="text" value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} className={inputClassName()} placeholder="Enter ZIP / PIN code" />
              </FormField>
              <FormField label="Country">
                <input type="text" value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} className={inputClassName()} placeholder="Enter country" />
              </FormField>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Highest Qualification" required error={errors.highestQualification}>
                <input type="text" value={formData.highestQualification} onChange={(e) => handleInputChange('highestQualification', e.target.value)} className={inputClassName(errors.highestQualification)} placeholder="e.g., M.Sc. Mathematics" />
              </FormField>
              <FormField label="University / Institution" required error={errors.university}>
                <input type="text" value={formData.university} onChange={(e) => handleInputChange('university', e.target.value)} className={inputClassName(errors.university)} placeholder="Enter university name" />
              </FormField>
              <FormField label="Year of Passing">
                <input type="number" value={formData.yearOfPassing} onChange={(e) => handleInputChange('yearOfPassing', e.target.value)} className={inputClassName()} placeholder="e.g., 2015" min="1950" max={new Date().getFullYear()} />
              </FormField>
              <FormField label="Specialization">
                <input type="text" value={formData.specialization} onChange={(e) => handleInputChange('specialization', e.target.value)} className={inputClassName()} placeholder="Enter specialization" />
              </FormField>
            </div>
            <FormField label="Additional Certifications">
              <textarea value={formData.additionalCertifications} onChange={(e) => handleInputChange('additionalCertifications', e.target.value)} className={inputClassName()} placeholder="List any additional certifications, courses, or training" rows="3" />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Total Teaching Experience (years)" required error={errors.teachingExperience}>
                <input type="number" value={formData.teachingExperience} onChange={(e) => handleInputChange('teachingExperience', e.target.value)} className={inputClassName(errors.teachingExperience)} placeholder="Enter years of experience" min="0" />
              </FormField>
              <FormField label="Previous Schools">
                <input type="text" value={formData.previousSchools} onChange={(e) => handleInputChange('previousSchools', e.target.value)} className={inputClassName()} placeholder="Enter previous schools (comma separated)" />
              </FormField>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Teacher ID">
                <input type="text" value={formData.teacherId} onChange={(e) => handleInputChange('teacherId', e.target.value)} className={inputClassName()} placeholder="Auto-generated or enter manually" />
                <p className="text-xs text-gray-600 mt-1">Leave blank for auto-generation</p>
              </FormField>
              <FormField label="Department" required error={errors.department}>
                <select value={formData.department} onChange={(e) => { handleInputChange('department', e.target.value); handleInputChange('subjects', []); }} className={inputClassName(errors.department)}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="Subjects" required error={errors.subjects} className="md:col-span-2">
                <div className="space-y-2">
                  {formData.department && subjectsByDepartment[formData.department] ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {subjectsByDepartment[formData.department].map(subject => (
                        <label key={subject} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                          <input type="checkbox" checked={formData.subjects.includes(subject)} onChange={(e) => {
                            if (e.target.checked) handleInputChange('subjects', [...formData.subjects, subject]);
                            else handleInputChange('subjects', formData.subjects.filter(s => s !== subject));
                          }} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-sm">{subject}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Please select a department first</p>
                  )}
                  {formData.subjects.length > 0 && (
                    <p className="text-xs text-green-600">Selected: {formData.subjects.join(', ')}</p>
                  )}
                </div>
              </FormField>
              <FormField label="Designation" required error={errors.designation}>
                <select value={formData.designation} onChange={(e) => handleInputChange('designation', e.target.value)} className={inputClassName(errors.designation)}>
                  <option value="">Select designation</option>
                  {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="Employment Type">
                <select value={formData.employmentType} onChange={(e) => handleInputChange('employmentType', e.target.value)} className={inputClassName()}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </FormField>
              <FormField label="Join Date" required error={errors.joinDate}>
                <input type="date" value={formData.joinDate} onChange={(e) => handleInputChange('joinDate', e.target.value)} className={inputClassName(errors.joinDate)} />
              </FormField>
              <FormField label="Contract End Date">
                <input type="date" value={formData.contractEndDate} onChange={(e) => handleInputChange('contractEndDate', e.target.value)} className={inputClassName()} />
                <p className="text-xs text-gray-600 mt-1">For contract employees only</p>
              </FormField>
              <FormField label="Probation Period (months)">
                <input type="number" value={formData.probationPeriod} onChange={(e) => handleInputChange('probationPeriod', e.target.value)} className={inputClassName()} placeholder="e.g., 6" min="0" />
              </FormField>
              <FormField label="Working Hours / Week">
                <input type="number" value={formData.workingHours} onChange={(e) => handleInputChange('workingHours', e.target.value)} className={inputClassName()} placeholder="e.g., 40" min="0" />
              </FormField>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Basic Salary (Annual)" required error={errors.basicSalary}>
                <input type="number" value={formData.basicSalary} onChange={(e) => handleInputChange('basicSalary', e.target.value)} className={inputClassName(errors.basicSalary)} placeholder="Enter amount" min="0" />
              </FormField>
              <FormField label="Allowances">
                <input type="number" value={formData.allowances} onChange={(e) => handleInputChange('allowances', e.target.value)} className={inputClassName()} placeholder="Enter allowances" min="0" />
              </FormField>
              <FormField label="Deductions">
                <input type="number" value={formData.deductions} onChange={(e) => handleInputChange('deductions', e.target.value)} className={inputClassName()} placeholder="Enter deductions" min="0" />
              </FormField>
              <FormField label="Net Salary">
                <input type="number" value={calculateNetSalary()} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" disabled />
                <p className="text-xs text-gray-600 mt-1">Calculated automatically</p>
              </FormField>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Salary Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-blue-800">Basic Salary:</span><span className="font-semibold">₹{formData.basicSalary || 0}</span></div>
                <div className="flex justify-between"><span className="text-blue-800">Allowances:</span><span className="font-semibold text-green-600">+₹{formData.allowances || 0}</span></div>
                <div className="flex justify-between"><span className="text-blue-800">Deductions:</span><span className="font-semibold text-red-600">-₹{formData.deductions || 0}</span></div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="text-blue-900 font-semibold">Net Salary:</span>
                  <span className="font-bold text-lg text-blue-900">₹{calculateNetSalary().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Payment Mode">
                  <select value={formData.paymentMode} onChange={(e) => handleInputChange('paymentMode', e.target.value)} className={inputClassName()}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Cash">Cash</option>
                  </select>
                </FormField>
                {formData.paymentMode === 'Bank Transfer' && (
                  <>
                    <FormField label="Account Number" required error={errors.accountNumber}>
                      <input type="text" value={formData.accountNumber} onChange={(e) => handleInputChange('accountNumber', e.target.value)} className={inputClassName(errors.accountNumber)} placeholder="Enter account number" />
                    </FormField>
                    <FormField label="Bank Name">
                      <input type="text" value={formData.bankName} onChange={(e) => handleInputChange('bankName', e.target.value)} className={inputClassName()} placeholder="Enter bank name" />
                    </FormField>
                    <FormField label="IFSC Code">
                      <input type="text" value={formData.ifscCode} onChange={(e) => handleInputChange('ifscCode', e.target.value)} className={inputClassName()} placeholder="Enter IFSC code" />
                    </FormField>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-semibold">Emergency Contact Information</p>
                  <p className="text-xs text-red-700 mt-1">This information will be used in case of emergencies. Please ensure it's accurate.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Contact Name" required error={errors.emergencyContactName}>
                <input type="text" value={formData.emergencyContactName} onChange={(e) => handleInputChange('emergencyContactName', e.target.value)} className={inputClassName(errors.emergencyContactName)} placeholder="Enter full name" />
              </FormField>
              <FormField label="Relationship">
                <input type="text" value={formData.emergencyContactRelation} onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)} className={inputClassName()} placeholder="e.g., Spouse, Parent, Sibling" />
              </FormField>
              <FormField label="Phone Number" required error={errors.emergencyContactPhone}>
                <input type="tel" value={formData.emergencyContactPhone} onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)} className={inputClassName(errors.emergencyContactPhone)} placeholder="+91 98765 43210" />
              </FormField>
              <FormField label="Address" className="md:col-span-2">
                <textarea value={formData.emergencyContactAddress} onChange={(e) => handleInputChange('emergencyContactAddress', e.target.value)} className={inputClassName()} placeholder="Enter complete address" rows="2" />
              </FormField>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 font-semibold">Document Upload Requirements</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {initialData
                      ? 'Upload new files to replace existing documents, or skip to keep current ones.'
                      : 'Accepted formats: PDF, JPG, PNG (Max 5MB per file)'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Resume / CV" required={!initialData} error={errors.resume}>
                <FileUploadField file={formData.resume} progress={uploadProgress.resume} onUpload={(f) => handleFileUpload('resume', f)} accept=".pdf,.doc,.docx" required={!initialData} />
                {initialData?.documents?.resume && !formData.resume && (
                  <p className="text-xs text-green-600 mt-1">✓ Already uploaded — <a href={initialData.documents.resume} target="_blank" rel="noopener noreferrer" className="underline">view</a></p>
                )}
              </FormField>
              <FormField label="ID Proof" required={!initialData} error={errors.idProof}>
                <FileUploadField file={formData.idProof} progress={uploadProgress.idProof} onUpload={(f) => handleFileUpload('idProof', f)} accept=".pdf,.jpg,.jpeg,.png" required={!initialData} />
                <p className="text-xs text-gray-600 mt-1">Passport, Driver's License, or Aadhaar</p>
                {initialData?.documents?.idProof && !formData.idProof && (
                  <p className="text-xs text-green-600 mt-1">✓ Already uploaded</p>
                )}
              </FormField>
              <FormField label="Address Proof">
                <FileUploadField file={formData.addressProof} progress={uploadProgress.addressProof} onUpload={(f) => handleFileUpload('addressProof', f)} accept=".pdf,.jpg,.jpeg,.png" />
              </FormField>
              <FormField label="Qualification Certificates" required={!initialData} error={errors.qualificationCertificates}>
                <FileUploadField file={formData.qualificationCertificates} progress={uploadProgress.qualificationCertificates} onUpload={(f) => handleFileUpload('qualificationCertificates', f)} accept=".pdf,.jpg,.jpeg,.png" required={!initialData} />
                {initialData?.documents?.qualificationCertificates && !formData.qualificationCertificates && (
                  <p className="text-xs text-green-600 mt-1">✓ Already uploaded</p>
                )}
              </FormField>
              <FormField label="Experience Certificates">
                <FileUploadField file={formData.experienceCertificates} progress={uploadProgress.experienceCertificates} onUpload={(f) => handleFileUpload('experienceCertificates', f)} accept=".pdf,.jpg,.jpeg,.png" />
              </FormField>
              <FormField label="Police Verification">
                <FileUploadField file={formData.policeVerification} progress={uploadProgress.policeVerification} onUpload={(f) => handleFileUpload('policeVerification', f)} accept=".pdf,.jpg,.jpeg,.png" />
              </FormField>
              <FormField label="Medical Certificate">
                <FileUploadField file={formData.medicalCertificate} progress={uploadProgress.medicalCertificate} onUpload={(f) => handleFileUpload('medicalCertificate', f)} accept=".pdf,.jpg,.jpeg,.png" />
              </FormField>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField label="Skills">
                <input type="text" value={formData.skills.join(', ')} onChange={(e) => handleArrayInput('skills', e.target.value)} className={inputClassName()} placeholder="e.g., Communication, Leadership, Problem Solving (comma separated)" />
              </FormField>
              <FormField label="Languages Known">
                <input type="text" value={formData.languages.join(', ')} onChange={(e) => handleArrayInput('languages', e.target.value)} className={inputClassName()} placeholder="e.g., English, Hindi, Tamil (comma separated)" />
              </FormField>
              <FormField label="Hobbies & Interests">
                <textarea value={formData.hobbies} onChange={(e) => handleInputChange('hobbies', e.target.value)} className={inputClassName()} placeholder="Enter hobbies and interests" rows="3" />
              </FormField>
              <FormField label="Achievements & Awards">
                <textarea value={formData.achievements} onChange={(e) => handleInputChange('achievements', e.target.value)} className={inputClassName()} placeholder="List any notable achievements or awards" rows="3" />
              </FormField>
              <FormField label="Professional References">
                <textarea value={formData.references} onChange={(e) => handleInputChange('references', e.target.value)} className={inputClassName()} placeholder="Name, Position, Contact (one per line)" rows="3" />
              </FormField>
            </div>
            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Social Media Links (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="LinkedIn">
                  <input type="url" value={formData.socialMediaLinks.linkedin} onChange={(e) => handleInputChange('socialMediaLinks', { ...formData.socialMediaLinks, linkedin: e.target.value })} className={inputClassName()} placeholder="https://linkedin.com/in/..." />
                </FormField>
                <FormField label="Twitter">
                  <input type="url" value={formData.socialMediaLinks.twitter} onChange={(e) => handleInputChange('socialMediaLinks', { ...formData.socialMediaLinks, twitter: e.target.value })} className={inputClassName()} placeholder="https://twitter.com/..." />
                </FormField>
                <FormField label="Website / Portfolio">
                  <input type="url" value={formData.socialMediaLinks.website} onChange={(e) => handleInputChange('socialMediaLinks', { ...formData.socialMediaLinks, website: e.target.value })} className={inputClassName()} placeholder="https://..." />
                </FormField>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {initialData ? 'Review Updated Information' : 'Review Teacher Information'}
              </h3>
              <p className="text-gray-600">Please review all information before submitting</p>
            </div>

            <div className="space-y-4">
              <ReviewSection title="Personal Information" icon={User}>
                <ReviewItem label="Full Name" value={`${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()} />
                <ReviewItem label="Date of Birth" value={formData.dateOfBirth} />
                <ReviewItem label="Gender" value={formData.gender} />
                <ReviewItem label="Blood Group" value={formData.bloodGroup} />
                <ReviewItem label="Marital Status" value={formData.maritalStatus || 'Not specified'} />
              </ReviewSection>

              <ReviewSection title="Contact Details" icon={MapPin}>
                <ReviewItem label="Email" value={formData.email} />
                <ReviewItem label="Phone" value={formData.phone} />
                <ReviewItem label="Address" value={[formData.address, formData.city, formData.state].filter(Boolean).join(', ')} />
              </ReviewSection>

              <ReviewSection title="Qualifications" icon={GraduationCap}>
                <ReviewItem label="Highest Qualification" value={formData.highestQualification} />
                <ReviewItem label="University" value={formData.university} />
                <ReviewItem label="Teaching Experience" value={`${formData.teachingExperience} years`} />
              </ReviewSection>

              <ReviewSection title="Employment Details" icon={Briefcase}>
                <ReviewItem label="Department" value={formData.department} />
                <ReviewItem label="Subjects" value={formData.subjects.join(', ')} />
                <ReviewItem label="Designation" value={formData.designation} />
                <ReviewItem label="Employment Type" value={formData.employmentType} />
                <ReviewItem label="Join Date" value={formData.joinDate} />
              </ReviewSection>

              <ReviewSection title="Salary & Benefits" icon={DollarSign}>
                <ReviewItem label="Basic Salary" value={`₹${formData.basicSalary}`} />
                <ReviewItem label="Net Salary" value={`₹${calculateNetSalary().toLocaleString()}`} highlight />
                <ReviewItem label="Payment Mode" value={formData.paymentMode} />
              </ReviewSection>

              <ReviewSection title="Emergency Contact" icon={Shield}>
                <ReviewItem label="Contact Name" value={formData.emergencyContactName} />
                <ReviewItem label="Phone" value={formData.emergencyContactPhone} />
                <ReviewItem label="Relationship" value={formData.emergencyContactRelation} />
              </ReviewSection>

              <ReviewSection title="Documents" icon={FileText}>
                <ReviewItem label="Resume"
                  value={formData.resume ? '✓ New file selected' : initialData?.documents?.resume ? '✓ Previously uploaded' : '✗ Not uploaded'} />
                <ReviewItem label="ID Proof"
                  value={formData.idProof ? '✓ New file selected' : initialData?.documents?.idProof ? '✓ Previously uploaded' : '✗ Not uploaded'} />
                <ReviewItem label="Qualification Certificates"
                  value={formData.qualificationCertificates ? '✓ New file selected' : initialData?.documents?.qualificationCertificates ? '✓ Previously uploaded' : '✗ Not uploaded'} />
                <ReviewItem label="Experience Certificates"
                  value={formData.experienceCertificates ? '✓ New file selected' : initialData?.documents?.experienceCertificates ? '✓ Previously uploaded' : '✗ Not uploaded'} />
              </ReviewSection>

              {(formData.skills.length > 0 || formData.languages.length > 0) && (
                <ReviewSection title="Additional Information" icon={Award}>
                  {formData.skills.length > 0    && <ReviewItem label="Skills"    value={formData.skills.join(', ')} />}
                  {formData.languages.length > 0 && <ReviewItem label="Languages" value={formData.languages.join(', ')} />}
                </ReviewSection>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input type="checkbox" id="termsAccepted" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                  I hereby declare that all the information provided above is true and correct to the best of my knowledge.
                  I understand that any false information may result in the termination of employment.
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {initialData ? 'Edit Teacher' : 'Add New Teacher'}
              </h1>
              <p className="text-gray-600 mt-1">
                {initialData
                  ? 'Update teacher information across all steps'
                  : 'Complete all steps to add a new teacher to the system'}
              </p>
            </div>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1 min-w-[100px]">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.name}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 transition-all ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submission error banner */}
        {submitError && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{submitError}</span>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{steps[currentStep - 1].name}</h2>
            <p className="text-gray-600 text-sm">{steps[currentStep - 1].description}</p>
          </div>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-gray-600">Step {currentStep} of {steps.length}</div>

          {currentStep < steps.length ? (
            <button onClick={handleNext} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /><span>Saving…</span></>
              ) : (
                <><Send className="w-5 h-5" /><span>{initialData ? 'Save Changes' : 'Add Teacher'}</span></>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

// ── Helper Sub-Components ─────────────────────────────────────────────────────

const FormField = ({ label, required, error, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
        <AlertCircle className="w-3 h-3" /><span>{error}</span>
      </p>
    )}
  </div>
);

const FileUploadField = ({ file, progress, onUpload, accept, required }) => {
  const inputRef = useRef(null);
  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        {progress !== undefined ? (
          <div className="space-y-2">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">Uploading… {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : file ? (
          <div className="space-y-2">
            <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-600">Click to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">{accept || 'PDF, JPG, PNG'} (Max 5MB)</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
    </div>
  );
};

const ReviewSection = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
      <Icon className="w-4 h-4 mr-2 text-blue-600" />{title}
    </h4>
    <div className="space-y-2">{children}</div>
  </div>
);

const ReviewItem = ({ label, value, highlight }) => (
  <div className="flex justify-between items-start text-sm">
    <span className="text-gray-600 flex-shrink-0 w-1/3">{label}:</span>
    <span className={`font-medium text-right flex-1 ${highlight ? 'text-blue-600 text-lg' : 'text-gray-900'}`}>{value}</span>
  </div>
);

const inputClassName = (hasError) => `
  w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
  ${hasError
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  }
`;

export default AddTeacher;