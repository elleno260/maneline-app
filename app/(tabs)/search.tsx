import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import {ActivityIndicator,FlatList,Linking,Modal,Pressable,ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {getUserHairProfileOrNull,  UserHairProfile,} from '../../services/profileFirebaseService';
import { getProductRecommendations,  ProductRecommendation,} from '../../services/productRecommendationService';
import type { HairProfileForMatching,} from '../../types/product.types';
type IconName = ComponentProps<typeof Ionicons>['name'];

const categories = [
  'All',
  'Shampoo',
  'Conditioner',
  'Deep Conditioner',
  'Leave-In',
  'Cream',
  'Gel',
  'Oil',
  'Scalp Care',
  'Treatment',
  'Styler',
];

const fallbackProfile: UserHairProfile = {
  displayName: 'Ellen',
  email: 'ellen@example.com',
  hairType: '4C',
  porosity: 'Low',
  density: 'Fine',
  scalp: 'Dry',
  goals: ['Moisture', 'Length retention', 'Growth', 'Thickness'],
  allergies: '',
  routineFocus:
    'Moisture-first routine with lightweight products and buildup control.',
  routineCompatibilityScore: 91,
  routineSteps: [
    {
      id: 'cleanse',
      title: 'Cleanse',
      frequency: 'Every 7–10 days',
      productType: 'Gentle shampoo or clarifying shampoo as needed',
      note: 'Focus on removing buildup without stripping your hair.',
    },
    {
      id: 'leave-in',
      title: 'Leave-in',
      frequency: 'After every wash',
      productType: 'Lightweight leave-in conditioner',
      note: 'Apply in sections so the product distributes evenly.',
    },
  ],
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();

  const [queryText, setQueryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<ProductRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

const loadRecommendations = useCallback(async () => {
  setLoading(true);

  try {
    const savedProfile =
      await getUserHairProfileOrNull();

    const profile: HairProfileForMatching =
      savedProfile ?? fallbackProfile;

    const rankedProducts =
      await getProductRecommendations(profile, {
        category: selectedCategory,
        query: queryText,
      });

    setRecommendations(rankedProducts);
  } catch (error) {
    console.warn(
      'Could not load product recommendations:',
      error
    );

    setRecommendations([]);
  } finally {
    setLoading(false);
  }
}, [queryText, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [loadRecommendations])
  );

  function openProductLink(url?: string) {
    if (!url) return;
    Linking.openURL(url);
  }

  function renderProductCard({ item }: { item: ProductRecommendation }) {
    const { product, compatibility } = item;

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => setSelectedRecommendation(item)}
      >
        <View style={styles.productTopRow}>
          <View style={styles.productEmoji}>
            <Text style={styles.productEmojiText}>
              {product.imageEmoji ?? '🧴'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.category}>{product.category}</Text>
          </View>

          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>{compatibility.score}%</Text>
          </View>
        </View>

        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>{compatibility.label}</Text>
          <Text style={styles.reasonText}>
            {compatibility.reasons[0] ?? compatibility.summary}
          </Text>
        </View>

        <View style={styles.tagRow}>
          {product.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.product.id}
        renderItem={renderProductCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 140,
          },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Product Library</Text>
              <Text style={styles.title}>Find products that match you.</Text>
              <Text style={styles.subtitle}>
                ManeLine ranks products using your hair profile, goals, routine,
                and ingredient fit.
              </Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                value={queryText}
                onChangeText={setQueryText}
                placeholder="Search products, ingredients, or goals"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for you</Text>
              <Text style={styles.sectionSubtitle}>
                Ranked by compatibility score
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color="#111827" />
                <Text style={styles.loadingText}>Ranking products...</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bag-handle-outline" size={34} color="#111827" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                Try another category or search term. As your product catalog
                grows, ManeLine will have more matches to compare.
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={!!selectedRecommendation}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRecommendation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedRecommendation ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalEmoji}>
                    {selectedRecommendation.product.imageEmoji ?? '🧴'}
                  </Text>

                  <Pressable
                    onPress={() => setSelectedRecommendation(null)}
                    hitSlop={10}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </Pressable>
                </View>

                <Text style={styles.modalBrand}>
                  {selectedRecommendation.product.brand}
                </Text>
                <Text style={styles.modalTitle}>
                  {selectedRecommendation.product.name}
                </Text>

                <View style={styles.modalScore}>
                  <Text style={styles.modalScoreText}>
                    {selectedRecommendation.compatibility.score}% match
                  </Text>
                  <Text style={styles.modalScoreLabel}>
                    {selectedRecommendation.compatibility.label}
                  </Text>
                </View>

                <Text style={styles.modalSectionTitle}>Why it matches</Text>
                {selectedRecommendation.compatibility.reasons.map((reason) => (
                  <Text key={reason} style={styles.bulletText}>
                    • {reason}
                  </Text>
                ))}

                {selectedRecommendation.compatibility.cautions.length > 0 ? (
                  <>
                    <Text style={styles.modalSectionTitle}>Watch out for</Text>
                    {selectedRecommendation.compatibility.cautions.map(
                      (caution) => (
                        <Text key={caution} style={styles.bulletText}>
                          • {caution}
                        </Text>
                      )
                    )}
                  </>
                ) : null}

                <Text style={styles.modalSectionTitle}>Routine fit</Text>
                <Text style={styles.modalBodyText}>
                  {selectedRecommendation.compatibility.routineFit}
                </Text>

                <Pressable
                  style={styles.buyButton}
                  onPress={() =>
                    openProductLink(selectedRecommendation.product.buyUrl)
                  }
                >
                  <Text style={styles.buyButtonText}>View product</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  listContent: {
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
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  categoryRow: {
    paddingVertical: 16,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  categoryChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryChipText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginBottom: 14,
  },
  loadingText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmojiText: {
    fontSize: 28,
  },
  brand: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  productName: {
    marginTop: 3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: '#111827',
  },
  category: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },
  scorePill: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  description: {
    marginTop: 13,
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  reasonBox: {
    marginTop: 13,
    backgroundColor: '#FFF7F0',
    borderRadius: 18,
    padding: 13,
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  reasonText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 13,
  },
  tag: {
    backgroundColor: '#F3D5C0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  emptyText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF7F0',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 22,
    maxHeight: '86%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 42,
  },
  modalBrand: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  modalTitle: {
    marginTop: 4,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    color: '#111827',
  },
  modalScore: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 16,
  },
  modalScoreText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  modalScoreLabel: {
    marginTop: 3,
    color: '#FBBF24',
    fontWeight: '900',
  },
  modalSectionTitle: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
    marginBottom: 4,
  },
  modalBodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  buyButton: {
    marginTop: 20,
    backgroundColor: '#D97706',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});