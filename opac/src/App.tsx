import { useState, useEffect } from 'react';
import { Search, BookOpen,  Library, CheckCircle, XCircle, Star, TrendingUp, Loader2, Youtube, Instagram, Facebook, Globe } from 'lucide-react';
import { cn } from './lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import { collectionService } from './services/api';
import type { CatalogGroup, PopularCollection, CollectionItem, Pagination } from './services/api';

import { DateTimeDisplay } from './components/DateTimeDisplay';

function App() {
  const [search, setSearch] = useState('');
  const [collections, setCollections] = useState<CatalogGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modal State
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogGroup | null>(null);
  const [detailItems, setDetailItems] = useState<CollectionItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popularCollections, setPopularCollections] = useState<PopularCollection[]>([]);

  // Fetch Popular Collections
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const result = await collectionService.getPopular();
        if (result.success) {
          setPopularCollections(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch popular collections:', error);
      }
    };
    fetchPopular();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await collectionService.getCollections(page, 12, debouncedSearch);
        setCollections(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch, page]);

  const handleBookClick = (catalogId: number) => {
    const book = popularCollections.find(p => p.Catalog_id === catalogId);
    if (book) {
      const adaptedCatalog: CatalogGroup = {
        ...book,
        TotalItems: 0,
        AvailableItems: 0
      };
      handleOpenDetail(adaptedCatalog);
    }
  };

  const handleOpenDetail = async (catalog: CatalogGroup) => {
    setSelectedCatalog(catalog);
    setIsModalOpen(true);
    setLoadingDetails(true);
    try {
      const result = await collectionService.getItems(catalog.Catalog_id);
      setDetailItems(result.data);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for sticky search
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans text-slate-900">
      
      {/* Navbar with Sticky Search */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-between">
             <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Library className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent hidden sm:inline-block leading-tight">
                    Perpustakaan Umum Kota Depok
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline-block tracking-widest -mt-0.5">
                    NPP : 3276013E1000001
                  </span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent sm:hidden">
                  OPAC
                </span>
             </div>
             {/* Mobile Clock show here if needed, but keeping hidden on mobile for space as per component design */}
          </div>

          <div className="flex items-center gap-4">
            <DateTimeDisplay />
          </div>
        </div>
      </nav>

      {/* Hero Search Section (Colorful) */}
      <div className="relative pt-16 pb-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500"></div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
           <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
           <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
           <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 mb-8 z-10">
           <div className="max-w-4xl mx-auto text-center relative">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 font-display drop-shadow-sm">
                Temukan Pengetahuan <span className="text-yellow-300">Tanpa Batas</span>
              </h1>
              <p className="text-base sm:text-lg text-blue-50 max-w-2xl mx-auto font-medium">
                Jelajahi ribuan koleksi buku, jurnal, dan referensi digital kami.
              </p>

              {/* Depok Logo - Absolutely positioned to the left */}
              <div className="hidden lg:block absolute left-[-100px] top-1/2 -translate-y-1/2 z-10 w-36">
                 <img 
                   src="/images/logo-depok.png" 
                   alt="Logo Kota Depok" 
                   className="w-full h-auto object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300 animate-in fade-in slide-in-from-left-10 duration-700"
                 />
              </div>

              {/* Oyen Character - Absolutely positioned to the right */}
              <div className="hidden lg:block absolute right-[-100px] top-1/2 -translate-y-1/2 z-10 w-36">
                 <img 
                   src="/images/oyen.png" 
                   alt="Si Oyen" 
                   className="w-full h-auto object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300 animate-in fade-in slide-in-from-right-10 duration-700"
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Sticky Search Bar - Moved Outside to Stick Properly */}
      <div className={cn(
          "sticky z-40 transition-all duration-500 ease-in-out px-4",
          isScrolled ? "top-20 pb-2 pt-2 pointer-events-none" : "top-[72px] -mt-10 pb-4 bg-transparent"
      )}>
          <div className={cn(
            "max-w-2xl mx-auto transition-all duration-300 pointer-events-auto", 
             isScrolled && "scale-95"
          )}>
            <div className={cn(
              "relative group rounded-full transition-all duration-300",
              isScrolled ? "shadow-2xl bg-white/90 backdrop-blur-xl border-blue-200/50" : "shadow-lg bg-white border-slate-200"
            )}>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className={cn(
                    "h-5 w-5 transition-colors",
                    isScrolled ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500"
                  )} />
              </div>
              <input
                  type="text"
                  className={cn(
                    "block w-full pl-12 pr-6 py-4 bg-transparent border border-transparent rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 transition-all text-base",
                    isScrolled && "py-3"
                  )}
                  placeholder="Cari judul, penulis, ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
              <button className={cn(
                "absolute inset-y-1 right-1 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-colors shadow-md",
                isScrolled && "inset-y-1"
              )}>
                  Cari
              </button>
            </div>
          </div>
      </div>

      {/* Popular Collections Section */}
      {!debouncedSearch && popularCollections.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 -mb-8">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-amber-100 rounded-lg">
               <Star className="w-6 h-6 text-amber-600" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-900">Koleksi Terpopuler</h2>
               <p className="text-slate-500 text-sm">Buku yang paling sering dipinjam</p>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {popularCollections.map((book) => (
              <div 
                key={book.Catalog_id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden cursor-pointer hover:-translate-y-1"
                onClick={() => handleBookClick(book.Catalog_id)}
              >
                <div className="aspect-[2/3] overflow-hidden relative bg-slate-100">
                  {book.CoverURL ? (
                    <img 
                      src={book.CoverURL} 
                      alt={book.Title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <BookOpen className="w-12 h-12 opacity-50 mb-2" />
                      <span className="text-xs font-medium uppercase tracking-wider opacity-50">No Cover</span>
                    </div>
                  )}
                  
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-sm">
                     #{popularCollections.indexOf(book) + 1}
                  </div>

                  {/* Call Number Badge */}
                  {book.CallNumber && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-sm font-mono font-bold py-1.5 px-2 text-center pointer-events-none tracking-wider">
                      {book.CallNumber}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 text-sm min-h-[40px] group-hover:text-blue-600 transition-colors">
                    {book.Title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2 truncate">{book.Author}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full w-fit">
                     <TrendingUp className="w-3 h-3" />
                     {book.LoanCount}x Dipinjam
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-blue-100 rounded-lg">
               <Library className="w-6 h-6 text-blue-600" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-900">
                 {debouncedSearch ? 'Hasil Pencarian' : 'Koleksi Terbaru'}
               </h2>
               <p className="text-slate-500 text-sm">
                 {debouncedSearch ? `Menampilkan hasil untuk "${debouncedSearch}"` : 'Menjelajahi koleksi terbaru perpustakaan'}
               </p>
             </div>
          </div>
          {pagination && (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              {collections.length} / {pagination.total} judul
            </span>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Mencari koleksi...</p>
          </div>
        )}

        {!loading && collections.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tidak ditemukan</h3>
            <p className="text-slate-500 text-sm">Coba kata kunci lain.</p>
          </div>
        )}

        {/* Unified Grid Style (Same as Popular) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {!loading && collections.map((catalog) => (
            <div 
              key={catalog.Catalog_id} 
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden cursor-pointer hover:-translate-y-1"
              onClick={() => handleOpenDetail(catalog)}
            >
              {/* Cover Area */}
              <div className="aspect-[2/3] overflow-hidden relative bg-slate-100">
                 {catalog.CoverURL ? (
                    <img src={catalog.CoverURL} alt={catalog.Title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <BookOpen className="w-12 h-12 opacity-50 mb-2" />
                        <span className="text-xs font-medium uppercase tracking-wider opacity-50">No Cover</span>
                    </div>
                 )}
                 {/* Publish Year Overlay */}
                 <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">{catalog.PublishYear}</span>
                 </div>

                 {/* Call Number Badge */}
                 {catalog.CallNumber && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-sm font-mono font-bold py-1.5 px-2 text-center pointer-events-none tracking-wider">
                      {catalog.CallNumber}
                    </div>
                 )}
              </div>

              {/* Content Area */}
              <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 text-sm min-h-[40px] group-hover:text-blue-600 transition-colors" title={catalog.Title}>
                  {catalog.Title}
                </h3>
                
                <p className="text-xs text-slate-500 mb-3 truncate">
                  {catalog.Author || 'No Author'}
                </p>

                {/* Availability Badge */}
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit",
                  catalog.AvailableItems > 0
                    ? "bg-green-50 text-green-700" 
                    : "bg-red-50 text-red-700"
                )}>
                   {catalog.AvailableItems > 0 ? (
                      <CheckCircle className="w-3 h-3" />
                   ) : (
                      <XCircle className="w-3 h-3" />
                   )}
                   {catalog.AvailableItems} Tersedia
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
              Page {page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">{selectedCatalog?.Title}</DialogTitle>
            <DialogDescription className="text-slate-600 text-sm sm:text-base">
                Detail Koleksi dan Ketersediaan Eksemplar
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                 {/* Cover Image */}
                 <div className="flex-shrink-0 w-40 sm:w-48 mx-auto md:mx-0 shadow-lg rounded-lg overflow-hidden">
                    {selectedCatalog?.CoverURL ? (
                      <img 
                        src={selectedCatalog.CoverURL} 
                        alt={selectedCatalog.Title} 
                        className="w-full h-full object-cover aspect-[2/3]"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                         <BookOpen className="w-12 h-12 opacity-50 mb-2" />
                         <span className="text-xs font-medium uppercase tracking-wider opacity-50">No Cover</span>
                      </div>
                    )}
                 </div>

                 {/* Info Detail */}
                 <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm content-start">
                  <div className="border-b border-slate-200/50 pb-2 sm:border-0 sm:pb-0">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Pengarang</span>
                    <span className="text-slate-900 font-semibold text-base">{detailItems[0]?.Author || selectedCatalog?.Author}</span>
                  </div>
                  <div className="border-b border-slate-200/50 pb-2 sm:border-0 sm:pb-0">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Penerbit</span>
                    <span className="text-slate-900 font-medium">{detailItems[0]?.Publisher || selectedCatalog?.Publisher}</span>
                  </div>
                  <div className="border-b border-slate-200/50 pb-2 sm:border-0 sm:pb-0">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Tahun Terbit</span>
                    <span className="text-slate-900 font-medium">{selectedCatalog?.PublishYear}</span>
                  </div>
                  <div className="border-b border-slate-200/50 pb-2 sm:border-0 sm:pb-0">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">ISBN</span>
                    <span className="text-slate-900 font-medium font-mono">{detailItems[0]?.ISBN || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Deskripsi Fisik</span>
                    <span className="text-slate-900 font-medium">{detailItems[0]?.PhysicalDescription || '-'}</span>
                  </div>
                 </div>
              </div>

              {/* Table List Items */}
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Library className="w-5 h-5 text-blue-500" />
                Daftar Eksemplar
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Desktop View - Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 whitespace-nowrap">
                      <tr>
                        <th className="px-4 py-3">No. Barcode</th>
                        <th className="px-4 py-3">Call Number</th>
                        <th className="px-4 py-3">Lokasi</th>
                        <th className="px-4 py-3">Sumber</th>
                        <th className="px-4 py-3">Akses</th>
                        <th className="px-4 py-3">Edisi</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {detailItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-blue-600 font-medium whitespace-nowrap">{item.NomorBarcode}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{item.CallNumber}</td>
                          <td className="px-4 py-3 text-slate-700 min-w-[150px]">{item.LocationName}</td>
                          <td className="px-4 py-3 text-slate-700 min-w-[120px]">{item.PartnerName || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                             <span className={cn(
                               "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border inline-block whitespace-nowrap",
                               item.RuleName.toLowerCase().includes('pinjam') 
                                 ? "bg-blue-50 text-blue-700 border-blue-200" 
                                 : "bg-amber-50 text-amber-700 border-amber-200"
                             )}>
                               {item.RuleName}
                             </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.Edition || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                             <span className={cn(
                               "px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 whitespace-nowrap",
                               item.StatusName.toLowerCase().includes('tersedia') || item.StatusName.toLowerCase().includes('available')
                                 ? "bg-green-100 text-green-700"
                                 : "bg-red-100 text-red-700"
                             )}>
                               {item.StatusName.toLowerCase().includes('tersedia') 
                                 ? <CheckCircle className="w-3 h-3"/> 
                                 : <XCircle className="w-3 h-3"/>
                               }
                               {item.StatusName}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View - Cards */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {detailItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                         <div className="flex flex-col">
                            <span className="font-mono text-blue-600 font-bold text-base">{item.NomorBarcode}</span>
                            <span className="text-xs text-slate-500 font-medium">{item.CallNumber}</span>
                         </div>
                         <span className={cn(
                           "px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1",
                           item.StatusName.toLowerCase().includes('tersedia') || item.StatusName.toLowerCase().includes('available')
                             ? "bg-green-100 text-green-700"
                             : "bg-red-100 text-red-700"
                         )}>
                           {item.StatusName.toLowerCase().includes('tersedia') 
                             ? <CheckCircle className="w-3 h-3"/> 
                             : <XCircle className="w-3 h-3"/>
                           }
                           {item.StatusName}
                         </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="block text-slate-400 font-semibold mb-0.5">Lokasi</span>
                          <span className="text-slate-800">{item.LocationName}</span>
                        </div>
                        <div>
                           <span className="block text-slate-400 font-semibold mb-0.5">Akses</span>
                           <span className={cn(
                             "inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase",
                             item.RuleName.toLowerCase().includes('pinjam') 
                               ? "bg-blue-50 text-blue-700 border-blue-200" 
                               : "bg-amber-50 text-amber-700 border-amber-200"
                           )}>
                             {item.RuleName}
                           </span>
                        </div>
                        {item.PartnerName && (
                          <div className="col-span-2">
                            <span className="block text-slate-400 font-semibold mb-0.5">Sumber</span>
                            <span className="text-slate-800">{item.PartnerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
            
            <div className="mb-10">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-6">Social Media</p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                 
                 <a href="https://www.youtube.com/@perpustakaandepok" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors border border-slate-200 hover:border-red-200 group">
                    <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Youtube</span>
                 </a>

                 <a href="https://instagram.com/perpustakaanumumkotadepok" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-colors border border-slate-200 hover:border-pink-200 group">
                    <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Instagram</span>
                 </a>

                 <a href="https://tiktok.com/@perpustakaanumumdepok" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 hover:border-slate-300 group">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="text-sm font-medium">TikTok</span>
                 </a>

                 <a href="https://www.facebook.com/kap.depok.go.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors border border-slate-200 hover:border-blue-200 group">
                    <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Facebook</span>
                 </a>

                 <a href="https://www.diskarpus.depok.go.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors border border-slate-200 hover:border-emerald-200 group">
                    <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Website</span>
                 </a>

              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">Supported By</p>
              <div className="flex flex-wrap justify-center items-center gap-8 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  <img src="/images/inlislite-logo.png" alt="Inlislite" className="h-12 w-auto object-contain" />
                  <img src="/images/perpusnas-logo.png" alt="Perpustakaan Nasional RI" className="h-12 w-auto object-contain" />
                  <img src="/images/dispusipda-logo.png" alt="Dispusipda Jabar" className="h-12 w-auto object-contain" />
              </div>
            </div>

            <p className="text-slate-500 text-sm">© 2026 Perpustakaan Digital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
