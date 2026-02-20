
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface BookItem {
  id: number | string;
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  cover?: string | null;
  available: number;
  total?: number;
}

interface BookCardProps {
  book: BookItem;
  onPress: (book: BookItem) => void;
  width?: number;
  style?: ViewStyle;
}

export default function BookCard({ book, onPress, width, style }: BookCardProps) {
  const isAvailable = book.available > 0;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        width ? { width } : undefined,
        style
      ]} 
      activeOpacity={0.7}
      onPress={() => onPress(book)}
    >
      {/* Book Cover */}
      <View style={styles.coverContainer}>
        {book.cover ? (
          <Image source={{ uri: book.cover }} style={styles.coverImage} />
        ) : (
          <View style={styles.placeholderCover}>
            <Ionicons name="book" size={48} color="#64748b" />
          </View>
        )}
        
        {/* Availability Badge */}
        <View style={[styles.badge, !isAvailable && styles.badgeUnavailable]}>
          <Text style={styles.badgeText}>
            {isAvailable ? 'Tersedia' : 'Dipinjam'}
          </Text>
        </View>
      </View>

      {/* Book Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        
        <View style={styles.metaRow}>
          {book.year && (
             <View style={styles.metaItem}>
               <Ionicons name="calendar-outline" size={12} color="#64748b" />
               <Text style={styles.metaText}>{book.year}</Text>
             </View>
          )}
          <View style={styles.metaSpacer} />
          <View style={styles.metaItem}>
             <Ionicons name="layers-outline" size={12} color="#64748b" />
             <Text style={styles.metaText}>{book.available}/{book.total || '?'} </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coverContainer: {
    width: '100%',
    height: 180, // Fixed height for cover consistency
    backgroundColor: '#334155',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)', // Green with opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeUnavailable: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)', // Red with opacity
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
    height: 40, // Ensure 2 lines check
  },
  author: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 4,
  },
  metaSpacer: {
    width: 8,
  }
});
