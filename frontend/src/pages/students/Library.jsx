import React, { useState, useEffect } from 'react';
import {
  Book,
  BookOpen,
  Search,
  Filter,
  Heart,
  Clock,
  Download,
  Eye,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Bookmark,
  ArrowRight,
  Grid,
  List,
  X,
  Check,
  AlertCircle,
  Sparkles,
  BarChart3,
  Library as LibraryIcon,
  History,
  RefreshCw,
  ExternalLink,
  Share2,
  MessageSquare,
  Award,
  Target,
  Zap
} from 'lucide-react';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    availability: 'all',
    rating: 'all'
  });
  const [userStats, setUserStats] = useState({});
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservingBook, setReservingBook] = useState(null);
  const [readingGoals, setReadingGoals] = useState({});

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setLoading(true);
    // Simulated API call
    setTimeout(() => {
      // Books data
      setBooks([
        {
          id: 'BOOK001',
          title: 'Introduction to Artificial Intelligence',
          author: 'Stuart Russell, Peter Norvig',
          isbn: '978-0134610993',
          category: 'Computer Science',
          cover: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400',
          rating: 4.7,
          reviews: 234,
          totalCopies: 5,
          availableCopies: 2,
          status: 'available',
          description: 'Comprehensive introduction to the theory and practice of artificial intelligence.',
          publisher: 'Pearson',
          publishYear: 2020,
          pages: 1132,
          language: 'English',
          format: ['Physical', 'Digital'],
          popularity: 95,
          trending: true
        },
        {
          id: 'BOOK002',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          author: 'Robert C. Martin',
          isbn: '978-0132350884',
          category: 'Computer Science',
          cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
          rating: 4.8,
          reviews: 456,
          totalCopies: 3,
          availableCopies: 0,
          status: 'unavailable',
          description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
          publisher: 'Prentice Hall',
          publishYear: 2008,
          pages: 464,
          language: 'English',
          format: ['Physical', 'Digital'],
          popularity: 92,
          trending: true
        },
        {
          id: 'BOOK003',
          title: 'The Theory of Everything',
          author: 'Stephen Hawking',
          isbn: '978-8179925911',
          category: 'Physics',
          cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400',
          rating: 4.6,
          reviews: 189,
          totalCopies: 4,
          availableCopies: 3,
          status: 'available',
          description: 'The origin and fate of the universe is a question that has exercised the greatest minds for thousands of years.',
          publisher: 'Jaico Publishing House',
          publishYear: 2006,
          pages: 176,
          language: 'English',
          format: ['Physical', 'Digital'],
          popularity: 88,
          trending: false
        },
        {
          id: 'BOOK004',
          title: 'Sapiens: A Brief History of Humankind',
          author: 'Yuval Noah Harari',
          isbn: '978-0062316097',
          category: 'History',
          cover: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400',
          rating: 4.9,
          reviews: 892,
          totalCopies: 6,
          availableCopies: 4,
          status: 'available',
          description: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution.',
          publisher: 'Harper',
          publishYear: 2015,
          pages: 443,
          language: 'English',
          format: ['Physical', 'Digital', 'Audiobook'],
          popularity: 98,
          trending: true
        },
        {
          id: 'BOOK005',
          title: 'Advanced Mathematics for Engineers',
          author: 'Dennis G. Zill',
          isbn: '978-1284105902',
          category: 'Mathematics',
          cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
          rating: 4.4,
          reviews: 156,
          totalCopies: 8,
          availableCopies: 5,
          status: 'available',
          description: 'Comprehensive coverage of advanced mathematical techniques for engineering students.',
          publisher: 'Jones & Bartlett Learning',
          publishYear: 2018,
          pages: 1056,
          language: 'English',
          format: ['Physical', 'Digital'],
          popularity: 75,
          trending: false
        },
        {
          id: 'BOOK006',
          title: 'The Alchemist',
          author: 'Paulo Coelho',
          isbn: '978-0062315007',
          category: 'Fiction',
          cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
          rating: 4.7,
          reviews: 1234,
          totalCopies: 10,
          availableCopies: 7,
          status: 'available',
          description: 'A magical fable about following your dreams and listening to your heart.',
          publisher: 'HarperOne',
          publishYear: 2014,
          pages: 208,
          language: 'English',
          format: ['Physical', 'Digital', 'Audiobook'],
          popularity: 94,
          trending: true
        },
        {
          id: 'BOOK007',
          title: 'Principles of Marketing',
          author: 'Philip Kotler, Gary Armstrong',
          isbn: '978-0134492513',
          category: 'Business',
          cover: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400',
          rating: 4.5,
          reviews: 267,
          totalCopies: 5,
          availableCopies: 3,
          status: 'available',
          description: 'The definitive text for marketing principles courses worldwide.',
          publisher: 'Pearson',
          publishYear: 2017,
          pages: 720,
          language: 'English',
          format: ['Physical', 'Digital'],
          popularity: 82,
          trending: false
        },
        {
          id: 'BOOK008',
          title: 'Digital Design and Computer Architecture',
          author: 'David Harris, Sarah Harris',
          isbn: '978-0123944245',
          category: 'Computer Science',
          cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
          rating: 4.6,
          reviews: 178,
          totalCopies: 4,
          availableCopies: 1,
          status: 'available',
          description: 'Modern approach to learning digital design and computer architecture.',
          publisher: 'Morgan Kaufmann',
          publishYear: 2012,
          pages: 712,
          language: 'English',
          format: ['Physical', 'Digital'],
          popularity: 79,
          trending: false
        }
      ]);

      // Borrowed books
      setBorrowedBooks([
        {
          id: 'BORROW001',
          bookId: 'BOOK002',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          author: 'Robert C. Martin',
          borrowDate: '2026-01-15',
          dueDate: '2026-02-15',
          status: 'active',
          daysLeft: 13,
          renewals: 0,
          maxRenewals: 2
        },
        {
          id: 'BORROW002',
          bookId: 'BOOK004',
          title: 'Sapiens: A Brief History of Humankind',
          author: 'Yuval Noah Harari',
          borrowDate: '2026-01-20',
          dueDate: '2026-02-20',
          status: 'active',
          daysLeft: 18,
          renewals: 1,
          maxRenewals: 2
        }
      ]);

      // Reading history
      setReadingHistory([
        {
          id: 'HIST001',
          bookId: 'BOOK003',
          title: 'The Theory of Everything',
          author: 'Stephen Hawking',
          completedDate: '2026-01-10',
          rating: 5,
          review: 'Absolutely fascinating!'
        },
        {
          id: 'HIST002',
          bookId: 'BOOK006',
          title: 'The Alchemist',
          author: 'Paulo Coelho',
          completedDate: '2025-12-20',
          rating: 5,
          review: 'Life-changing book'
        }
      ]);

      // AI Recommendations
      setRecommendations([
        {
          id: 'BOOK001',
          title: 'Introduction to Artificial Intelligence',
          reason: 'Based on your interest in Computer Science',
          matchScore: 95
        },
        {
          id: 'BOOK005',
          title: 'Advanced Mathematics for Engineers',
          reason: 'Complements your recent reading in Physics',
          matchScore: 88
        },
        {
          id: 'BOOK007',
          title: 'Principles of Marketing',
          reason: 'Trending in your category',
          matchScore: 82
        }
      ]);

      // Favorites
      setFavorites(['BOOK003', 'BOOK004', 'BOOK006']);

      // User stats
      setUserStats({
        booksRead: 24,
        currentlyReading: 2,
        pagesRead: 8432,
        favoriteGenre: 'Computer Science',
        readingStreak: 15,
        achievements: 8
      });

      // Reading goals
      setReadingGoals({
        monthlyTarget: 4,
        currentMonth: 2,
        yearlyTarget: 50,
        currentYear: 24,
        pagesTarget: 10000,
        currentPages: 8432
      });

      setLoading(false);
    }, 1000);
  };

  const handleReserveBook = async (book) => {
    setReservingBook(book);
    setShowReservationModal(true);
  };

  const confirmReservation = async () => {
    // Simulated reservation
    setTimeout(() => {
      alert(`Successfully reserved: ${reservingBook.title}`);
      setShowReservationModal(false);
      setReservingBook(null);
    }, 1000);
  };

  const handleRenewBook = async (borrowId) => {
    const updated = borrowedBooks.map(b => 
      b.id === borrowId && b.renewals < b.maxRenewals
        ? { ...b, renewals: b.renewals + 1, daysLeft: b.daysLeft + 30 }
        : b
    );
    setBorrowedBooks(updated);
    alert('Book renewed successfully! Due date extended by 30 days.');
  };

  const toggleFavorite = (bookId) => {
    setFavorites(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleReadOnline = (book) => {
    alert(`Opening digital reader for: ${book.title}`);
  };

  const handleDownload = (book) => {
    alert(`Downloading: ${book.title}`);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filters.category === 'all' || book.category === filters.category;
    const matchesAvailability = 
      filters.availability === 'all' || 
      (filters.availability === 'available' && book.availableCopies > 0) ||
      (filters.availability === 'unavailable' && book.availableCopies === 0);
    
    const matchesRating = 
      filters.rating === 'all' ||
      (filters.rating === '4+' && book.rating >= 4) ||
      (filters.rating === '4.5+' && book.rating >= 4.5);

    return matchesSearch && matchesCategory && matchesAvailability && matchesRating;
  });

  const categories = ['all', ...new Set(books.map(b => b.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LibraryIcon className="w-8 h-8 text-blue-600" />
            Digital Library
          </h1>
          <p className="text-gray-600 mt-1">Explore, borrow, and read from our extensive collection</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 opacity-80" />
              <Sparkles className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold">{userStats.booksRead}</p>
            <p className="text-xs opacity-90">Books Read</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{userStats.currentlyReading}</p>
            <p className="text-xs opacity-90">Currently Reading</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Book className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{userStats.pagesRead.toLocaleString()}</p>
            <p className="text-xs opacity-90">Pages Read</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{userStats.readingStreak}</p>
            <p className="text-xs opacity-90">Day Streak</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{favorites.length}</p>
            <p className="text-xs opacity-90">Favorites</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{userStats.achievements}</p>
            <p className="text-xs opacity-90">Achievements</p>
          </div>
        </div>

        {/* Reading Goals */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Reading Goals
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">Edit Goals</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Monthly Goal</span>
                <span className="font-semibold text-gray-900">
                  {readingGoals.currentMonth}/{readingGoals.monthlyTarget} books
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(readingGoals.currentMonth / readingGoals.monthlyTarget) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Yearly Goal</span>
                <span className="font-semibold text-gray-900">
                  {readingGoals.currentYear}/{readingGoals.yearlyTarget} books
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(readingGoals.currentYear / readingGoals.yearlyTarget) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Pages Goal</span>
                <span className="font-semibold text-gray-900">
                  {readingGoals.currentPages.toLocaleString()}/{readingGoals.pagesTarget.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(readingGoals.currentPages / readingGoals.pagesTarget) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {['browse', 'borrowed', 'recommendations', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'borrowed' && borrowedBooks.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                      {borrowedBooks.length}
                    </span>
                  )}
                  {tab === 'recommendations' && recommendations.length > 0 && (
                    <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">
                      {recommendations.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.availability}
                    onChange={(e) => setFilters({...filters, availability: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Books</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>

                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters({...filters, rating: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Ratings</option>
                    <option value="4+">4+ Stars</option>
                    <option value="4.5+">4.5+ Stars</option>
                  </select>

                  <div className="flex gap-2 border-l border-gray-300 pl-3">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Books Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredBooks.map((book) => (
                <div 
                  key={book.id} 
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-all ${
                    viewMode === 'list' ? 'flex gap-4 p-4' : 'overflow-hidden'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative">
                        <img 
                          src={book.cover} 
                          alt={book.title}
                          className="w-full h-64 object-cover"
                        />
                        {book.trending && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Trending
                          </div>
                        )}
                        <button
                          onClick={() => toggleFavorite(book.id)}
                          className={`absolute top-2 left-2 p-2 rounded-full ${
                            favorites.includes(book.id) 
                              ? 'bg-red-500 text-white' 
                              : 'bg-white text-gray-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(book.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{book.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">({book.reviews} reviews)</span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-blue-600">{book.category}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            book.availableCopies > 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Unavailable'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {book.availableCopies > 0 ? (
                            <button
                              onClick={() => handleReserveBook(book)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1"
                            >
                              <Bookmark className="w-4 h-4" />
                              Reserve
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex-1 bg-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Unavailable
                            </button>
                          )}
                          {book.format.includes('Digital') && (
                            <button
                              onClick={() => handleReadOnline(book)}
                              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              title="Read Online"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <img 
                        src={book.cover} 
                        alt={book.title}
                        className="w-32 h-48 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">{book.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                          </div>
                          <button
                            onClick={() => toggleFavorite(book.id)}
                            className={`p-2 rounded-full ${
                              favorites.includes(book.id) 
                                ? 'text-red-500' 
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${favorites.includes(book.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{book.description}</p>

                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{book.rating}</span>
                            <span className="text-xs text-gray-500">({book.reviews})</span>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{book.category}</span>
                          <span className="text-xs text-gray-600">{book.pages} pages</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            book.availableCopies > 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {book.availableCopies > 0 ? `${book.availableCopies}/${book.totalCopies} available` : 'Unavailable'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {book.availableCopies > 0 && (
                            <button
                              onClick={() => handleReserveBook(book)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Bookmark className="w-4 h-4" />
                              Reserve Book
                            </button>
                          )}
                          {book.format.includes('Digital') && (
                            <>
                              <button
                                onClick={() => handleReadOnline(book)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Read Online
                              </button>
                              <button
                                onClick={() => handleDownload(book)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}

        {/* Borrowed Books Tab */}
        {activeTab === 'borrowed' && (
          <div className="space-y-4">
            {borrowedBooks.map((borrow) => (
              <div key={borrow.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{borrow.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{borrow.author}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600">Borrowed On</p>
                        <p className="text-sm font-medium text-gray-900">{borrow.borrowDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Due Date</p>
                        <p className={`text-sm font-medium ${
                          borrow.daysLeft < 7 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {borrow.dueDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Days Left</p>
                        <p className={`text-sm font-bold ${
                          borrow.daysLeft < 7 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {borrow.daysLeft} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Renewals</p>
                        <p className="text-sm font-medium text-gray-900">
                          {borrow.renewals}/{borrow.maxRenewals}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {borrow.renewals < borrow.maxRenewals && (
                        <button
                          onClick={() => handleRenewBook(borrow.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Renew Book
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Return Request
                      </button>
                    </div>
                  </div>

                  {borrow.daysLeft < 7 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 ml-4">
                      <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
                      <p className="text-xs text-red-700 font-medium">Due Soon!</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {borrowedBooks.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowed books</h3>
                <p className="text-gray-600">Browse the library to borrow books</p>
              </div>
            )}
          </div>
        )}

        {/* AI Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow p-6 mb-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-xl font-bold">AI-Powered Recommendations</h2>
              </div>
              <p className="text-sm opacity-90">
                Based on your reading history, preferences, and trending books
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec) => {
                const book = books.find(b => b.id === rec.id);
                if (!book) return null;

                return (
                  <div key={rec.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="relative">
                      <img src={book.cover} alt={book.title} className="w-full h-64 object-cover" />
                      <div className="absolute top-2 right-2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {rec.matchScore}% Match
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-purple-900">{rec.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{book.rating}</span>
                        <span className="text-xs text-gray-500">({book.reviews})</span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('browse');
                          setSearchQuery(book.title);
                        }}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                      >
                        View Book
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reading History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {readingHistory.map((history) => (
              <div key={history.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{history.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{history.author}</p>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Completed: {history.completedDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={`w-4 h-4 ${
                              i < history.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {history.review && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700 italic">"{history.review}"</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        Read Again
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share Review
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {readingHistory.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reading history</h3>
                <p className="text-gray-600">Your completed books will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Reservation Modal */}
        {showReservationModal && reservingBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reserve Book</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">{reservingBook.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{reservingBook.author}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available Copies:</span>
                  <span className="font-semibold text-green-600">{reservingBook.availableCopies}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Borrowing Terms:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Borrow period: 30 days</li>
                      <li>• Maximum renewals: 2</li>
                      <li>• Late fee: ₹10/day</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReservationModal(false);
                    setReservingBook(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReservation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm Reservation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;