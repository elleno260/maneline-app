import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { saveScanToHistory, ScanHistoryItem } from '../../services/scanHistoryService';

export default function ScanScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [latestScan, setLatestScan] = useState<ScanHistoryItem | null>(null);

  async function handleDemoScan() {
    setIsAnalyzing(true);
    setShowPopup(true);

    // This simulates the scan pipeline for now:
    // barcode/OCR → ingredient parsing → AI compatibility summary → save history.
    setTimeout(async () => {
      const scan: ScanHistoryItem = {
        id: Date.now().toString(),
        productName: 'Sample Moisturizing Leave-In Conditioner',
        brand: 'ManeLine Demo',
        barcode: '0000000000',
        scannedAt: new Date().toISOString(),
        compatibilityScore: 86,
        summary:
          'This product looks like a strong match for moisture and softness. It may be better for wash-day styling than heavy daily use.',
        ingredients: [
          'Aloe Vera Juice',
          'Behentrimonium Methosulfate',
          'Cetyl Alcohol',
          'Glycerin',
          'Shea Butter',
        ],
        flags: [
          {
            label: 'Moisture-supporting ingredients found',
            type: 'good',
          },
          {
            label: 'Contains fatty alcohols, which can help softness',
            type: 'good',
          },
          {
            label: 'May feel heavy if overused on low-porosity hair',
            type: 'caution',
          },
        ],
      };

      await saveScanToHistory(scan);
      setLatestScan(scan);
      setIsAnalyzing(false);
    }, 1500);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan Product</Text>
      <Text style={styles.subtitle}>
        Scan a barcode or product label to analyze ingredients and save the item
        to your scan history.
      </Text>

      <View style={styles.scanBox}>
        <Text style={styles.scanIcon}>▢</Text>
        <Text style={styles.scanText}>Camera scanner will go here</Text>
        <Text style={styles.scanSubtext}>
          For now, use demo scan to test the flow.
        </Text>
      </View>

      <Pressable style={styles.button} onPress={handleDemoScan}>
        <Text style={styles.buttonText}>Demo Scan Product</Text>
      </Pressable>

      <Modal visible={showPopup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {isAnalyzing ? (
              <>
                <Text style={styles.modalTitle}>Analyzing product...</Text>
                <Text style={styles.modalText}>
                  Checking ingredients, matching your hair profile, and saving
                  this scan.
                </Text>
              </>
            ) : latestScan ? (
              <>
                <Text style={styles.modalTitle}>{latestScan.productName}</Text>
                <Text style={styles.score}>
                  Compatibility: {latestScan.compatibilityScore}%
                </Text>
                <Text style={styles.modalText}>{latestScan.summary}</Text>

                <Text style={styles.sectionTitle}>Quick ingredient notes</Text>

                {latestScan.flags.map((flag, index) => (
                  <View key={index} style={styles.flagRow}>
                    <Text style={styles.flagDot}>
                      {flag.type === 'good'
                        ? '✓'
                        : flag.type === 'caution'
                        ? '!'
                        : '•'}
                    </Text>
                    <Text style={styles.flagText}>{flag.label}</Text>
                  </View>
                ))}

                <Pressable
                  style={styles.button}
                  onPress={() => setShowPopup(false)}
                >
                  <Text style={styles.buttonText}>Done</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
    backgroundColor: '#FFF7F0',
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  scanBox: {
    height: 300,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#111827',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  scanIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  scanText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scanSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  flagRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  flagDot: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    width: 18,
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
});