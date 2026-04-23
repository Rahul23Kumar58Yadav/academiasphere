import React, { useState, useEffect } from 'react';
import {
  Award,
  Download,
  Share2,
  Eye,
  Shield,
  CheckCircle,
  Calendar,
  ExternalLink,
  Copy,
  Filter,
  Search,
  FileText,
  Medal,
  Trophy
} from 'lucide-react';

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    // Simulated API call
    setTimeout(() => {
      setCertificates([
        {
          id: 'CERT001',
          type: 'Academic Certificate',
          title: 'Class 12 Pass Certificate',
          issuedDate: '2025-06-15',
          academicYear: '2024-2025',
          grade: 'A+',
          percentage: 92.5,
          status: 'verified',
          blockchainHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
          issuer: 'Delhi Public School',
          verificationUrl: 'https://blockchain.edu/verify/CERT001'
        },
        {
          id: 'CERT002',
          type: 'Achievement',
          title: 'Science Olympiad - Gold Medal',
          issuedDate: '2025-03-20',
          academicYear: '2024-2025',
          achievement: 'First Position - National Level',
          status: 'verified',
          blockchainHash: '0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
          issuer: 'National Science Foundation',
          verificationUrl: 'https://blockchain.edu/verify/CERT002'
        },
        {
          id: 'CERT003',
          type: 'Participation',
          title: 'Inter-School Sports Meet 2025',
          issuedDate: '2025-02-10',
          academicYear: '2024-2025',
          event: 'Athletics - 100m Sprint',
          status: 'verified',
          blockchainHash: '0xb1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0',
          issuer: 'Delhi Sports Authority',
          verificationUrl: 'https://blockchain.edu/verify/CERT003'
        },
        {
          id: 'CERT004',
          type: 'Academic Certificate',
          title: 'Class 11 Pass Certificate',
          issuedDate: '2024-06-15',
          academicYear: '2023-2024',
          grade: 'A',
          percentage: 88.3,
          status: 'verified',
          blockchainHash: '0xc1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0',
          issuer: 'Delhi Public School',
          verificationUrl: 'https://blockchain.edu/verify/CERT004'
        },
        {
          id: 'CERT005',
          type: 'Achievement',
          title: 'Best Student of the Year',
          issuedDate: '2025-07-01',
          academicYear: '2024-2025',
          achievement: 'Overall Excellence',
          status: 'pending',
          blockchainHash: null,
          issuer: 'Delhi Public School',
          verificationUrl: null
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleVerify = async (certificate) => {
    setVerifying(true);
    setSelectedCertificate(certificate);
    setShowVerification(true);
    
    // Simulated blockchain verification
    setTimeout(() => {
      setVerifying(false);
    }, 1500);
  };

  const handleDownload = (certificate) => {
    // Simulated download
    alert(`Downloading certificate: ${certificate.title}`);
  };

  const handleShare = (certificate) => {
    // Simulated share
    const shareUrl = certificate.verificationUrl || `https://certificates.edu/${certificate.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Certificate verification link copied to clipboard!');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getCertificateIcon = (type) => {
    const icons = {
      'Academic Certificate': <FileText className="w-6 h-6" />,
      'Achievement': <Trophy className="w-6 h-6" />,
      'Participation': <Medal className="w-6 h-6" />
    };
    return icons[type] || <Award className="w-6 h-6" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <Shield className="w-3 h-3" />
          Blockchain Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Calendar className="w-3 h-3" />
        Pending Verification
      </span>
    );
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesType = filterType === 'all' || cert.type === filterType;
    const matchesSearch = cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-600 mt-1">View and verify your blockchain-secured certificates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{certificates.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {certificates.filter(c => c.status === 'verified').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {certificates.filter(c => c.type === 'Achievement').length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Academic</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {certificates.filter(c => c.type === 'Academic Certificate').length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
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
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="Academic Certificate">Academic</option>
                <option value="Achievement">Achievement</option>
                <option value="Participation">Participation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Certificate Icon & Type */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    cert.type === 'Academic Certificate' ? 'bg-purple-100' :
                    cert.type === 'Achievement' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    {getCertificateIcon(cert.type)}
                  </div>
                  {getStatusBadge(cert.status)}
                </div>

                {/* Certificate Details */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cert.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{cert.issuer}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Certificate ID:</span>
                    <span className="font-medium text-gray-900">{cert.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Issued Date:</span>
                    <span className="font-medium text-gray-900">{cert.issuedDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium text-gray-900">{cert.academicYear}</span>
                  </div>
                  {cert.grade && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Grade:</span>
                      <span className="font-bold text-green-600">{cert.grade} ({cert.percentage}%)</span>
                    </div>
                  )}
                  {cert.achievement && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Achievement:</span>
                      <span className="font-medium text-orange-600">{cert.achievement}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleVerify(cert)}
                    disabled={cert.status !== 'verified'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shield className="w-4 h-4" />
                    Verify
                  </button>
                  <button
                    onClick={() => handleDownload(cert)}
                    className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleShare(cert)}
                    disabled={!cert.verificationUrl}
                    className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCertificates.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Verification Modal */}
        {showVerification && selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              {verifying ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Verifying on blockchain...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Certificate Verification</h3>
                    <button
                      onClick={() => setShowVerification(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Certificate Verified</p>
                        <p className="text-sm text-green-700">This certificate is authentic and recorded on blockchain</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Certificate Title</p>
                        <p className="font-medium text-gray-900">{selectedCertificate.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Certificate ID</p>
                        <p className="font-medium text-gray-900">{selectedCertificate.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Issued By</p>
                        <p className="font-medium text-gray-900">{selectedCertificate.issuer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Issue Date</p>
                        <p className="font-medium text-gray-900">{selectedCertificate.issuedDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Details */}
                  {selectedCertificate.blockchainHash && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Blockchain Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Transaction Hash</p>
                          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                            <code className="text-xs text-gray-900 flex-1 overflow-x-auto">
                              {selectedCertificate.blockchainHash}
                            </code>
                            <button
                              onClick={() => copyToClipboard(selectedCertificate.blockchainHash)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Verification URL</p>
                          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                            <code className="text-xs text-blue-600 flex-1 overflow-x-auto">
                              {selectedCertificate.verificationUrl}
                            </code>
                            <button
                              onClick={() => window.open(selectedCertificate.verificationUrl, '_blank')}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownload(selectedCertificate)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Certificate
                    </button>
                    <button
                      onClick={() => handleShare(selectedCertificate)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Verification Link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCertificates;