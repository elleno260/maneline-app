import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PAGE_HORIZONTAL_PADDING,
  PAGE_TOP_PADDING,
  TAB_BOTTOM_PADDING,
} from '../../constants/layout';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Category = {
  id: string;
  label: string;
  icon: IconName;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  matchScore: number;
  emoji: string;
  bestFor: string[];
  tags: string[];
  routineMatch: string;
  summary: string;
  ingredients: string[];
  cautions?: string[];
  buyUrl?: string;
};

const categories: Category[] = [
  { id: 'All', label: 'All', icon: 'sparkles-outline' },
  { id: 'Moisture', label: 'Moisture', icon: 'water-outline' },
  { id: 'Scalp', label: 'Scalp', icon: 'leaf-outline' },
  { id: 'Repair', label: 'Repair', icon: 'bandage-outline' },
  { id: 'Styling', label: 'Styling', icon: 'brush-outline' },
  { id: 'Growth', label: 'Growth', icon: 'flower-outline' },
  { id: 'Clean', label: 'Clean', icon: 'shield-checkmark-outline' },
];

const products: Product[] = [
  {
    id: '1',
    name: 'Hydra Cloud Leave-In Conditioner',
    brand: 'ManeLine Picks',
    category: 'Moisture',
    price: '$14.99',
    matchScore: 94,
    emoji: '💧',
    bestFor: ['Low porosity', 'Dryness', 'Softness'],
    tags: ['lightweight', 'hydrating', 'wash day'],
    routineMatch: 'Best after shampooing and deep conditioning.',
    summary:
      'A lightweight leave-in option made for moisture without leaving the hair feeling too coated or heavy.',
    ingredients: ['Aloe Vera', 'Glycerin', 'Cetyl Alcohol', 'Panthenol'],
    cautions: ['Use a small amount first if your hair gets buildup easily.'],
    buyUrl: 'https://www.google.com/search?q=leave+in+conditioner+for+low+porosity+hair',
  },
  {
    id: '2',
    name: 'Scalp Reset Clarifying Shampoo',
    brand: 'Root Theory',
    category: 'Scalp',
    price: '$18.00',
    matchScore: 88,
    emoji: '🌿',
    bestFor: ['Buildup', 'Itchy scalp', 'Product reset'],
    tags: ['clarifying', 'scalp care', 'reset'],
    routineMatch: 'Use once or twice a month before deep conditioning.',
    summary:
      'A clarifying shampoo option for users who use gels, oils, creams, or edge control often.',
    ingredients: ['Tea Tree Water', 'Cocamidopropyl Betaine', 'Aloe Vera'],
    cautions: ['Do not overuse if your hair is already dry.'],
    buyUrl: 'https://www.google.com/search?q=clarifying+shampoo+for+natural+hair',
  },
  {
    id: '3',
    name: 'Bond Bloom Repair Mask',
    brand: 'Crown Lab',
    category: 'Repair',
    price: '$22.50',
    matchScore: 82,
    emoji: '🧬',
    bestFor: ['Breakage', 'Color-treated hair', 'Strength'],
    tags: ['repair', 'mask', 'bond support'],
    routineMatch: 'Use when your hair feels weak, limp, or over-manipulated.',
    summary:
      'A strengthening treatment designed for hair that needs repair support after heat, color, or protective styling.',
    ingredients: ['Hydrolyzed Protein', 'Amino Acids', 'Avocado Oil'],
    cautions: ['May be too protein-heavy for users who are protein sensitive.'],
    buyUrl: 'https://www.google.com/search?q=hair+repair+mask+bond+treatment',
  },
  {
    id: '4',
    name: 'Soft Hold Curl Gel',
    brand: 'Pattern Room',
    category: 'Styling',
    price: '$12.99',
    matchScore: 79,
    emoji: '🌀',
    bestFor: ['Definition', 'Twist outs', 'Wash and go'],
    tags: ['gel', 'definition', 'soft hold'],
    routineMatch: 'Apply after leave-in conditioner on damp hair.',
    summary:
      'A styling gel with flexible hold for definition without an overly crunchy finish.',
    ingredients: ['Flaxseed Extract', 'Aloe Vera', 'PVP'],
    cautions: ['Layer carefully with creams to avoid flakes.'],
    buyUrl: 'https://www.google.com/search?q=soft+hold+curl+gel',
  },
  {
    id: '5',
    name: 'Clean Cream Daily Moisturizer',
    brand: 'Every Strand',
    category: 'Clean',
    price: '$16.00',
    matchScore: 91,
    emoji: '🤍',
    bestFor: ['Daily moisture', 'Clean beauty', 'Simple routines'],
    tags: ['clean', 'daily', 'moisturizer'],
    routineMatch: 'Use between wash days when hair feels dry.',
    summary:
      'A simple moisturizer for people who want fewer harsh ingredients and an easier daily routine.',
    ingredients: ['Water', 'Shea Butter', 'Aloe Vera', 'Jojoba Oil'],
    cautions: ['May feel heavy for very fine hair if over-applied.'],
    buyUrl: 'https://www.google.com/search?q=clean+hair+moisturizer',
  },
  {
    id: '6',
    name: 'Length Care Scalp Oil',
    brand: 'Root Ritual',
    category: 'Growth',
    price: '$13.50',
    matchScore: 85,
    emoji: '🌱',
    bestFor: ['Scalp massage', 'Length retention', 'Protective styles'],
    tags: ['oil', 'scalp', 'growth routine'],
    routineMatch: 'Use lightly on scalp 2–3 times per week.',
    summary:
      'A scalp oil option that fits into a length-retention routine, especially during protective styles.',
    ingredients: ['Jojoba Oil', 'Rosemary Oil', 'Peppermint Oil'],
    cautions: ['Patch test first if your scalp is sensitive.'],
    buyUrl: 'https://www.google.com/search?q=scalp+oil+for+hair+growth',
  },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [savedProducts, setSavedProducts] = useState<Record<string, boolean>>(
    {}
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
        product.bestFor.some((item) =>
          item.toLowerCase().includes(normalizedQuery)
        );

      return matchesCategory && matchesSearch;
    });
  }, [query, selectedCategory]);

  function toggleSave(productId: string) {
    setSavedProducts((current) => ({
      ...current,
      [productId]: !current[productId],
    }));
  }

  async function handleShop(product: Product) {
    if (!product.buyUrl) return;

    const canOpen = await Linking.canOpenURL(product.buyUrl);

    if (canOpen) {
      await Linking.openURL(product.buyUrl);
    }
  }
const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
contentContainerStyle={[
  styles.listContent,
  {
    paddingTop: insets.top + PAGE_TOP_PADDING,
    paddingBottom: TAB_BOTTOM_PADDING,
  },
]}        
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>ManeLine Marketplace</Text>
              <Text style={styles.title}>Find products that fit your routine</Text>
              <Text style={styles.subtitle}>
                Search by goal, ingredient need, product type, or hair concern.
              </Text>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search moisture, scalp, gel, repair..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />

              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {categories.map((category) => {
                const isActive = selectedCategory === category.id;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[
                      styles.categoryPill,
                      isActive && styles.categoryPillActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        isActive && styles.categoryIconWrapActive,
                      ]}
                    >
                      <Ionicons
                        name={category.icon}
                        size={20}
                        color={isActive ? '#FFFFFF' : '#111827'}
                      />
                    </View>

                    <Text
                      style={[
                        styles.categoryText,
                        isActive && styles.categoryTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="sparkles" size={22} color="#FFFFFF" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>Routine-based discovery</Text>
                <Text style={styles.featureText}>
                  This will eventually recommend products based on your hair
                  profile, scan history, and saved routine.
                </Text>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'All'
                  ? 'Recommended products'
                  : `${selectedCategory} products`}
              </Text>

              <Text style={styles.resultCount}>
                {filteredProducts.length} found
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isSaved = !!savedProducts[item.id];

          return (
            <Pressable
              style={styles.productCard}
              onPress={() => setSelectedProduct(item)}
            >
              <View style={styles.productTop}>
                <View style={styles.productImage}>
                  <Text style={styles.productEmoji}>{item.emoji}</Text>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.brand}>{item.brand}</Text>
                  <Text style={styles.productName}>{item.name}</Text>

                  <View style={styles.tagRow}>
                    {item.bestFor.slice(0, 2).map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Pressable
                  onPress={() => toggleSave(item.id)}
                  hitSlop={10}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={23}
                    color={isSaved ? '#E11D48' : '#111827'}
                  />
                </Pressable>
              </View>

              <Text style={styles.summary}>{item.summary}</Text>

              <View style={styles.cardBottom}>
                <View style={styles.matchPill}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.matchText}>{item.matchScore}% match</Text>
                </View>

                <Text style={styles.price}>{item.price}</Text>

                <Pressable
                  style={styles.shopButton}
                  onPress={() => handleShop(item)}
                >
                  <Ionicons name="bag-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.shopText}>Shop</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={34} color="#6B7280" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              Try searching for moisture, scalp, repair, gel, clean, or growth.
            </Text>
          </View>
        }
      />

      <ProductDetailModal
        product={selectedProduct}
        isSaved={selectedProduct ? !!savedProducts[selectedProduct.id] : false}
        onClose={() => setSelectedProduct(null)}
        onSave={() => {
          if (selectedProduct) toggleSave(selectedProduct.id);
        }}
        onShop={() => {
          if (selectedProduct) handleShop(selectedProduct);
        }}
      />
    </View>
  );
}

function ProductDetailModal({
  product,
  isSaved,
  onClose,
  onSave,
  onShop,
}: {
  product: Product | null;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
  onShop: () => void;
}) {
  if (!product) return null;

  return (
    <Modal visible={!!product} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalImage}>
              <Text style={styles.modalEmoji}>{product.emoji}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalBrand}>{product.brand}</Text>
              <Text style={styles.modalTitle}>{product.name}</Text>
              <Text style={styles.modalPrice}>{product.price}</Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.modalScoreRow}>
            <View style={styles.modalScorePill}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.modalScoreText}>
                {product.matchScore}% routine match
              </Text>
            </View>
          </View>

          <Text style={styles.modalSectionTitle}>Why it fits</Text>
          <Text style={styles.modalBody}>{product.summary}</Text>

          <Text style={styles.modalSectionTitle}>Routine match</Text>
          <Text style={styles.modalBody}>{product.routineMatch}</Text>

          <Text style={styles.modalSectionTitle}>Key ingredients</Text>
          <View style={styles.ingredientWrap}>
            {product.ingredients.map((ingredient) => (
              <View key={ingredient} style={styles.ingredientChip}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>

          {!!product.cautions?.length && (
            <>
              <Text style={styles.modalSectionTitle}>Cautions</Text>
              {product.cautions.map((caution) => (
                <View key={caution} style={styles.cautionRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#92400E"
                  />
                  <Text style={styles.cautionText}>{caution}</Text>
                </View>
              ))}
            </>
          )}

          <View style={styles.modalActions}>
            <Pressable style={styles.secondaryButton} onPress={onSave}>
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={18}
                color="#111827"
              />
              <Text style={styles.secondaryButtonText}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>

            <Pressable style={styles.primaryButton} onPress={onShop}>
              <Ionicons name="bag-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Shop product</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF7F0',
  },
  listContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  categoryRow: {
    gap: 12,
    paddingBottom: 18,
  },
  categoryPill: {
    width: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  categoryPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7F0',
  },
  categoryIconWrapActive: {
    backgroundColor: '#D97706',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  featureCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 22,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#E5E7EB',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 3,
  },
  productName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 22,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7F0',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  summary: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  cardBottom: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  matchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
    marginLeft: 'auto',
  },
  shopButton: {
    backgroundColor: '#D97706',
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shopText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3D5C0',
    marginTop: 20,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    paddingBottom: 34,
    maxHeight: '88%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  modalImage: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 36,
  },
  modalBrand: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    marginBottom: 3,
  },
  modalTitle: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    color: '#111827',
  },
  modalPrice: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  modalScoreRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  modalScorePill: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalScoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  modalSectionTitle: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  ingredientWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    backgroundColor: '#FFF7F0',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F3D5C0',
  },
  ingredientText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  cautionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cautionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#92400E',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  primaryButton: {
    flex: 1.4,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});