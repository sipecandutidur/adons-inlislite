import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Barcode, BookX, AlertTriangle, CheckCircle, User, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api.service';

interface ScanHistoryItem {
  id: number;
  barcode: string;
  title: string;
  damageType: string;
  timestamp: string;
  status: 'success' | 'error';
  typeProcurement?: string;
  source?: string;
}

const BrokenBookScanner = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [reporterName, setReporterName] = useState('');
  const [isReporterSet, setIsReporterSet] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDamageType, setSelectedDamageType] = useState('');
  const [showCustomDescriptionModal, setShowCustomDescriptionModal] = useState(false);
  const [customDescription, setCustomDescription] = useState('');

  const damageTypes = [
    { value: 'torn_pages', label: 'Halaman Robek', icon: '📄', color: 'orange' },
    { value: 'water_damage', label: 'Terkena Air', icon: '💧', color: 'blue' },
    { value: 'missing_pages', label: 'Halaman Hilang', icon: '📋', color: 'red' },
    { value: 'cover_damage', label: 'Cover Rusak', icon: '📕', color: 'purple' },
    { value: 'binding_damage', label: 'Jilid Rusak', icon: '🔗', color: 'yellow' },
    { value: 'other', label: 'Lainnya', icon: '❓', color: 'gray' }
  ];

  // Focus on barcode input when reporter is set
  useEffect(() => {
    if (isReporterSet && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isReporterSet]);

  // Format barcode
  const formatBarcode = (input: string) => {
    const digitsOnly = input.replace(/\D/g, '');
    const paddedBarcode = digitsOnly.padStart(11, '0');
    return paddedBarcode;
  };

  // Fetch book data
  const fetchBookByBarcode = async (barcode: string) => {
    try {
      const result = await apiService.catalog.getByBarcode(barcode);
      return result;
    } catch (error) {
      console.error('Error fetching book:', error);
      return { success: false, message: 'Failed to fetch book data' };
    }
  };

  // Check for duplicate
  const checkDuplicate = async (barcode: string) => {
    try {
      const result = await apiService.brokenBook.checkDuplicate(barcode);
      return result;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return { success: false, isDuplicate: false };
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) {
      return;
    }

    setIsProcessing(true);
    const formattedBarcode = formatBarcode(barcodeInput);

    try {
      // Check duplicate
      const duplicateCheck = await checkDuplicate(formattedBarcode) as any;
      
      // Fetch book data (always fetch, even for duplicates)
      const bookResult = await fetchBookByBarcode(formattedBarcode);
      
      if (bookResult.success) {
        setCurrentBook(bookResult.data);
        
        // Show duplicate alert if exists (informational only)
        if (duplicateCheck.isDuplicate) {
          setDuplicateData(duplicateCheck.data);
          setShowDuplicateAlert(true);
        }
      } else {
        alert('Buku tidak ditemukan');
        setBarcodeInput('');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
      setBarcodeInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Report broken book - Auto submit when damage type selected
  const handleSelectDamageType = async (damageType: string) => {
    if (!currentBook) return;

    // If "Lainnya" selected, show modal for custom description
    if (damageType === 'other') {
      setSelectedDamageType(damageType);
      setShowCustomDescriptionModal(true);
      return;
    }

    // Otherwise, auto-submit with damage type label
    await submitBrokenBook(damageType, getDamageTypeLabel(damageType));
  };

  // Submit broken book report
  const submitBrokenBook = async (damageType: string, description: string) => {
    if (!currentBook) return;

    setIsProcessing(true);

    try {
      const result = await apiService.brokenBook.create({
        barcode: currentBook.Barcode,
        title: currentBook.Title,
        author: currentBook.Author,
        callNumber: currentBook.Call_Number,
        damageType: damageType,
        damageDescription: description,
        reporterName: reporterName,
        notes: ''
      });

      if (result.success) {
        // Add to scan history
        const newScan: ScanHistoryItem = {
          id: Date.now(),
          barcode: currentBook.Barcode,
          title: currentBook.Title,
          damageType: damageType,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          status: 'success'
        };

        setScanHistory([newScan, ...scanHistory]);

        // Reset form
        setCurrentBook(null);
        setBarcodeInput('');
        setCustomDescription('');
        setSelectedDamageType('');
        
        // Focus back to barcode input
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      } else {
        alert('Gagal melaporkan: ' + result.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle custom description submit
  const handleCustomDescriptionSubmit = () => {
    if (!customDescription.trim()) {
      alert('Mohon isi deskripsi kerusakan');
      return;
    }

    setShowCustomDescriptionModal(false);
    submitBrokenBook(selectedDamageType, customDescription);
  };

  const getDamageTypeLabel = (type: string) => {
    const found = damageTypes.find(d => d.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/broken-book')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookX className="w-8 h-8 text-red-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Scan Buku Rusak</h1>
                <p className="text-slate-400 text-sm">Mode cepat untuk scan banyak buku</p>
              </div>
            </div>
            {scanHistory.length > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{scanHistory.length}</p>
                <p className="text-slate-400 text-sm">Buku Terscan</p>
              </div>
            )}
          </div>
        </div>

        {/* Reporter Profile Form */}
        {!isReporterSet ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-8 h-8 text-red-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Informasi Pelapor</h2>
                <p className="text-slate-400 text-sm">Masukkan nama Anda</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (reporterName.trim()) {
                setIsReporterSet(true);
              }
            }}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Nama Pelapor..."
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300"
              >
                Mulai Scan
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Scanner */}
            <div className="lg:col-span-2 space-y-6">
              {/* Reporter Info */}
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-red-400" />
                    <span className="text-white font-semibold">{reporterName}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsReporterSet(false);
                      setCurrentBook(null);
                      setBarcodeInput('');
                    }}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Ganti
                  </button>
                </div>
              </div>

              {/* Barcode Scanner */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Barcode className="w-6 h-6 text-red-400" />
                  Scan Barcode
                </h2>

                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan barcode di sini..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScan();
                    }
                  }}
                  disabled={!!currentBook || isProcessing}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-4 py-4 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono text-xl disabled:opacity-50"
                />

                {currentBook && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg mb-2">{currentBook.Title || 'Tidak ada judul'}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-400">Pengarang:</span>
                            <p className="text-slate-200">{currentBook.Author || '-'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Call Number:</span>
                            <p className="text-cyan-400 font-mono">{currentBook.Call_Number || '-'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Lokasi:</span>
                            <p className="text-slate-200">{currentBook.Name || '-'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Status:</span>
                            <p className="text-yellow-400">{currentBook.STATUS || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Damage Type Selection */}
                    <div>
                      <p className="text-white font-semibold mb-3">Pilih Jenis Kerusakan:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {damageTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => handleSelectDamageType(type.value)}
                            disabled={isProcessing}
                            className="p-3 rounded-lg border-2 border-slate-600 bg-slate-700/50 hover:border-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="text-2xl mb-1">{type.icon}</div>
                            <div className="text-white text-xs font-medium">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - History */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 sticky top-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  Riwayat ({scanHistory.length})
                </h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {scanHistory.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">Belum ada scan</p>
                  ) : (
                    scanHistory.map((scan) => (
                      <div
                        key={scan.id}
                        className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-white text-sm font-semibold flex-1 line-clamp-2">{scan.title}</p>
                        </div>
                        <div className="ml-6 space-y-0.5 text-xs">
                          <p className="text-blue-400 font-mono">{scan.barcode}</p>
                          <p className="text-orange-400">{getDamageTypeLabel(scan.damageType)}</p>
                          <p className="text-slate-400">{scan.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Description Modal for "Lainnya" */}
      {showCustomDescriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Deskripsi Kerusakan</h3>
            
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Jelaskan jenis kerusakan lainnya..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCustomDescriptionModal(false);
                  setCustomDescription('');
                  setSelectedDamageType('');
                }}
                className="flex-1 px-4 py-3 bg-slate-700 rounded-lg text-white font-semibold hover:bg-slate-600 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleCustomDescriptionSubmit}
                disabled={!customDescription.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Laporkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Alert Modal */}
      {showDuplicateAlert && duplicateData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-yellow-500/50 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Informasi: Buku Pernah Dilaporkan</h3>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Judul Buku</p>
                <p className="text-white font-semibold">{duplicateData.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-400 text-sm">Barcode</p>
                  <p className="text-blue-400 font-mono">{duplicateData.barcode}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status Saat Ini</p>
                  <p className="text-yellow-400 font-semibold capitalize">{duplicateData.actionTaken.replace('_', ' ')}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Kerusakan Saat Ini</p>
                <p className="text-orange-400">{getDamageTypeLabel(duplicateData.damageType)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Dilaporkan Oleh</p>
                <p className="text-slate-300">{duplicateData.reportedBy}</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-400 text-sm">
                💡 Laporan sebelumnya akan dipindahkan ke riwayat. Silakan lanjutkan melaporkan kerusakan baru.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDuplicateAlert(false);
                  setDuplicateData(null);
                  setCurrentBook(null);
                  setBarcodeInput('');
                  if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                  }
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowDuplicateAlert(false);
                  setDuplicateData(null);
                  // Keep currentBook loaded so user can select damage type
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg text-white font-semibold hover:shadow-lg transition-all"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokenBookScanner;
