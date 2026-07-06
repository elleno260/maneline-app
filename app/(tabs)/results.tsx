import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  clearScanHistory,
  getScanHistory,
  ScanHistoryItem,
} from '../../services/scanHistoryService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PAGE_HORIZONTAL_PADDING,
  PAGE_TOP_PADDING,
  TAB_BOTTOM_PADDING,
} from '../../constants/layout';
export default function ResultsHistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  async function loadHistory() {
    const scans = await getScanHistory();
    setHistory(scans);
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function handleClearHistory() {
    Alert.alert(
      'Clear scan history?',
      'This will remove all saved scanned products from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearScanHistory();
            setHistory([]);
          },
        },
      ]
    );
  }
const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={[
    styles.container,
    {
      paddingTop: insets.top + 18,
      paddingBottom: 130,
    },
  ]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>
            Access products you previously scanned.
          </Text>
        </View>

        {history.length > 0 && (
          <Pressable onPress={handleClearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Once you scan a product, it will appear here with its compatibility
            score, summary, and ingredient notes.
          </Text>
        </View>
      ) : (
        history.map((item) => <HistoryCard key={item.id} item={item} />)
      )}
    </ScrollView>
  );
}

function HistoryCard({ item }: { item: ScanHistoryItem }) {
  const date = new Date(item.scannedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{item.productName}</Text>
          {!!item.brand && <Text style={styles.brand}>{item.brand}</Text>}
        </View>

        {typeof item.compatibilityScore === 'number' && (
          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>{item.compatibilityScore}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.dateText}>Scanned {date}</Text>
      <Text style={styles.summary}>{item.summary}</Text>

      <Text style={styles.ingredientsTitle}>Ingredients noted</Text>
      <Text style={styles.ingredients}>
        {item.ingredients.slice(0, 5).join(', ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  paddingHorizontal: 20,
  gap: 16,
  backgroundColor: '#FFF7F0',
  flexGrow: 1,
},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#6B7280',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B91C1C',
    paddingTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  brand: {
    marginTop: 3,
    fontSize: 14,
    color: '#6B7280',
  },
  scorePill: {
    backgroundColor: '#111827',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  ingredientsTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  ingredients: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
});