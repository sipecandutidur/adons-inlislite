import { useState, useEffect } from 'react';
import { Search, Package, Clock, AlertTriangle, TrendingUp, FileSpreadsheet, X, Calendar, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/api.config';

interface ScannedItem {
  id: number;
  barcode: string;
  title: string;
  author: string;
  callNumber: string;
  year: string;
  typeProcurement: string;
  source: string;
  location: string;
  statusBuku: string;
  hasWarning: boolean;
  warningTypes: string[];
  forcedAdd: boolean;
  scannedAt: string;
  sessionId: number;
  picName: string;
  sessionStatus: string;
}

interface Statistics {
  totalItems: number;
  itemsToday: number;
  activeSessions: number;
  itemsWithWarnings: number;
}

const Home = () => {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalItems: 0,
    itemsToday: 0,
    activeSessions: 0,
    itemsWithWarnings: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 50;

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stock-opname/statistics`);
      const result = await response.json();
      
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch scanned items
  const fetchScannedItems = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/stock-opname/items?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setScannedItems(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching scanned items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchScannedItems(1, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchStatistics();
    fetchScannedItems();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatistics();
      fetchScannedItems(currentPage, searchQuery);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Export to Excel
  const exportToExcel = () => {
    const worksheetData = [
      ['LAPORAN SCAN HISTORY - STOCK OPNAME'],
      [''],
      ['Tanggal Export', new Date().toLocaleString('id-ID')],
      ['Total Item', totalItems],
      [''],
      ['DAFTAR ITEM YANG DIPINDAI'],
      ['No', 'Barcode', 'Judul', 'Pengarang', 'Call Number', 'Tahun', 'Lokasi', 'Status Buku', 'PIC', 'Session ID', 'Warning', 'Waktu Scan']
    ];

    scannedItems.forEach((item, index) => {
      worksheetData.push([
        (currentPage - 1) * itemsPerPage + index + 1,
        item.barcode,
        item.title,
        item.author,
        item.callNumber,
        item.year,
        item.location,
        item.statusBuku,
        item.picName,
        item.sessionId,
        item.hasWarning ? item.warningTypes.join(', ') : 'Tidak ada',
        new Date(item.scannedAt).toLocaleString('id-ID')
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 15 },
      { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
      { wch: 20 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Scan History');
    
    const fileName = `Scan_History_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const statsCards = [
    {
      title: 'Total Scanned Items',
      value: statistics.totalItems.toLocaleString(),
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Items Scanned Today',
      value: statistics.itemsToday.toLocaleString(),
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Active Sessions',
      value: statistics.activeSessions.toLocaleString(),
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'Items with Warnings',
      value: statistics.itemsWithWarnings.toLocaleString(),
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Real-time Stock Opname Scan History</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-slate-300 text-sm mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search and Export Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan barcode, judul, atau nama PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <button
              onClick={exportToExcel}
              disabled={scannedItems.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Scanned Items Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Scan History</h2>
            <p className="text-slate-400 text-sm mt-1">
              Showing {scannedItems.length} of {totalItems} items
              {searchQuery && ` (filtered by "${searchQuery}")`}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-slate-400 mt-4">Loading scan history...</p>
            </div>
          ) : scannedItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {searchQuery ? 'No items found matching your search' : 'No scanned items yet'}
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Call Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">PIC</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Session</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Scanned At</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {scannedItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 text-blue-400 font-mono text-sm">{item.barcode}</td>
                        <td className="px-4 py-3 text-white max-w-xs truncate">{item.title}</td>
                        <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{item.callNumber}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{item.location}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-white text-sm">{item.picName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">
                            #{item.sessionId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {new Date(item.scannedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {item.hasWarning ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 text-xs">Warning</span>
                            </div>
                          ) : (
                            <span className="text-green-400 text-xs">✓ OK</span>
                          )}
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
                      onClick={() => fetchScannedItems(currentPage - 1, searchQuery)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
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
                            onClick={() => fetchScannedItems(pageNum, searchQuery)}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => fetchScannedItems(currentPage + 1, searchQuery)}
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
    </div>
  );
};

export default Home;
