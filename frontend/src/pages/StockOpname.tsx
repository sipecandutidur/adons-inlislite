import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ScanLine, CheckCircle, Clock, AlertTriangle, X, FileSpreadsheet, Calendar, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiService } from '../services/api.service';
import { API_BASE_URL } from '../config/api.config';

interface Session {
  id: number;
  picName: string;
  rooms: string[];
  classNumbers: string[];
  statusBuku: string[];
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  totalItems: number;
}

interface SessionItem {
  id: number;
  sessionId: number;
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
}

interface SessionDetail extends Session {
  items: SessionItem[];
}

const getReadableWarning = (type: string) => {
  const map: Record<string, string> = {
    'roomMismatch': 'Salah Ruangan',
    'classMismatch': 'Salah Kelas',
    'statusMismatch': 'Salah Status'
  };
  return map[type] || type;
};

const StockOpname = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    totalItems: 0,
    itemsWithWarnings: 0
  });

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      // Temporary: Use direct fetch until we add getAllSessions to apiService
      const response = await fetch(`${API_BASE_URL}/stock-opname/sessions?limit=100`);
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data as Session[]);
        calculateStats(result.data as Session[]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (sessionsData: Session[]) => {
    const totalSessions = sessionsData.length;
    const activeSessions = sessionsData.filter(s => s.status === 'active').length;
    const completedSessions = sessionsData.filter(s => s.status === 'completed').length;
    const totalItems = sessionsData.reduce((sum, s) => sum + s.totalItems, 0);
    
    setStats({
      totalSessions,
      activeSessions,
      completedSessions,
      totalItems,
      itemsWithWarnings: 0
    });
  };

  // Fetch session details
  const fetchSessionDetails = async (sessionId: number) => {
    try {
      const result = await apiService.stockOpname.getSession(sessionId);
      
      if (result.success) {
        setSelectedSession(result.data as SessionDetail);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  // Complete session
  const completeSession = async (sessionId: number) => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan sesi ini?')) {
      return;
    }

    try {
      // Note: This endpoint needs to be added to apiService
      const response = await fetch(`${API_BASE_URL}/stock-opname/sessions/${sessionId}/complete`, {
        method: 'PATCH'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Sesi berhasil diselesaikan!');
        fetchSessions();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Gagal menyelesaikan sesi');
    }
  };

  // Export to Excel
  const exportToExcel = (session: SessionDetail) => {
    const worksheetData = [
      ['LAPORAN STOCK OPNAME'],
      [''],
      ['PIC', session.picName],
      ['Tanggal', new Date(session.createdAt).toLocaleString('id-ID')],
      ['Status', session.status === 'completed' ? 'Selesai' : 'Aktif'],
      ['Total Item', session.totalItems],
      [''],
      ['Ruang Buku', session.rooms.join(', ')],
      ['Nomor Class', session.classNumbers.join(', ')],
      ['Status Buku', session.statusBuku.join(', ')],
      [''],
      ['DAFTAR BUKU YANG DIPINDAI'],
      ['No', 'Barcode', 'Judul', 'Pengarang', 'Call Number', 'Tahun', 'Lokasi', 'Status', 'Warning', 'Waktu Scan']
    ];

    session.items.forEach((item, index) => {
      worksheetData.push([
        index + 1,
        item.barcode,
        item.title,
        item.author,
        item.callNumber,
        item.year,
        item.location,
        item.statusBuku,
        item.hasWarning ? item.warningTypes.map(getReadableWarning).join(', ') : 'Tidak ada',
        new Date(item.scannedAt).toLocaleString('id-ID')
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 15 },
      { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Stock Opname');
    
    const fileName = `Stock_Opname_${session.picName}_${new Date(session.createdAt).toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(session =>
    session.picName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Stock Opname History</h1>
          </div>
          <p className="text-slate-400">Riwayat sesi stock opname dan statistik</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-white">{stats.totalSessions}</span>
            </div>
            <p className="text-slate-300 text-sm font-semibold">Total Sesi</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white">{stats.activeSessions}</span>
            </div>
            <p className="text-slate-300 text-sm font-semibold">Sesi Aktif</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-bold text-white">{stats.completedSessions}</span>
            </div>
            <p className="text-slate-300 text-sm font-semibold">Sesi Selesai</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-400" />
              <span className="text-3xl font-bold text-white">{stats.totalItems}</span>
            </div>
            <p className="text-slate-300 text-sm font-semibold">Total Item</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold text-white">{stats.itemsWithWarnings}</span>
            </div>
            <p className="text-slate-300 text-sm font-semibold">Item Warning</p>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => navigate('/stock-opname/scan')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-2"
            >
              <ScanLine className="w-5 h-5" />
              Scan Baru
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Belum ada sesi stock opname</p>
            <button
              onClick={() => navigate('/stock-opname/scan')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              Mulai Sesi Baru
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      PIC
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Ruang Buku
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Total Item
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-700/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {session.picName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{session.picName}</p>
                            <p className="text-slate-400 text-xs">Session #{session.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-white text-sm">
                              {new Date(session.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {new Date(session.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {session.rooms.slice(0, 2).map((room, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-300"
                            >
                              {room}
                            </span>
                          ))}
                          {session.rooms.length > 2 && (
                            <span className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-300">
                              +{session.rooms.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-white font-semibold">{session.totalItems}</span>
                          <span className="text-slate-400 text-sm">buku</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            session.status === 'completed'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          }`}
                        >
                          {session.status === 'completed' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Selesai
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Aktif
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchSessionDetails(session.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
                          >
                            Detail
                          </button>
                          {session.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/stock-opname/scan', { state: { sessionId: session.id } });
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded text-white text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <ScanLine className="w-4 h-4" />
                              Lanjutkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSession && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Detail Sesi Stock Opname</h2>
                  <p className="text-slate-400">PIC: {selectedSession.picName}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Tanggal</p>
                    <p className="text-white font-semibold">
                      {new Date(selectedSession.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Total Item</p>
                    <p className="text-white font-semibold">{selectedSession.totalItems} buku</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedSession.status === 'completed'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      }`}
                    >
                      {selectedSession.status === 'completed' ? 'Selesai' : 'Aktif'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                  <h3 className="text-white font-semibold mb-3">Profil PIC</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Ruang Buku</p>
                      <p className="text-white">{selectedSession.rooms.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Nomor Class</p>
                      <p className="text-white">{selectedSession.classNumbers.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Status Buku</p>
                      <p className="text-white">{selectedSession.statusBuku.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-slate-600">
                    <h3 className="text-white font-semibold">Daftar Buku yang Dipindai</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">No</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Barcode</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Judul</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Call Number</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Lokasi</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Warning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {selectedSession.items.map((item, index) => (
                          <tr key={item.id} className={`${item.hasWarning ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'hover:bg-slate-700/30'} transition-colors`}>
                            <td className="px-4 py-3 text-slate-300">{index + 1}</td>
                            <td className="px-4 py-3 text-purple-400 font-mono text-sm">{item.barcode}</td>
                            <td className="px-4 py-3 text-white">{item.title}</td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{item.callNumber}</td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{item.location}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-xs">
                                {item.statusBuku}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {item.hasWarning ? (
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                  <span className="text-yellow-400 text-xs font-medium">
                                    {item.warningTypes.map(getReadableWarning).join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-700 flex gap-3">
                <button
                  onClick={() => exportToExcel(selectedSession)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Export ke Excel
                </button>
                {selectedSession.status === 'active' && (
                  <button
                    onClick={() => completeSession(selectedSession.id)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Selesaikan Sesi
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all duration-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockOpname;
