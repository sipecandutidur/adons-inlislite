/**
 * Home Screen - OPAC / Catalog Browsing
 * Browse library collection with Banner and improved layout
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Banner from '../../components/Banner';
import BookCard, { BookItem } from '../../components/BookCard';
import apiService from '../../services/api.service';
import { COVER_BASE_URL } from '../../config/api.config';

const CATEGORIES = [
  { id: 'all', name: 'Semua', icon: 'apps' },
  { id: 'new', name: 'Terbaru', icon: 'sparkles' },
  { id: 'popular', name: 'Populer', icon: 'flame' },
  { id: 'fiction', name: 'Fiksi', icon: 'book' },
  { id: 'science', name: 'Sains', icon: 'flask' },
];

export default function HomeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await apiService.catalog.getCollections();
      console.log('HomeScreen received collections:', response);

      let booksData: any[] = [];
      
      // Handle different response structures
      if (Array.isArray(response)) {
        booksData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        booksData = response.data;
      } else if (response?.success && Array.isArray(response.data)) {
        booksData = response.data;
      }

      console.log('Books data to map:', booksData.length);

      const mapItem = (item: any): BookItem => {
        let coverUrl = item.CoverURL || item.cover;
        // If cover is just a filename (doesn't start with http), prepend base URL
        if (coverUrl && !coverUrl.startsWith('http')) {
          coverUrl = `${COVER_BASE_URL}${coverUrl}`;
        }
        
        return {
          id: item.Catalog_id || item.id,
          title: item.Title || item.title || 'No Title',
          author: item.Author || item.author || 'Unknown Author',
          publisher: item.Publisher || item.publisher,
          year: item.PublishYear || item.year,
          cover: coverUrl,
          available: item.AvailableItems !== undefined ? item.AvailableItems : (item.available || 0),
          total: item.TotalItems !== undefined ? item.TotalItems : (item.total || 0),
        };
      };

      setBooks(booksData.map(mapItem));
    } catch (error) {
      console.error('Failed to fetch collections in HomeScreen:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Grid Calculation
  const MIN_COLUMN_WIDTH = 160;
  const GAP = 16;
  const PADDING = 16;
  const availableWidth = width - (PADDING * 2);
  const numColumns = Math.floor(availableWidth / MIN_COLUMN_WIDTH);
  const safeNumColumns = Math.max(2, numColumns); 
  const gapTotal = GAP * (safeNumColumns - 1);
  const cardWidth = (availableWidth - gapTotal) / safeNumColumns;

  const handleBookPress = (book: BookItem) => {
    // Navigate to detail
    // navigation.navigate('BookDetail', { bookId: book.id });
    console.log('Book pressed:', book.title);
  };

  const renderHeader = () => (
    <View>
      {/* Banner Section */}
      <View style={styles.bannerSection}>
        <Banner />
      </View>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kategori</Text>
        <TouchableOpacity>
           <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Ionicons
              name={item.icon as any}
              size={18}
              color={selectedCategory === item.id ? '#fff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.id && styles.categoryTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Stats / Filter Info */}
      <View style={styles.statsBar}>
        <Text style={styles.statsTitle}>Koleksi Buku ({books.length})</Text>
        <TouchableOpacity style={styles.filterButton}>
           <Ionicons name="filter" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.container}>
        {/* Header Search - Fixed at top */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>Halo, Pemustaka</Text>
              <Text style={styles.subtitleText}>Mau baca apa hari ini?</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari judul, penulis, ISBN..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            key={`grid-${safeNumColumns}`} // Force re-render when columns change
            data={books}
            renderItem={({ item }) => (
              <View style={{ width: cardWidth }}>
                <BookCard 
                  book={item} 
                  onPress={handleBookPress} 
                  width={cardWidth}
                />
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={safeNumColumns}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={[styles.columnWrapper, { gap: GAP }]}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search" size={64} color="#334155" />
                <Text style={styles.emptyText}>Tidak ada buku ditemukan</Text>
              </View>
            }
            refreshing={loading}
            onRefresh={fetchCollections}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },
  notificationBtn: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 16, // Ensure padding is applied to container
  },
  bannerSection: {
    paddingTop: 16,
    paddingBottom: 8,
    marginHorizontal: -16, // Negate parent padding for full width if desired, but here we want it contained?
    // Wait, listContent has horizontal padding 16. 
    // Banner creates its own padding or margin. 
    // Let's keep it simple. If we want full width banner, we might need adjustments.
    // The previous implementation had banner inside header which is inside ListHeaderComponent.
    // ListHeaderComponent is inside FlatList which has `contentContainerStyle` padding.
    // So standard padding applies.
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesContent: {
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#fff',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  columnWrapper: {
    justifyContent: 'flex-start', // With gap, we can start from flex-start
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
  },
});
