import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScanLine, CheckCircle, AlertCircle, Keyboard, ArrowLeft, XCircle, User, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api.service';

// Room prefix configuration
const ROOM_PREFIX_CONFIG: Record<string, string[]> = {
  'R. Baca Umum': [], // No prefix, just numbers
  'R. Depok Corner': ['D'],
  'R. Baca Anak': ['A'],
  'Unit Perpustakaan Keliling': ['PUSLING'],
  'R. Baca Referens': ['R', 'RA', 'D'],
  'Kotak Literasi Cerdas (KOLECER)': ['KOLECER', 'KOLECER-2', 'KOLECER-3'],
  'BI CORNER': ['BI'],
  'R. Audio Visual': ['ANIMASI'],
  'Motor Baca (MOCA)': ['MOCA'],
  'POCADI (Depok Open Space)': ['POCADI'],
  'Depok Open Space (DOS)': ['DOS']
};

// Class number ranges
const CLASS_NUMBER_OPTIONS = [
  '000-099', '100-199', '200-299', '300-399', '400-499',
  '500-599', '600-699', '700-799', '800-899', '900-999'
];

const BarcodeScanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualInput, setManualInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [statusBukuList, setStatusBukuList] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [picProfile, setPicProfile] = useState({
    name: '',
    rooms: [] as string[],
    classNumbers: [] as string[],
    statusBuku: [] as string[]
  });
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<{
    show: boolean;
    barcode: string;
    title: string;
    sessionInfo?: {
      sessionId: number;
      picName: string;
      scannedAt: string;
      sessionStatus: string;
    };
  }>({
    show: false,
    barcode: '',
    title: ''
  });
  const [validationWarning, setValidationWarning] = useState<{
    show: boolean;
    bookData: any;
    errors: {
      roomMismatch: boolean;
      classMismatch: boolean;
      statusMismatch: boolean;
      expectedRoom: string;
      actualRoom: string;
      expectedPrefix: string;
      actualPrefix: string;
      expectedClassRange: string;
      actualClassNumber: string;
      expectedStatus: string;
      actualStatus: string;
    };
  }>({
    show: false,
    bookData: null,
    errors: {
      roomMismatch: false,
      classMismatch: false,
      statusMismatch: false,
      expectedRoom: '',
      actualRoom: '',
      expectedPrefix: '',
      actualPrefix: '',
      expectedClassRange: '',
      actualClassNumber: '',
      expectedStatus: '',
      actualStatus: ''
    }
  });
  const [scanHistory, setScanHistory] = useState<Array<{
    code: string;
    title: string;
    author?: string;
    call_number?: string;
    year?: string;
    type_procurement?: string;
    source?: string;
    location?: string;
    status_buku?: string;
    timestamp: string;
    status: 'success' | 'error';
    hasWarning?: boolean;
    warningTypes?: string[];
  }>>([]);

  const fetchBookByBarcode = async (barcode: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.catalog.getByBarcode(barcode);
      
      if (data.success && data.data) {
        const bookData: any = data.data;
        return {
          success: true,
          code: barcode,
          title: bookData.Title || 'Unknown Title',
          author: bookData.Author || 'Unknown Author',
          call_number: bookData.Call_Number || 'Unknown Call Number',
          year: bookData.YEAR || 'Unknown Year',
          type_procurement: bookData.Type_Procurement || 'Unknown Type Procurement',
          source: bookData.Source || 'Unknown Source',
          location: bookData.Name || 'Unknown Location',
          status_buku: bookData.STATUS || 'Unknown Status Buku',
        };
      } else {
        return {
          success: false,
          code: barcode,
          title: 'Book not found in database',
          author: '',
          call_number: '',
          year: '',
          type_procurement: '',
          source: '',
          location: '',
          status_buku: '',
        };
      }
    } catch (error) {
      console.error('Error fetching book:', error);
      return {
        success: false,
        code: barcode,
        title: 'Error connecting to database',
        author: '',
        call_number: '',
        year: '',
        type_procurement: '',
        source: '',
        location: '',
        status_buku: '',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Create stock opname session
  const createStockOpnameSession = async () => {
    try {
      const result = await apiService.stockOpname.createSession({
        picName: picProfile.name,
        rooms: picProfile.rooms,
        classNumbers: picProfile.classNumbers,
        statusBuku: picProfile.statusBuku
      });

      
      if (result.success && result.data) {
        setCurrentSessionId(result.data.id);
        // console.log('✅ Session created:', result.data.id);
        return result.data.id;
      } else {
        // console.error('❌ Failed to create session:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating session:', error);
      return null;
    }
  };

  // Update stock opname session
  const updateStockOpnameSession = async () => {
    if (!currentSessionId) {
      console.error('❌ No session ID to update');
      return false;
    }

    try {
      const result = await apiService.stockOpname.updateSession(currentSessionId, {
        picName: picProfile.name,
        rooms: picProfile.rooms,
        classNumbers: picProfile.classNumbers,
        statusBuku: picProfile.statusBuku
      });
      
      if (result.success) {
        // console.log('✅ Session updated:', currentSessionId);
        return true;
      } else {
        // console.error('❌ Failed to update session:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating session:', error);
      return false;
    }
  };

  // Add item to session
  const addItemToSession = async (bookData: any, validation: any, forcedAdd: boolean = false) => {
    if (!currentSessionId) {
      console.error('❌ No active session');
      return;
    }

    try {
      // Determine warning types
      const warningTypes = [];
      if (validation.roomMismatch) warningTypes.push('roomMismatch');
      if (validation.classMismatch) warningTypes.push('classMismatch');
      if (validation.statusMismatch) warningTypes.push('statusMismatch');

      const result = await apiService.stockOpname.addItem(currentSessionId, {
        barcode: bookData.code,
        title: bookData.title,
        author: bookData.author,
        callNumber: bookData.call_number,
        year: bookData.year,
        typeProcurement: bookData.type_procurement,
        source: bookData.source,
        location: bookData.location,
        statusBuku: bookData.status_buku,
        hasWarning: !validation.isValid,
        warningTypes: warningTypes,
        forcedAdd: forcedAdd
      });
      
      if (result.success) {
        // console.log('✅ Item added to session:', result.data.id);
      } else {
        // console.error('❌ Failed to add item:', result.message);
      }
    } catch (error) {
      // console.error('❌ Error adding item:', error);
    }
  };

  // Load existing session (for continue session feature)
  const loadExistingSession = async (sessionId: number) => {
    try {
      // console.log('🔄 Loading existing session:', sessionId);
      const result = await apiService.stockOpname.getSession(sessionId);
      
      if (result.success && result.data) {
        const sessionData = result.data;
        
        // Set session ID
        setCurrentSessionId(sessionId);
        
        // Populate PIC profile
        setPicProfile({
          name: sessionData.picName,
          rooms: sessionData.rooms,
          classNumbers: sessionData.classNumbers,
          statusBuku: sessionData.statusBuku
        });
        
        // Mark profile as set
        setIsProfileSet(true);
        
        // Load existing scanned items into history
        const historyItems = sessionData.items?.map((item: any) => ({
          code: item.barcode,
          title: item.title,
          author: item.author,
          call_number: item.callNumber,
          year: item.year,
          type_procurement: item.typeProcurement,
          source: item.source,
          location: item.location,
          status_buku: item.statusBuku,
          timestamp: new Date(item.scannedAt).toLocaleTimeString('id-ID'),
          status: 'success' as const,
          hasWarning: item.hasWarning,
          warningTypes: item.warningTypes
        })) || [];
        
        setScanHistory(historyItems);
        
        // console.log('✅ Session loaded successfully');
        // console.log('📊 Profile:', sessionData.picName);
        // console.log('📚 Existing items:', historyItems.length);
      } else {
        // console.error('❌ Failed to load session');
        alert('Gagal memuat sesi. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('❌ Error loading session:', error);
      alert('Terjadi kesalahan saat memuat sesi');
    }
  };

  // Validation function
  const validateBookData = (bookData: any) => {
    const callNumber = bookData.call_number || '';
    const bookRoom = bookData.location || '';
    const bookStatus = bookData.status_buku || '';
    const profileRooms = picProfile.rooms; // Array of selected rooms
    const profileClassRanges = picProfile.classNumbers; // Array of selected class ranges
    const profileStatuses = picProfile.statusBuku; // Array of selected statuses

    // console.log('=== VALIDATION DEBUG ===');
    // console.log('Book Call Number:', callNumber);
    // console.log('Book Room:', bookRoom);
    // console.log('Book Status:', bookStatus);
    // console.log('Profile Rooms:', profileRooms);
    // console.log('Profile Class Ranges:', profileClassRanges);
    // console.log('Profile Statuses:', profileStatuses);

    let roomMismatch = false;
    let classMismatch = false;
    let statusMismatch = false;
    let expectedPrefix = '';
    let actualPrefix = '';
    let actualClassNumber = callNumber;

    // Check room mismatch - book room must be in one of the selected rooms
    if (!profileRooms.includes(bookRoom)) {
      roomMismatch = true;
      //console.log('❌ ROOM MISMATCH:', bookRoom, 'not in', profileRooms);
    } else {
      //console.log('✅ Room matches:', bookRoom);
    }

    // Check status buku mismatch - book status must be in one of the selected statuses
    if (!profileStatuses.includes(bookStatus)) {
      statusMismatch = true;
      //console.log('❌ STATUS MISMATCH:', bookStatus, 'not in', profileStatuses);
    } else {
      //console.log('✅ Status matches:', bookStatus);
    }


    // Extract prefix and number from call number
    const callNumberTrimmed = callNumber.trim();
    
    // Check prefix validation for ALL selected rooms
    let prefixValid = false;
    let allExpectedPrefixes: string[] = [];
    
    for (const room of profileRooms) {
      const roomPrefixes = ROOM_PREFIX_CONFIG[room] || [];
      allExpectedPrefixes = [...allExpectedPrefixes, ...roomPrefixes];
      
      if (roomPrefixes.length === 0) {
        // R. Baca Umum - no prefix expected
        if (!/^[A-Za-z]/.test(callNumberTrimmed)) {
          prefixValid = true;
          expectedPrefix = 'Tanpa prefix (angka langsung)';
          actualPrefix = 'Tanpa prefix';
          break;
        }
      } else {
        // Check if call number has any of the expected prefixes
        for (const prefix of roomPrefixes) {
          if (callNumberTrimmed.toUpperCase().startsWith(prefix.toUpperCase())) {
            prefixValid = true;
            expectedPrefix = roomPrefixes.join(' atau ');
            actualPrefix = prefix;
            break;
          }
        }
        if (prefixValid) break;
      }
    }

    if (!prefixValid) {
      classMismatch = true;
      const match = callNumberTrimmed.match(/^([A-Za-z-]+)/);
      actualPrefix = match ? match[1] : 'Tanpa prefix';
      expectedPrefix = allExpectedPrefixes.length > 0 ? allExpectedPrefixes.join(' atau ') : 'Tanpa prefix';
      //console.log('❌ PREFIX MISMATCH: Expected', expectedPrefix, ', found:', actualPrefix);
    } else {
      //console.log('✅ Prefix correct:', actualPrefix);
    }

    // ALWAYS check class number range (independent of prefix validation)
    // Extract the first digit(s) from the call number
    const numberMatch = callNumberTrimmed.match(/(\d+)/);
    if (numberMatch) {
      const firstNumber = parseInt(numberMatch[1]);
      // console.log('Extracted number from call number:', firstNumber);
      
      // Check if number falls within ANY of the selected class ranges
      let rangeValid = false;
      let matchedRange = '';
      
      for (const classRange of profileClassRanges) {
        const rangeMatch = classRange.match(/(\d+)-(\d+)/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          
          if (firstNumber >= start && firstNumber <= end) {
            rangeValid = true;
            matchedRange = classRange;
            break;
          }
        }
      }
      
      if (!rangeValid) {
        classMismatch = true;
        //console.log('❌ RANGE MISMATCH:', firstNumber, 'not in any of', profileClassRanges);
      } else {
        console.log('✅ Range correct:', firstNumber, 'is in range', matchedRange);
      }
    } else {
      // If no number found in call number, it's invalid
      classMismatch = true;
      //console.log('❌ NO NUMBER FOUND in call number');
    }



    const isValid = !roomMismatch && !classMismatch && !statusMismatch;
    // console.log('=== VALIDATION RESULT ===');
    // console.log('Room Mismatch:', roomMismatch);
    // console.log('Class Mismatch:', classMismatch);
    // console.log('Status Mismatch:', statusMismatch);
    // console.log('Is Valid:', isValid);
    // console.log('========================');

    return {
      isValid,
      roomMismatch,
      classMismatch,
      statusMismatch,
      expectedRoom: profileRooms.join(', '),
      actualRoom: bookRoom,
      expectedPrefix,
      actualPrefix,
      expectedClassRange: profileClassRanges.join(', '),
      actualClassNumber,
      expectedStatus: profileStatuses.join(', '),
      actualStatus: bookStatus
    };
  };

  const handleScanResult = async (barcode: string, forceAdd: boolean = false) => {
    // console.log('=== HANDLE SCAN RESULT ===');
    // console.log('Barcode:', barcode);
    // console.log('Force Add:', forceAdd);
    
    // Check for duplicates in DATABASE (not just local state)
    if (!forceAdd) {
      try {
        //console.log('🔍 Checking for duplicates in database...');
        const duplicateResult = await apiService.stockOpname.checkDuplicate(barcode);
        
        if (duplicateResult.success && duplicateResult.data?.isDuplicate) {
          //console.log('⚠️ Duplicate found in database:', duplicateResult.data);
          const dupData = duplicateResult.data.data;
          
          if (dupData) {
            setDuplicateAlert({
              show: true,
              barcode: barcode,
              title: dupData.title || 'Unknown Book',
              sessionInfo: {
                sessionId: dupData.sessionId,
                picName: dupData.picName,
                scannedAt: new Date(dupData.scannedAt).toLocaleString('id-ID'),
                sessionStatus: dupData.sessionStatus
              }
            });
            
            return; // Don't proceed with scanning
          }
        }
        
        //console.log('✅ No duplicate found in database');
      } catch (error) {
        console.error('❌ Error checking duplicate:', error);
        // Continue anyway if duplicate check fails
      }
    }
    
    // console.log('📡 Fetching book data...');
    const result = await fetchBookByBarcode(barcode);
    // console.log('📦 Book data received:', result);
    
    // Validate book data to get warnings (even if forceAdd is true, we want to record warnings)
    let validation = {
      isValid: true,
      roomMismatch: false,
      classMismatch: false,
      statusMismatch: false,
      expectedRoom: '',
      actualRoom: '',
      expectedPrefix: '',
      actualPrefix: '',
      expectedClassRange: '',
      actualClassNumber: '',
      expectedStatus: '',
      actualStatus: ''
    };

    if (result.success) {
      validation = validateBookData(result);
    }
    
    // If not forced and invalid, show warning
    if (result.success && !forceAdd && !validation.isValid) {
      // console.log('❌ VALIDATION FAILED - Showing warning modal');
      setValidationWarning({
        show: true,
        bookData: result,
        errors: validation
      });
      return; // Don't add to history yet
    }
    
    const warningTypes = [];
    if (validation.roomMismatch) warningTypes.push('roomMismatch');
    if (validation.classMismatch) warningTypes.push('classMismatch');
    if (validation.statusMismatch) warningTypes.push('statusMismatch');

    const newScan = {
      code: result.code,
      title: result.title,
      author: result.author,
      call_number: result.call_number,
      year: result.year,
      type_procurement: result.type_procurement,
      source: result.source,
      location: result.location,
      status_buku: result.status_buku,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      status: result.success ? 'success' as const : 'error' as const,
      hasWarning: !validation.isValid,
      warningTypes: warningTypes
    };
    
    //console.log('➕ Adding scan to history:', newScan);
    setScanHistory([newScan, ...scanHistory]);
    
    // Save to backend if successful
    if (result.success) {
      await addItemToSession(result, validation, forceAdd);
    }
    
    //console.log('=========================');
  };

  const handleForceAddBook = async () => {
    const bookData = validationWarning.bookData;
    const errors = validationWarning.errors;
    
    const newScan = {
      code: bookData.code,
      title: bookData.title,
      author: bookData.author,
      call_number: bookData.call_number,
      year: bookData.year,
      type_procurement: bookData.type_procurement,
      source: bookData.source,
      location: bookData.location,
      status_buku: bookData.status_buku,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      status: 'success' as const,
      hasWarning: true,
      warningTypes: Object.entries(errors)
        .filter(([key, value]) => value === true && ['roomMismatch', 'classMismatch', 'statusMismatch'].includes(key))
        .map(([key]) => key),
    };
    
    setScanHistory([newScan, ...scanHistory]);
    
    // Save to backend with forced flag
    await addItemToSession(bookData, errors, true);
    
    setValidationWarning({
      show: false,
      bookData: null,
      errors: {
        roomMismatch: false,
        classMismatch: false,
        statusMismatch: false,
        expectedRoom: '',
        actualRoom: '',
        expectedPrefix: '',
        actualPrefix: '',
        expectedClassRange: '',
        actualClassNumber: '',
        expectedStatus: '',
        actualStatus: ''
      }
    });
  };

  // Auto-focus input on mount and after each scan
  useEffect(() => {
    inputRef.current?.focus();
  }, [scanHistory]);

  // Fetch locations and status buku on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await apiService.location.getAll();
        if (data.success && data.data) {
          // console.log(data.data);
          setLocations(data.data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    const fetchStatusBuku = async () => {
      try {
        const data = await apiService.statusBuku.getAll();
        if (data.success && data.data) {
          // console.log('Status Buku:', data.data);
          setStatusBukuList(data.data);
        }
      } catch (error) {
        console.error('Error fetching status buku:', error);
      }
    };

    fetchLocations();
    fetchStatusBuku();
  }, []);

  // Check for existing session from navigation state
  useEffect(() => {
    const state = location.state as { sessionId?: number } | null;
    if (state?.sessionId) {
      //console.log('📥 Received sessionId from navigation:', state.sessionId);
      loadExistingSession(state.sessionId);
      
      // Clear the state to prevent reloading on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Format barcode by padding with leading zeros to 11 digits
  const formatBarcode = (input: string): string => {
    // Remove any non-digit characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Pad with leading zeros to make it 11 digits
    const paddedBarcode = digitsOnly.padStart(11, '0');
    
    // console.log('Barcode formatting:', input, '->', paddedBarcode);
    return paddedBarcode;
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      // Format the barcode with leading zeros
      const formattedBarcode = formatBarcode(manualInput.trim());
      await handleScanResult(formattedBarcode);
      setManualInput('');
      // Focus will be triggered by useEffect when scanHistory updates
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/stock-opname')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Stock Opname
          </button>
          <div className="flex items-center gap-3 mb-2">
            <ScanLine className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Barcode Scanner</h1>
          </div>
          <p className="text-slate-400">Scan book barcodes to update inventory</p>
        </div>

        {/* Duplicate Alert Modal */}
        {duplicateAlert.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDuplicateAlert({ show: false, barcode: '', title: '' })}
            />
            
            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-orange-500 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-orange-500/20 animate-shake">
              {/* Close Button */}
              <button
                onClick={() => setDuplicateAlert({ show: false, barcode: '', title: '' })}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-orange-500/20 rounded-full p-4">
                  <XCircle className="w-12 h-12 text-orange-500" />
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-orange-500 font-bold text-2xl mb-3">Barcode Sudah Terscan!</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Barcode <span className="font-mono font-semibold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">{duplicateAlert.barcode}</span> sudah pernah di-scan sebelumnya.
                </p>
                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 mb-3">
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Buku:</p>
                  <p className="text-white font-semibold">{duplicateAlert.title}</p>
                </div>
                
                {/* Session Info */}
                {duplicateAlert.sessionInfo && (
                  <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30 text-left">
                    <p className="text-orange-400 text-xs uppercase font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Info Duplikat:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">PIC:</p>
                        <p className="text-white font-semibold">{duplicateAlert.sessionInfo.picName}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Waktu Scan:</p>
                        <p className="text-white font-semibold">{duplicateAlert.sessionInfo.scannedAt}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Session ID:</p>
                        <p className="text-white font-semibold">#{duplicateAlert.sessionInfo.sessionId}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Status Sesi:</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          duplicateAlert.sessionInfo.sessionStatus === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {duplicateAlert.sessionInfo.sessionStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDuplicateAlert({ show: false, barcode: '', title: '' })}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition-all duration-300"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    handleScanResult(duplicateAlert.barcode, true);
                    setDuplicateAlert({ show: false, barcode: '', title: '' });
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300"
                >
                  Tetap Tambahkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Warning Modal */}
        {validationWarning.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setValidationWarning({ ...validationWarning, show: false })}
            />
            
            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-500 rounded-2xl p-6 max-w-2xl w-full shadow-2xl shadow-yellow-500/20 animate-shake">
              {/* Close Button */}
              <button
                onClick={() => setValidationWarning({ ...validationWarning, show: false })}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-500/20 rounded-full p-4">
                  <AlertTriangle className="w-12 h-12 text-yellow-500" />
                </div>
              </div>
              
              {/* Content */}
              <div className="mb-6">
                <h3 className="text-yellow-500 font-bold text-2xl mb-3 text-center">Peringatan Validasi!</h3>
                <p className="text-slate-300 text-sm mb-4 text-center">
                  Data buku yang di-scan tidak sesuai dengan profil PIC yang sedang aktif.
                </p>

                {/* Book Info */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 mb-4">
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Informasi Buku:</p>
                  <p className="text-white font-semibold text-lg mb-1">{validationWarning.bookData?.title}</p>
                  <p className="text-slate-300 text-sm">
                    Call Number: <span className="font-mono font-semibold text-cyan-400">{validationWarning.bookData?.call_number}</span>
                  </p>
                </div>

                {/* Error Details */}
                <div className="space-y-3">
                  {validationWarning.errors.roomMismatch && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-red-400 font-semibold text-sm mb-1">❌ Ruang Buku Tidak Sesuai</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Diharapkan:</p>
                              <p className="text-white font-semibold">{validationWarning.errors.expectedRoom}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Ditemukan:</p>
                              <p className="text-red-300 font-semibold">{validationWarning.errors.actualRoom}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {validationWarning.errors.classMismatch && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-yellow-400 font-semibold text-sm mb-1">⚠️ Nomor Class Tidak Sesuai</p>
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-slate-400">Prefix Diharapkan:</p>
                                <p className="text-white font-semibold font-mono">{validationWarning.errors.expectedPrefix}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Prefix Ditemukan:</p>
                                <p className="text-yellow-300 font-semibold font-mono">{validationWarning.errors.actualPrefix}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-slate-400">Range Class:</p>
                                <p className="text-white font-semibold font-mono">{validationWarning.errors.expectedClassRange}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Call Number:</p>
                                <p className="text-yellow-300 font-semibold font-mono">{validationWarning.errors.actualClassNumber}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {validationWarning.errors.statusMismatch && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-orange-400 font-semibold text-sm mb-1">⚠️ Status Buku Tidak Sesuai</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Diharapkan:</p>
                              <p className="text-white font-semibold">{validationWarning.errors.expectedStatus}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Ditemukan:</p>
                              <p className="text-orange-300 font-semibold">{validationWarning.errors.actualStatus}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Current Profile Info */}
                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-400 text-xs uppercase font-semibold mb-2">Profil PIC Aktif:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">PIC:</p>
                      <p className="text-white font-semibold">{picProfile.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Ruang:</p>
                      <p className="text-white font-semibold">{picProfile.rooms.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Class:</p>
                      <p className="text-white font-semibold">{picProfile.classNumbers.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status:</p>
                      <p className="text-white font-semibold">{picProfile.statusBuku.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setValidationWarning({ ...validationWarning, show: false })}
                  className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg text-white font-semibold transition-all duration-300"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleForceAddBook}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300"
                >
                  Tetap Tambahkan
                </button>
              </div>
            </div>
          </div>
        )}


        {/* PIC Profile Form */}
        {!isProfileSet ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Profile PIC Stock Opname</h2>
                <p className="text-slate-400 text-sm">Isi data PIC sebelum melakukan scan buku</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (picProfile.name && picProfile.rooms.length > 0 && picProfile.classNumbers.length > 0 && picProfile.statusBuku.length > 0) {
                // Check if we're editing an existing session or creating a new one
                if (currentSessionId) {
                  // Update existing session
                  // console.log('🔄 Updating existing session:', currentSessionId);
                  const success = await updateStockOpnameSession();
                  if (success) {
                    setIsProfileSet(true);
                    alert('Profil PIC berhasil diperbarui!');
                  } else {
                    alert('Gagal memperbarui profil. Silakan coba lagi.');
                  }
                } else {
                  // Create new session
                  // console.log('➕ Creating new session');
                  const sessionId = await createStockOpnameSession();
                  if (sessionId) {
                    setIsProfileSet(true);
                  } else {
                    alert('Gagal membuat sesi. Silakan coba lagi.');
                  }
                }
              }
            }} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Nama PIC <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama PIC..."
                  value={picProfile.name}
                  onChange={(e) => setPicProfile({...picProfile, name: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Ruang Buku <span className="text-red-400">*</span>
                </label>
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                  {locations.map((location, index) => (
                    <label 
                      key={index}
                      className="flex items-center gap-2 py-2 hover:bg-slate-600/30 px-2 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={location}
                        checked={picProfile.rooms.includes(location)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPicProfile({...picProfile, rooms: [...picProfile.rooms, location]});
                          } else {
                            setPicProfile({...picProfile, rooms: picProfile.rooms.filter(r => r !== location)});
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-white text-sm">{location}</span>
                    </label>
                  ))}
                </div>
                {picProfile.rooms.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Terpilih ({picProfile.rooms.length}): {picProfile.rooms.join(', ')}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Nomor Class <span className="text-red-400">*</span>
                </label>
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                  {CLASS_NUMBER_OPTIONS.map((classNum, index) => (
                    <label 
                      key={index}
                      className="flex items-center gap-2 py-2 hover:bg-slate-600/30 px-2 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={classNum}
                        checked={picProfile.classNumbers.includes(classNum)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPicProfile({...picProfile, classNumbers: [...picProfile.classNumbers, classNum]});
                          } else {
                            setPicProfile({...picProfile, classNumbers: picProfile.classNumbers.filter(c => c !== classNum)});
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-white text-sm">{classNum}</span>
                    </label>
                  ))}
                </div>
                {picProfile.classNumbers.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Terpilih ({picProfile.classNumbers.length}): {picProfile.classNumbers.join(', ')}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Status Buku <span className="text-red-400">*</span>
                </label>
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                  {statusBukuList.map((status, index) => (
                    <label 
                      key={index}
                      className="flex items-center gap-2 py-2 hover:bg-slate-600/30 px-2 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={status}
                        checked={picProfile.statusBuku.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPicProfile({...picProfile, statusBuku: [...picProfile.statusBuku, status]});
                          } else {
                            setPicProfile({...picProfile, statusBuku: picProfile.statusBuku.filter(s => s !== status)});
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-white text-sm">{status}</span>
                    </label>
                  ))}
                </div>
                {picProfile.statusBuku.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Terpilih ({picProfile.statusBuku.length}): {picProfile.statusBuku.join(', ')}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
              >
                Mulai Scan Buku
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* PIC Info Display */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <User className="w-6 h-6 text-blue-400 mt-1" />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-semibold mb-1">PIC</p>
                      <p className="text-white font-semibold">{picProfile.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Ruang Buku</p>
                      <p className="text-white font-semibold text-sm">{picProfile.rooms.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Nomor Class</p>
                      <p className="text-white font-semibold text-sm">{picProfile.classNumbers.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Status Buku</p>
                      <p className="text-white font-semibold text-sm">{picProfile.statusBuku.join(', ')}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileSet(false)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Manual Barcode Input */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-blue-400" />
            Enter Barcode
          </h2>
          <form onSubmit={handleManualSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Scan or type barcode here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="w-full pl-10 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </form>
        </div>

        {/* Scan History */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Scan History</h2>
          
          {scanHistory.length === 0 ? (
            <div className="text-center py-8">
              <ScanLine className="w-16 h-16 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No scans yet. Start scanning to see results here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className={`rounded-lg transition-colors duration-200 overflow-hidden ${
                    scan.hasWarning 
                      ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30' 
                      : 'bg-slate-700/30 hover:bg-slate-700/50'
                  }`}
                >
                  {/* Header Section */}
                  <div className="flex items-start justify-between p-4 border-b border-slate-600/50">
                    <div className="flex items-start gap-3 flex-1">
                      {scan.status === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-1">{scan.title}</h3>
                        {scan.author && (
                          <p className="text-slate-300 text-sm mb-2">by {scan.author}</p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          {scan.call_number && (
                            <span className="text-cyan-400 text-sm font-mono bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/30">
                              📚 {scan.call_number}
                            </span>
                          )}
                          <span className="text-purple-400 text-sm font-mono bg-purple-500/10 px-2 py-1 rounded border border-purple-500/30">
                            🔖 {scan.code}
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs bg-slate-600/30 px-3 py-1 rounded-full">
                        {scan.timestamp}
                      </span>
                    </div>
                    {scan.hasWarning && scan.warningTypes && scan.warningTypes.length > 0 && (
                      <div className="mx-4 mb-3 flex flex-wrap gap-2">
                         {scan.warningTypes.map((type, idx) => (
                           <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/30 font-semibold">
                             <AlertTriangle className="w-3 h-3" />
                             {type === 'roomMismatch' ? 'Salah Ruangan' : 
                              type === 'classMismatch' ? 'Salah Kelas' : 
                              type === 'statusMismatch' ? 'Salah Status' : type}
                           </span>
                         ))}
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  {scan.status === 'success' && (
                    <div className="p-4 bg-slate-800/30">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {scan.year && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs font-semibold uppercase">Year:</span>
                            <span className="text-slate-300 text-sm">{scan.year}</span>
                          </div>
                        )}
                        {scan.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs font-semibold uppercase">Location:</span>
                            <span className="text-slate-300 text-sm">{scan.location}</span>
                          </div>
                        )}
                        {scan.status_buku && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs font-semibold uppercase">Status:</span>
                            <span className={`text-sm px-2 py-0.5 rounded ${
                              scan.status_buku.toLowerCase().includes('available') || scan.status_buku.toLowerCase().includes('tersedia')
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}>
                              {scan.status_buku}
                            </span>
                          </div>
                        )}
                        {scan.type_procurement && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs font-semibold uppercase">Procurement:</span>
                            <span className="text-slate-300 text-sm">{scan.type_procurement}</span>
                          </div>
                        )}
                        {scan.source && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs font-semibold uppercase">Source:</span>
                            <span className="text-slate-300 text-sm">{scan.source}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Custom Animation for Scan Line */}
      <style>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
