/**
 * News Screen
 * Library news and announcements
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data
const MOCK_NEWS = [
  {
    id: 1,
    title: 'Perpustakaan Buka Layanan 24 Jam',
    excerpt: 'Mulai bulan depan, perpustakaan akan buka 24 jam untuk mendukung kegiatan belajar mahasiswa...',
    date: '2026-01-25',
    image: null,
    category: 'Pengumuman',
  },
  {
    id: 2,
    title: 'Koleksi Buku Baru Bulan Januari',
    excerpt: '50 judul buku baru telah ditambahkan ke koleksi perpustakaan, termasuk buku teknologi terkini...',
    date: '2026-01-20',
    image: null,
    category: 'Koleksi Baru',
  },
  {
    id: 3,
    title: 'Workshop Literasi Digital',
    excerpt: 'Ikuti workshop literasi digital gratis setiap hari Sabtu pukul 10.00 - 12.00 WIB...',
    date: '2026-01-15',
    image: null,
    category: 'Event',
  },
];

export default function NewsScreen() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pengumuman':
        return '#3b82f6';
      case 'Koleksi Baru':
        return '#10b981';
      case 'Event':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Berita & Pengumuman</Text>
          <Text style={styles.headerSubtitle}>
            Update terbaru dari perpustakaan
          </Text>
        </View>

        {/* News List */}
        {MOCK_NEWS.map((news) => (
          <TouchableOpacity key={news.id} style={styles.newsCard} activeOpacity={0.7}>
            {/* News Image */}
            {news.image ? (
              <Image source={{ uri: news.image }} style={styles.newsImage} />
            ) : (
              <View style={styles.newsImagePlaceholder}>
                <Ionicons name="newspaper" size={48} color="#64748b" />
              </View>
            )}

            {/* News Content */}
            <View style={styles.newsContent}>
              {/* Category Badge */}
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(news.category) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: getCategoryColor(news.category) },
                  ]}
                >
                  {news.category}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.newsTitle}>{news.title}</Text>

              {/* Excerpt */}
              <Text style={styles.newsExcerpt} numberOfLines={2}>
                {news.excerpt}
              </Text>

              {/* Meta */}
              <View style={styles.newsMeta}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.newsDate}>{formatDate(news.date)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Empty State */}
        {MOCK_NEWS.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>Belum ada berita</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  newsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  newsImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  newsImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 24,
  },
  newsExcerpt: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 12,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsDate: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
  },
});
