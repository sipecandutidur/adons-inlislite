
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32; // Full width minus padding
const BANNER_HEIGHT = 180;

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  image?: any; // Replace with proper image source type
  backgroundColor: string;
}

const BANNERS: BannerItem[] = [
  {
    id: '1',
    title: 'Selamat Datang di \nPerpustakaan Digital',
    subtitle: 'Jelajahi ribuan koleksi buku kami',
    backgroundColor: '#1e3a8a', // Dark blue
    // placeholder image or gradient logic
  },
  {
    id: '2',
    title: 'Koleksi Terbaru',
    subtitle: 'Buku-buku baru bulan ini',
    backgroundColor: '#047857', // Emerald green
  },
  {
    id: '3',
    title: 'Baca Dimana Saja',
    subtitle: 'Akses mudah dari smartphone Anda',
    backgroundColor: '#be185d', // Pink/Rose
  },
];

export default function Banner() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll effect
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= BANNERS.length) {
        nextIndex = 0;
      }
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 5000); // 5 seconds

    return () => clearInterval(timer);
  }, [currentIndex]);

  const renderItem = ({ item }: { item: BannerItem }) => {
    return (
      <View style={[styles.bannerContainer, { backgroundColor: item.backgroundColor }]}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Lihat Sekarang</Text>
            <Ionicons name="arrow-forward" size={16} color="#1e293b" />
          </TouchableOpacity>
        </View>
        
        {/* Decorative Circle */}
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircleSmall} />
      </View>
    );
  };

  const renderDot = (index: number) => {
    const opacity = scrollX.interpolate({
      inputRange: [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ],
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange: [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ],
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          { opacity, transform: [{ scale }] },
          currentIndex === index && styles.activeDot,
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: (event: any) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            if (index !== currentIndex) {
              setCurrentIndex(index);
            }
          }}
        )}
        snapToInterval={width} // Snap to full width
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }} // Gap at starts
      />

      <View style={styles.pagination}>
        {BANNERS.map((_, index) => renderDot(index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    marginRight: 16, // Gap between items if we remove snapToInterval
    // Actually with pagingEnabled and full width logic, let's adjust:
    // We want the banner to be slightly smaller than full width with peek or just full width? 
    // The requirement is responsive. Let's make it width - 32 (16 padding each side)
    // But FlatList pagingEnabled works best with full width items. 
    // Let's adjust usage in parent. 
    // For now, let's assume the parent passes correct width or we handle it here.
    // If we want "peek" functionality it's harder with basic FlatList. 
    // Let's stick to simple "cards" in a scroll view for now, or use width - 32.
    // To make it simpler, let's use width - 32 and snapToInterval = width - 16? 
    // No, standard paging is safer. Let's start with width so it works robustly.
    // Wait, the design usually asks for padding.
    // Let's use `width - 32` for item width, and `snapToInterval={width - 32 + margin}`
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    zIndex: 2,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 12,
    marginRight: 4,
  },
  decorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 75,
  },
  decorativeCircleSmall: {
    position: 'absolute',
    bottom: -10,
    right: 40,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#60a5fa', // Lighter blue
    width: 20,
  }
});
