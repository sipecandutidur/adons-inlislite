import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet, X, Wrench, BookX, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/api.config';

interface BrokenBook {
  id: number;
  barcode: string;
  title: string;
  author: string;
  callNumber: string;
  location: string;
  damageType: string;
  damageDescription: string;
  reportedBy: string;
  actionTaken: string;
  actionNotes: string;
  notes: string;
  reportedAt: string;
  updatedAt: string;
  typeProcurement?: string;
  source?: string;
}

interface Statistics {
  totalBooks: number;
  pending: number;
  underRepair: number;
  repaired: number;
  discarded: number;
}

const BrokenBook = () => {
  const navigate = useNavigate();
  const [brokenBooks, setBrokenBooks] = useState<BrokenBook[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalBooks: 0,
    pending: 0,
    underRepair: 0,
    repaired: 0,
    discarded: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [damageTypeFilter, setDamageTypeFilter] = useState('');
  const [actionStatusFilter, setActionStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBook, setSelectedBook] = useState<BrokenBook | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [damageHistory, setDamageHistory] = useState<any[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [actionForm, setActionForm] = useState({
    actionTaken: '',
    actionNotes: ''
  });
  const itemsPerPage = 50;

  const damageTypes = [
    { value: '', label: 'Semua Jenis Kerusakan' },
    { value: 'torn_pages', label: 'Halaman Robek' },
    { value: 'water_damage', label: 'Terkena Air' },
    { value: 'missing_pages', label: 'Halaman Hilang' },
    { value: 'cover_damage', label: 'Cover Rusak' },
    { value: 'binding_damage', label: 'Jilid Rusak' },
    { value: 'other', label: 'Lainnya' }
  ];

  const actionStatuses = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'under_repair', label: 'Dalam Perbaikan' },
    { value: 'repaired', label: 'Sudah Diperbaiki' },
    { value: 'discarded', label: 'Dibuang' }
  ];

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/broken-books/statistics`);
      const result = await response.json();
      
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch broken books
  const fetchBrokenBooks = async (page = 1, search = '', damageType = '', actionStatus = '') => {
    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/broken-books?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}&damageType=${damageType}&actionStatus=${actionStatus}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setBrokenBooks(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching broken books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrokenBooks(1, searchQuery, damageTypeFilter, actionStatusFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, damageTypeFilter, actionStatusFilter]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchStatistics();
    fetchBrokenBooks();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatistics();
      fetchBrokenBooks(currentPage, searchQuery, damageTypeFilter, actionStatusFilter);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update action
  const handleUpdateAction = async () => {
    if (!selectedBook || !actionForm.actionTaken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/broken-books/${selectedBook.id}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionForm)
      });

      const result = await response.json();

      if (result.success) {
        // Silently close modal and refresh data
        setShowActionModal(false);
        setSelectedBook(null);
        setActionForm({ actionTaken: '', actionNotes: '' });
        fetchStatistics();
        fetchBrokenBooks(currentPage, searchQuery, damageTypeFilter, actionStatusFilter);
      } else {
        alert('Failed to update action: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating action:', error);
      alert('Failed to update action');
    }
  };

  // Fetch damage history for a barcode
  const fetchHistory = async (barcode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/broken-books/history/${barcode}`);
      const result = await response.json();
      
      if (result.success) {
        setDamageHistory(result.data);
        setHistoryCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheetData = [
      ['LAPORAN BUKU RUSAK'],
      [''],
      ['Tanggal Export', new Date().toLocaleString('id-ID')],
      ['Total Buku Rusak', totalItems],
      [''],
      ['DAFTAR BUKU RUSAK'],
      ['No', 'Barcode', 'Judul', 'Pengarang', 'Call Number', 'Lokasi', 'Jenis Pengadaan', 'Sumber', 'Jenis Kerusakan', 'Deskripsi', 'Pelapor', 'Status Aksi', 'Catatan Aksi', 'Notes', 'Tanggal Lapor']
    ];

    brokenBooks.forEach((book, index) => {
      worksheetData.push([
        (currentPage - 1) * itemsPerPage + index + 1,
        book.barcode,
        book.title,
        book.author,
        book.callNumber,
        book.location,
        book.typeProcurement || '-',
        book.source || '-',
        getDamageTypeLabel(book.damageType),
        book.damageDescription,
        book.reportedBy,
        getActionStatusLabel(book.actionTaken),
        book.actionNotes || '-',
        book.notes || '-',
        new Date(book.reportedAt).toLocaleString('id-ID')
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 15 },
      { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 },
      { wch: 30 }, { wch: 30 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Buku Rusak');
    
    const fileName = `Buku_Rusak_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getDamageTypeLabel = (type: string) => {
    const found = damageTypes.find(d => d.value === type);
    return found ? found.label : type;
  };

  const getActionStatusLabel = (status: string) => {
    const found = actionStatuses.find(a => a.value === status);
    return found ? found.label : status;
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'under_repair':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'repaired':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'discarded':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const statsCards = [
    {
      title: 'Total Broken Books',
      value: statistics.totalBooks.toLocaleString(),
      icon: BookX,
      color: 'from-red-500 to-orange-500',
      bgColor: 'from-red-500/20 to-orange-500/20',
      borderColor: 'border-red-500/30'
    },
    {
      title: 'Pending',
      value: statistics.pending.toLocaleString(),
      icon: Clock,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'from-yellow-500/20 to-amber-500/20',
      borderColor: 'border-yellow-500/30'
    },
    {
      title: 'Under Repair',
      value: statistics.underRepair.toLocaleString(),
      icon: Wrench,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Repaired',
      value: statistics.repaired.toLocaleString(),
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Discarded',
      value: statistics.discarded.toLocaleString(),
      icon: XCircle,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'from-gray-500/20 to-slate-500/20',
      borderColor: 'border-gray-500/30'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Broken Books</h1>
          <p className="text-slate-400">Track and manage damaged book inventory</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} rounded-xl p-6 hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-slate-300 text-sm mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search, Filters, and Actions */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by barcode, title, or reporter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Damage Type Filter */}
            <select
              value={damageTypeFilter}
              onChange={(e) => setDamageTypeFilter(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              {damageTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* Action Status Filter */}
            <select
              value={actionStatusFilter}
              onChange={(e) => setActionStatusFilter(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              {actionStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            {/* Export Button */}
            <button
              onClick={exportToExcel}
              disabled={brokenBooks.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export
            </button>

            {/* Scan Button */}
            <button
              onClick={() => navigate('/broken-book-scanner')}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-white hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              Scan Broken Book
            </button>
          </div>
        </div>

        {/* Broken Books Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Broken Books List</h2>
            <p className="text-slate-400 text-sm mt-1">
              Showing {brokenBooks.length} of {totalItems} books
              {searchQuery && ` (filtered by "${searchQuery}")`}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <p className="text-slate-400 mt-4">Loading broken books...</p>
            </div>
          ) : brokenBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookX className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {searchQuery || damageTypeFilter || actionStatusFilter
                  ? 'No broken books found matching your filters'
                  : 'No broken books reported yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Barcode</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Damage Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Reporter</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Reported At</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {brokenBooks.map((book, index) => (
                      <tr key={book.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 text-blue-400 font-mono text-sm">{book.barcode}</td>
                        <td className="px-4 py-3 text-white max-w-xs truncate">
                          <div>{book.title}</div>
                          <div className="text-xs text-slate-500">{book.typeProcurement}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{book.source || '-'}</td>
                        <td className="px-4 py-3 text-orange-400 text-sm">{getDamageTypeLabel(book.damageType)}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{book.reportedBy}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getActionStatusColor(book.actionTaken)}`}>
                            {getActionStatusLabel(book.actionTaken)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {new Date(book.reportedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setSelectedBook(book);
                                await fetchHistory(book.barcode);
                                setShowDetailModal(true);
                              }}
                              className="px-3 py-1 bg-slate-600 hover:bg-slate-700 rounded text-white text-xs transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Detail
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBook(book);
                                setActionForm({
                                  actionTaken: book.actionTaken,
                                  actionNotes: book.actionNotes || ''
                                });
                                setShowActionModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition-colors flex items-center gap-1"
                            >
                              <Wrench className="w-3 h-3" />
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-slate-400 text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchBrokenBooks(currentPage - 1, searchQuery, damageTypeFilter, actionStatusFilter)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchBrokenBooks(pageNum, searchQuery, damageTypeFilter, actionStatusFilter)}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              currentPage === pageNum
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => fetchBrokenBooks(currentPage + 1, searchQuery, damageTypeFilter, actionStatusFilter)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* Detail Modal */}
      {showDetailModal && selectedBook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookX className="w-6 h-6 text-red-400" />
                Detail Buku Rusak
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBook(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Book Information */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Informasi Buku
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Barcode</p>
                    <p className="text-blue-400 font-mono font-semibold">{selectedBook.barcode}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Call Number</p>
                    <p className="text-cyan-400 font-mono">{selectedBook.callNumber || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-sm">Judul</p>
                    <p className="text-white font-semibold">{selectedBook.title}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Pengarang</p>
                    <p className="text-slate-200">{selectedBook.author || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Lokasi</p>
                    <p className="text-slate-200">{selectedBook.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Jenis Pengadaan</p>
                    <p className="text-slate-200">{selectedBook.typeProcurement || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Sumber</p>
                    <p className="text-slate-200">{selectedBook.source || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Damage Information */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Informasi Kerusakan
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-400 text-sm">Jenis Kerusakan</p>
                    <p className="text-orange-400 font-semibold">{getDamageTypeLabel(selectedBook.damageType)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Deskripsi Kerusakan</p>
                    <p className="text-slate-200">{selectedBook.damageDescription || '-'}</p>
                  </div>
                  {selectedBook.notes && (
                    <div>
                      <p className="text-slate-400 text-sm">Catatan Tambahan</p>
                      <p className="text-slate-200">{selectedBook.notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-slate-400 text-sm">Dilaporkan Oleh</p>
                      <p className="text-white font-semibold">{selectedBook.reportedBy}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Tanggal Lapor</p>
                      <p className="text-slate-200">
                        {new Date(selectedBook.reportedAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Status */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  Status Tindakan
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Status Saat Ini</p>
                    <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold border ${getActionStatusColor(selectedBook.actionTaken)}`}>
                      {getActionStatusLabel(selectedBook.actionTaken)}
                    </span>
                  </div>
                  {selectedBook.actionNotes && (
                    <div>
                      <p className="text-slate-400 text-sm">Catatan Tindakan</p>
                      <p className="text-slate-200">{selectedBook.actionNotes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400 text-sm">Terakhir Diupdate</p>
                    <p className="text-slate-200">
                      {new Date(selectedBook.updatedAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Damage History Timeline */}
              {historyCount > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    Riwayat Kerusakan ({historyCount})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {damageHistory.map((record) => (
                      <div key={record.id} className="relative pl-6 pb-3 border-l-2 border-purple-500/30 last:border-0">
                        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-800"></div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-white font-semibold text-sm">{getDamageTypeLabel(record.damageType)}</p>
                              <p className="text-slate-400 text-xs">
                                {new Date(record.reportedAt).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getActionStatusColor(record.actionTaken)}`}>
                              {getActionStatusLabel(record.actionTaken)}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mb-1">{record.damageDescription}</p>
                          <div className="flex items-center justify-between text-xs">
                            <p className="text-slate-400">Pelapor: <span className="text-slate-300">{record.reportedBy}</span></p>
                            {record.resolvedAt && (
                              <p className="text-green-400">
                                ✓ Selesai: {new Date(record.resolvedAt).toLocaleDateString('id-ID')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBook(null);
                }}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Update Modal */}
      {showActionModal && selectedBook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Update Action Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Book: <span className="text-blue-400">{selectedBook.title}</span>
                </label>
                <div className="text-xs text-slate-400 flex gap-4">
                  <span>Procurement: <span className="text-slate-300">{selectedBook.typeProcurement || '-'}</span></span>
                  <span>Source: <span className="text-slate-300">{selectedBook.source || '-'}</span></span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Action Status <span className="text-red-400">*</span>
                </label>
                <select
                  value={actionForm.actionTaken}
                  onChange={(e) => setActionForm({...actionForm, actionTaken: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="pending">Pending</option>
                  <option value="under_repair">Under Repair</option>
                  <option value="repaired">Repaired</option>
                  <option value="discarded">Discarded</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Action Notes
                </label>
                <textarea
                  value={actionForm.actionNotes}
                  onChange={(e) => setActionForm({...actionForm, actionNotes: e.target.value})}
                  placeholder="Add notes about the action taken..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedBook(null);
                  setActionForm({ actionTaken: '', actionNotes: '' });
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAction}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-white hover:shadow-lg hover:shadow-red-500/50 transition-all"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokenBook;
