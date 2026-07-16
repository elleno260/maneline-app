import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getScanHistoryFromFirebase,
  ScanHistoryItem,
} from '../../services/scanHistoryFirebaseService';

function formatDate(isoDate: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return 'Recently scanned';
  }
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();

  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);

    try {
      const scans = await getScanHistoryFromFirebase();
      setHistory(scans);
    } catch (error) {
      console.warn('Could not load scan history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 140,
          },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Scan History</Text>
          <Text style={styles.title}>Your product decisions, saved.</Text>
          <Text style={styles.subtitle}>
            Every scan helps ManeLine understand what works for your hair,
            routine, and goals.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#111827" />
            <Text style={styles.loadingText}>Loading scan history...</Text>
          </View>
        ) : null}

        {!loading && history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="scan-outline" size={38} color="#111827" />
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyText}>
              Scan your first product to start building your product history and
              improve your recommendations.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/scan' as never)}
            >
              <Text style={styles.emptyButtonText}>Scan a product</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        {history.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.brand}>{item.brand ?? 'Saved scan'}</Text>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.dateText}>{formatDate(item.scannedAt)}</Text>
              </View>

              {item.compatibilityScore ? (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>
                    {item.compatibilityScore}%
                  </Text>
                </View>
              ) : null}
            </View>

            {item.compatibilityLabel ? (
              <Text style={styles.label}>{item.compatibilityLabel}</Text>
            ) : null}

            <Text style={styles.summary}>{item.summary}</Text>

            {item.routineFit ? (
              <View style={styles.routineBox}>
                <Text style={styles.routineTitle}>Routine fit</Text>
                <Text style={styles.routineText}>{item.routineFit}</Text>
              </View>
            ) : null}

            {item.matchReasons?.length ? (
              <>
                <Text style={styles.sectionTitle}>Why it matched</Text>
                {item.matchReasons.slice(0, 3).map((reason) => (
                  <Text key={reason} style={styles.bulletText}>
                    • {reason}
                  </Text>
                ))}
              </>
            ) : null}

            {item.cautions?.length ? (
              <>
                <Text style={styles.sectionTitle}>Cautions</Text>
                {item.cautions.slice(0, 2).map((caution) => (
                  <Text key={caution} style={styles.cautionText}>
                    • {caution}
                  </Text>
                ))}
              </>
            ) : null}

            {item.ingredientHighlights?.length ? (
              <>
                <Text style={styles.sectionTitle}>Ingredient notes</Text>
                {item.ingredientHighlights.slice(0, 2).map((note) => (
                  <Text key={note} style={styles.bulletText}>
                    • {note}
                  </Text>
                ))}
              </>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  content: {
    paddingHorizontal: 20,
  },
  hero: {
    backgroundColor: '#111827',
    borderRadius: 32,
    padding: 22,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E7EB',
    fontWeight: '700',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  loadingText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  brand: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  productName: {
    marginTop: 3,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: '#111827',
  },
  dateText: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },
  scoreBadge: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  label: {
    marginTop: 13,
    fontSize: 13,
    color: '#D97706',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summary: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '600',
  },
  routineBox: {
    marginTop: 14,
    backgroundColor: '#FFF7F0',
    borderRadius: 18,
    padding: 13,
  },
  routineTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  routineText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  sectionTitle: {
    marginTop: 15,
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
    marginBottom: 3,
  },
  cautionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#B45309',
    marginBottom: 3,
    fontWeight: '700',
  },
});