import { useState, useEffect } from 'react';
import { Search, Package, Clock, AlertTriangle, TrendingUp, FileSpreadsheet, X, Calendar, User, ChevronDown, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/api.config';
import { socket } from '../config/socket.config';

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

interface LocationStat {
  locationId: number;
  locationName: string;
  total: number;
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
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [isLoadingLocationStats, setIsLoadingLocationStats] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const limitOptions = [10, 20, 50, 100];

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

  // Fetch location stats
  const fetchLocationStats = async () => {
    try {
      setIsLoadingLocationStats(true);
      const response = await fetch(`${API_BASE_URL}/stock-opname/location-stats`);
      const result = await response.json();

      if (result.success) {
        setLocationStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching location stats:', error);
    } finally {
      setIsLoadingLocationStats(false);
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

  // Refetch when itemsPerPage changes
  useEffect(() => {
    fetchScannedItems(1, searchQuery);
  }, [itemsPerPage]);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
    fetchLocationStats();
    fetchScannedItems(1, '');
  }, []);

  // Setup Socket.IO listener for real-time updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchStatistics();
      fetchLocationStats();
      fetchScannedItems(currentPage, searchQuery);
    };

    socket.on('STOCK_OPNAME_UPDATED', handleUpdate);

    return () => {
      socket.off('STOCK_OPNAME_UPDATED', handleUpdate);
    };
  }, [currentPage, searchQuery]);

  const [isExporting, setIsExporting] = useState(false);

  // Export to Excel - fetches ALL data from API
  const exportToExcel = async () => {
    try {
      setIsExporting(true);

      // Fetch all items from dedicated export API (no pagination)
      const url = `${API_BASE_URL}/stock-opname/items/export?search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        alert('Tidak ada data untuk di-export');
        return;
      }

      const allItems: ScannedItem[] = result.data;

      const worksheetData: any[][] = [
        ['LAPORAN SCAN HISTORY - STOCK OPNAME'],
        [''],
        ['Tanggal Export', new Date().toLocaleString('id-ID')],
        ['Total Item', allItems.length],
        ...(searchQuery ? [['Filter', searchQuery]] : []),
        [''],
        ['DAFTAR ITEM YANG DIPINDAI'],
        ['No', 'Barcode', 'Judul', 'Pengarang', 'Call Number', 'Tahun', 'Jenis Pengadaan', 'Sumber', 'Lokasi', 'Status Buku', 'PIC', 'Session ID', 'Warning', 'Waktu Scan']
      ];

      allItems.forEach((item, index) => {
        worksheetData.push([
          index + 1,
          item.barcode,
          item.title,
          item.author,
          item.callNumber,
          item.year,
          item.typeProcurement || '-',
          item.source || '-',
          item.location,
          item.statusBuku,
          item.picName,
          item.sessionId,
          item.hasWarning ? (item.warningTypes || []).join(', ') : 'Tidak ada',
          new Date(item.scannedAt).toLocaleString('id-ID')
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 15 },
        { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
        { wch: 20 }, { wch: 10 }, { wch: 25 }, { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Scan History');

      const fileName = `Scan_History_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Gagal export data. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
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
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
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

        {/* Location Distribution Cards */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Distribusi Koleksi Berdasarkan Lokasi</h2>
              <p className="text-slate-400 text-sm">Jumlah buku hasil scan dari session aktif</p>
            </div>
          </div>

          {isLoadingLocationStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : locationStats.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/30 border border-slate-700 rounded-xl">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Belum ada data lokasi</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {locationStats.map((loc, index) => {
                const gradients = [
                  { bg: 'from-blue-500/15 to-cyan-500/15', border: 'border-blue-500/25', icon: 'from-blue-500 to-cyan-500', text: 'text-blue-400', glow: 'hover:shadow-blue-500/20' },
                  { bg: 'from-violet-500/15 to-purple-500/15', border: 'border-violet-500/25', icon: 'from-violet-500 to-purple-500', text: 'text-violet-400', glow: 'hover:shadow-violet-500/20' },
                  { bg: 'from-emerald-500/15 to-teal-500/15', border: 'border-emerald-500/25', icon: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', glow: 'hover:shadow-emerald-500/20' },
                  { bg: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/25', icon: 'from-amber-500 to-orange-500', text: 'text-amber-400', glow: 'hover:shadow-amber-500/20' },
                  { bg: 'from-rose-500/15 to-pink-500/15', border: 'border-rose-500/25', icon: 'from-rose-500 to-pink-500', text: 'text-rose-400', glow: 'hover:shadow-rose-500/20' },
                  { bg: 'from-sky-500/15 to-indigo-500/15', border: 'border-sky-500/25', icon: 'from-sky-500 to-indigo-500', text: 'text-sky-400', glow: 'hover:shadow-sky-500/20' },
                  { bg: 'from-lime-500/15 to-green-500/15', border: 'border-lime-500/25', icon: 'from-lime-500 to-green-500', text: 'text-lime-400', glow: 'hover:shadow-lime-500/20' },
                  { bg: 'from-fuchsia-500/15 to-purple-500/15', border: 'border-fuchsia-500/25', icon: 'from-fuchsia-500 to-purple-500', text: 'text-fuchsia-400', glow: 'hover:shadow-fuchsia-500/20' },
                ];
                const style = gradients[index % gradients.length];

                return (
                  <div
                    key={loc.locationId}
                    className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-5 hover:scale-[1.03] transition-all duration-300 hover:shadow-lg ${style.glow} group cursor-default`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${style.icon} shadow-lg`}>
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm font-medium mb-1 leading-tight truncate" title={loc.locationName}>
                      {loc.locationName}
                    </p>
                    <p className={`text-2xl font-bold ${style.text}`}>
                      {loc.total.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">eksemplar</p>
                  </div>
                );
              })}
            </div>
          )}
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
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
              >
                {limitOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} / page
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
            <button
              onClick={exportToExcel}
              disabled={scannedItems.length === 0 || isExporting}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5" />
                  Export All to Excel
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scanned Items Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Scan History</h2>
            <p className="text-slate-400 text-sm mt-1">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
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
              <div className="p-6 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-slate-400 text-sm">
                  Page {currentPage} of {totalPages} &middot; {totalItems} total items
                </div>
                <div className="flex items-center gap-2">
                  {/* First page */}
                  <button
                    onClick={() => fetchScannedItems(1, searchQuery)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First Page"
                  >
                    «
                  </button>
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
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
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
                  {/* Last page */}
                  <button
                    onClick={() => fetchScannedItems(totalPages, searchQuery)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last Page"
                  >
                    »
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
