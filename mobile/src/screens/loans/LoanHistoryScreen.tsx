/**
 * Loan History Screen
 * View loan history and active loans
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data
const MOCK_ACTIVE_LOANS = [
  {
    id: 1,
    title: 'Pemrograman Web Modern',
    author: 'John Doe',
    barcode: 'B001234',
    loanDate: '2026-01-15',
    dueDate: '2026-02-05',
    renewalCount: 0,
    status: 'active',
  },
  {
    id: 2,
    title: 'Database Design',
    author: 'Jane Smith',
    barcode: 'B005678',
    loanDate: '2026-01-20',
    dueDate: '2026-01-30',
    renewalCount: 1,
    status: 'due_soon',
  },
];

const MOCK_HISTORY = [
  {
    id: 3,
    title: 'React Native Essentials',
    author: 'Alice Brown',
    barcode: 'B009012',
    loanDate: '2025-12-01',
    returnDate: '2025-12-20',
    status: 'returned',
  },
  {
    id: 4,
    title: 'TypeScript Deep Dive',
    author: 'Charlie Wilson',
    barcode: 'B003456',
    loanDate: '2025-11-15',
    returnDate: '2025-12-18',
    status: 'returned_late',
    lateDays: 3,
  },
];

export default function LoanHistoryScreen() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleRenew = (loanId: number, title: string) => {
    Alert.alert(
      'Perpanjang Peminjaman',
      `Perpanjang peminjaman "${title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Perpanjang',
          onPress: () => Alert.alert('Berhasil', 'Peminjaman berhasil diperpanjang 7 hari'),
        },
      ]
    );
  };

  const renderActiveLoan = (loan: typeof MOCK_ACTIVE_LOANS[0]) => {
    const daysRemaining = getDaysRemaining(loan.dueDate);
    const isOverdue = daysRemaining < 0;
    const isDueSoon = daysRemaining <= 3 && daysRemaining >= 0;
    const canRenew = loan.renewalCount < 2 && !isOverdue;

    return (
      <View key={loan.id} style={styles.loanCard}>
        {/* Book Info */}
        <View style={styles.loanHeader}>
          <View style={styles.bookIcon}>
            <Ionicons name="book" size={24} color="#3b82f6" />
          </View>
          <View style={styles.loanInfo}>
            <Text style={styles.loanTitle}>{loan.title}</Text>
            <Text style={styles.loanAuthor}>{loan.author}</Text>
            <Text style={styles.loanBarcode}>Barcode: {loan.barcode}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            isOverdue && styles.statusOverdue,
            isDueSoon && styles.statusDueSoon,
          ]}
        >
          <Ionicons
            name={isOverdue ? 'alert-circle' : isDueSoon ? 'warning' : 'checkmark-circle'}
            size={16}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {isOverdue
              ? `Terlambat ${Math.abs(daysRemaining)} hari`
              : isDueSoon
              ? `Jatuh tempo ${daysRemaining} hari lagi`
              : `${daysRemaining} hari lagi`}
          </Text>
        </View>

        {/* Dates */}
        <View style={styles.loanDates}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.dateLabel}>Dipinjam:</Text>
            <Text style={styles.dateValue}>{formatDate(loan.loanDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={styles.dateLabel}>Jatuh Tempo:</Text>
            <Text style={styles.dateValue}>{formatDate(loan.dueDate)}</Text>
          </View>
        </View>

        {/* Renewal Info */}
        <View style={styles.renewalInfo}>
          <Ionicons name="refresh" size={14} color="#64748b" />
          <Text style={styles.renewalText}>
            Diperpanjang: {loan.renewalCount}/2 kali
          </Text>
        </View>

        {/* Renew Button */}
        {canRenew ? (
          <TouchableOpacity
            style={styles.renewButton}
            onPress={() => handleRenew(loan.id, loan.title)}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.renewButtonText}>Perpanjang</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.renewDisabled}>
            <Ionicons name="close-circle" size={16} color="#64748b" />
            <Text style={styles.renewDisabledText}>
              {isOverdue
                ? 'Tidak bisa diperpanjang (terlambat)'
                : 'Maksimal perpanjangan tercapai'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHistoryItem = (loan: typeof MOCK_HISTORY[0]) => {
    const isLate = loan.status === 'returned_late';

    return (
      <View key={loan.id} style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={[styles.historyIcon, isLate && styles.historyIconLate]}>
            <Ionicons
              name={isLate ? 'close-circle' : 'checkmark-circle'}
              size={24}
              color={isLate ? '#ef4444' : '#10b981'}
            />
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyTitle}>{loan.title}</Text>
            <Text style={styles.historyAuthor}>{loan.author}</Text>
          </View>
        </View>

        <View style={styles.historyDates}>
          <View style={styles.historyDateItem}>
            <Text style={styles.historyDateLabel}>Dipinjam:</Text>
            <Text style={styles.historyDateValue}>{formatDate(loan.loanDate)}</Text>
          </View>
          <View style={styles.historyDateItem}>
            <Text style={styles.historyDateLabel}>Dikembalikan:</Text>
            <Text style={styles.historyDateValue}>{formatDate(loan.returnDate!)}</Text>
          </View>
        </View>

        {isLate && (
          <View style={styles.lateWarning}>
            <Ionicons name="warning" size={14} color="#ef4444" />
            <Text style={styles.lateText}>Terlambat {loan.lateDays} hari</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Aktif ({MOCK_ACTIVE_LOANS.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Riwayat ({MOCK_HISTORY.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'active' ? (
          <>
            {MOCK_ACTIVE_LOANS.map(renderActiveLoan)}
            {MOCK_ACTIVE_LOANS.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="library-outline" size={64} color="#64748b" />
                <Text style={styles.emptyText}>Tidak ada peminjaman aktif</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {MOCK_HISTORY.map(renderHistoryItem)}
            {MOCK_HISTORY.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color="#64748b" />
                <Text style={styles.emptyText}>Belum ada riwayat peminjaman</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loanCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loanHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loanInfo: {
    flex: 1,
  },
  loanTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  loanAuthor: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 2,
  },
  loanBarcode: {
    color: '#64748b',
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusOverdue: {
    backgroundColor: '#ef4444',
  },
  statusDueSoon: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  loanDates: {
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateLabel: {
    color: '#64748b',
    fontSize: 12,
    marginLeft: 6,
  },
  dateValue: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 6,
  },
  renewalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  renewalText: {
    color: '#64748b',
    fontSize: 12,
    marginLeft: 6,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  renewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  renewDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
  },
  renewDisabledText: {
    color: '#64748b',
    fontSize: 12,
    marginLeft: 6,
  },
  historyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  historyIcon: {
    marginRight: 12,
  },
  historyIconLate: {},
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyAuthor: {
    color: '#94a3b8',
    fontSize: 13,
  },
  historyDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDateItem: {},
  historyDateLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 2,
  },
  historyDateValue: {
    color: '#94a3b8',
    fontSize: 12,
  },
  lateWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  lateText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
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
