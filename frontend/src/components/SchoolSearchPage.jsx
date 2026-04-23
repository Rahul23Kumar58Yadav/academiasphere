import React, { useState, useEffect } from 'react';
import {
  Search,
  GraduationCap,
  MapPin,
  Users,
  Building2,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Filter,
  Star,
  Globe,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const SchoolSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Sample school data - In production, this would come from your API
  const schools = [
    {
      id: 1,
      name: "Delhi Public School",
      location: "New Delhi, Delhi",
      state: "Delhi",
      city: "New Delhi",
      type: "CBSE",
      students: 2500,
      rating: 4.8,
      status: "verified",
      established: 1995,
      contact: {
        phone: "+91 11 2234 5678",
        email: "info@dpsdelhi.edu.in",
        website: "www.dpsdelhi.edu.in"
      },
      features: ["AI-Powered", "Blockchain Secured", "Smart Classes"]
    },
    {
      id: 2,
      name: "Ryan International School",
      location: "Noida, Uttar Pradesh",
      state: "Uttar Pradesh",
      city: "Noida",
      type: "CBSE",
      students: 3200,
      rating: 4.6,
      status: "verified",
      established: 2001,
      contact: {
        phone: "+91 120 4567 890",
        email: "admissions@ryannoida.edu.in",
        website: "www.ryangroup.org"
      },
      features: ["Digital Learning", "Sports Excellence", "International Curriculum"]
    },
    {
      id: 3,
      name: "Kendriya Vidyalaya",
      location: "Gurgaon, Haryana",
      state: "Haryana",
      city: "Gurgaon",
      type: "CBSE",
      students: 1800,
      rating: 4.5,
      status: "verified",
      established: 1988,
      contact: {
        phone: "+91 124 4567 123",
        email: "kvgurgaon@kvsangathan.nic.in",
        website: "www.kvgurgaon.edu.in"
      },
      features: ["Government Affiliated", "Affordable Fees", "Quality Education"]
    },
    {
      id: 4,
      name: "St. Xavier's School",
      location: "Mumbai, Maharashtra",
      state: "Maharashtra",
      city: "Mumbai",
      type: "ICSE",
      students: 2100,
      rating: 4.9,
      status: "verified",
      established: 1976,
      contact: {
        phone: "+91 22 2345 6789",
        email: "info@stxaviersmumbai.edu.in",
        website: "www.stxaviersmumbai.edu.in"
      },
      features: ["Premium Infrastructure", "Co-curricular Activities", "Alumni Network"]
    },
    {
      id: 5,
      name: "The Heritage School",
      location: "Bangalore, Karnataka",
      state: "Karnataka",
      city: "Bangalore",
      type: "Cambridge",
      students: 1500,
      rating: 4.7,
      status: "pending",
      established: 2010,
      contact: {
        phone: "+91 80 4123 5678",
        email: "admissions@heritage.edu.in",
        website: "www.heritageschool.in"
      },
      features: ["International Board", "Innovation Lab", "Global Exposure"]
    },
    {
      id: 6,
      name: "Modern School",
      location: "Pune, Maharashtra",
      state: "Maharashtra",
      city: "Pune",
      type: "CBSE",
      students: 2800,
      rating: 4.6,
      status: "verified",
      established: 1992,
      contact: {
        phone: "+91 20 2567 8901",
        email: "info@modernpune.edu.in",
        website: "www.modernschoolpune.edu.in"
      },
      features: ["STEM Focus", "Robotics Lab", "Advanced Learning"]
    }
  ];

  const states = [...new Set(schools.map(s => s.state))];
  const cities = selectedState 
    ? [...new Set(schools.filter(s => s.state === selectedState).map(s => s.city))]
    : [];
  const schoolTypes = [...new Set(schools.map(s => s.type))];

  useEffect(() => {
    handleSearch();
  }, [searchQuery, selectedState, selectedCity, selectedType]);

  const handleSearch = () => {
    setIsSearching(true);
    
    setTimeout(() => {
      let results = schools;

      if (searchQuery) {
        results = results.filter(school =>
          school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          school.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedState) {
        results = results.filter(school => school.state === selectedState);
      }

      if (selectedCity) {
        results = results.filter(school => school.city === selectedCity);
      }

      if (selectedType) {
        results = results.filter(school => school.type === selectedType);
      }

      setFilteredSchools(results);
      setIsSearching(false);
    }, 300);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setSelectedCity('');
    setSelectedType('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <GraduationCap className="w-8 h-8 text-purple-600" />
                  <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AcademySphere
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Find Your School
            </div>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect School
            </h1>
            <p className="text-xl text-white/90">
              Search from {schools.length}+ registered schools across India
            </p>
          </div>

          {/* Main Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex items-center space-x-3 px-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by school name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-4 text-gray-900 placeholder-gray-400 focus:outline-none text-lg"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filters</span>
              </button>
              <button
                onClick={handleSearch}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-semibold"
              >
                Search
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setSelectedCity('');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">All States</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={!selectedState}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
                    >
                      <option value="">All Cities</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Board Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">All Boards</option>
                      {schoolTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(searchQuery || selectedState || selectedCity || selectedType) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isSearching ? 'Searching...' : `${filteredSchools.length} Schools Found`}
              </h2>
              <p className="text-gray-600 mt-1">
                Browse through verified educational institutions
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Verified Schools</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* No Results */}
        {!isSearching && filteredSchools.length === 0 && (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No schools found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* School Cards */}
        {!isSearching && filteredSchools.length > 0 && (
          <div className="grid gap-6">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {school.name}
                        </h3>
                        {school.status === 'verified' && (
                          <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified</span>
                          </div>
                        )}
                        {school.status === 'pending' && (
                          <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{school.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-4 h-4" />
                          <span>{school.type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4" />
                          <span>Est. {school.established}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-yellow-500 mb-1">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="text-lg font-bold text-gray-900">{school.rating}</span>
                      </div>
                      <div className="text-sm text-gray-600">{school.students} Students</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {school.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span>{school.contact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span className="truncate">{school.contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span className="truncate">{school.contact.website}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <button className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all font-semibold">
                      <span>Get Started</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats Banner */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-white/80">Registered Schools</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500K+</div>
              <div className="text-white/80">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-white/80">Teachers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-white/80">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SchoolSearchPage;