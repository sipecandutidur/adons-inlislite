/**
 * Member Card Screen
 * Display member QR code and barcode
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

// Mock member data
const MOCK_MEMBER = {
  id: 'M001234',
  name: 'John Doe',
  memberType: 'Mahasiswa',
  faculty: 'Fakultas Teknik',
  validUntil: '2026-12-31',
  photo: null,
};

export default function MemberCardScreen() {
  const [showQR, setShowQR] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Member Card */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderGradient}>
              <Ionicons name="library" size={32} color="#fff" />
              <Text style={styles.cardHeaderText}>KARTU MEMBER</Text>
            </View>
          </View>

          {/* Member Photo */}
          <View style={styles.photoContainer}>
            {MOCK_MEMBER.photo ? (
              <View style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color="#64748b" />
              </View>
            )}
          </View>

          {/* Member Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{MOCK_MEMBER.name}</Text>
            <Text style={styles.memberId}>ID: {MOCK_MEMBER.id}</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="school-outline" size={16} color="#64748b" />
                <Text style={styles.infoText}>{MOCK_MEMBER.memberType}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="business-outline" size={16} color="#64748b" />
                <Text style={styles.infoText}>{MOCK_MEMBER.faculty}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                <Text style={styles.infoText}>
                  Berlaku hingga: {MOCK_MEMBER.validUntil}
                </Text>
              </View>
            </View>
          </View>

          {/* QR/Barcode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, showQR && styles.toggleButtonActive]}
              onPress={() => setShowQR(true)}
            >
              <Ionicons
                name="qr-code"
                size={20}
                color={showQR ? '#fff' : '#64748b'}
              />
              <Text style={[styles.toggleText, showQR && styles.toggleTextActive]}>
                QR Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, !showQR && styles.toggleButtonActive]}
              onPress={() => setShowQR(false)}
            >
              <Ionicons
                name="barcode"
                size={20}
                color={!showQR ? '#fff' : '#64748b'}
              />
              <Text style={[styles.toggleText, !showQR && styles.toggleTextActive]}>
                Barcode
              </Text>
            </TouchableOpacity>
          </View>

          {/* QR Code Display */}
          {showQR ? (
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={MOCK_MEMBER.id}
                  size={width - 120}
                  backgroundColor="#fff"
                  color="#000"
                />
              </View>
              <Text style={styles.qrLabel}>Scan untuk peminjaman</Text>
            </View>
          ) : (
            <View style={styles.barcodeContainer}>
              <View style={styles.barcodePlaceholder}>
                <Ionicons name="barcode" size={80} color="#000" />
              </View>
              <Text style={styles.barcodeText}>{MOCK_MEMBER.id}</Text>
              <Text style={styles.qrLabel}>Tunjukkan ke petugas</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="scan" size={24} color="#3b82f6" />
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Peminjaman Mandiri</Text>
              <Text style={styles.instructionText}>
                Scan QR code di mesin peminjaman mandiri
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="person" size={24} color="#10b981" />
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Peminjaman Manual</Text>
              <Text style={styles.instructionText}>
                Tunjukkan kartu ke petugas perpustakaan
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Jaga Kerahasiaan</Text>
              <Text style={styles.instructionText}>
                Jangan bagikan QR code ke orang lain
              </Text>
            </View>
          </View>
        </View>
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
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  cardHeader: {
    height: 100,
    overflow: 'hidden',
  },
  cardHeaderGradient: {
    flex: 1,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 2,
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    borderWidth: 4,
    borderColor: '#1e293b',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    borderWidth: 4,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  memberName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  toggleTextActive: {
    color: '#fff',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  qrLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 16,
  },
  barcodeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  barcodePlaceholder: {
    width: width - 80,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    letterSpacing: 2,
  },
  instructions: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
