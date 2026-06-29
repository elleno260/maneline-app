import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useHairProfile } from "../../context/HairProfileContext";
import { useState } from "react";

const categories = ["All", "Shampoo", "Conditioner", "Leave– In"];

const trendingProducts = [
  {
    id: "1",
    name: "Butter Cream Daily Moisturizer",
    brand: "TGIN",
    match: "Great Match",
    category: "Leave-In",
    image: "https://m.media-amazon.com/images/I/71f0Jbt3vDL.jpg",
  },
  {
    id: "2",
    name: "Curl Defining Jelly",
    brand: "Camille Rose",
    match: "Great Match",
    category: "Leave-In",
    image: "https://m.media-amazon.com/images/I/61Ue1n7u6JL.jpg",
  },
  {
    id: "3",
    name: "Bond Maintenance Clarifying Shampoo",
    brand: "Olaplex N°4",
    match: "Great Match",
    category: "Shampoo",
    image: "https://m.media-amazon.com/images/I/51V0zZvcqNL.jpg",
  },
  {
    id: "4",
    name: "Styling Cream",
    brand: "PATTERN",
    match: "Great Match",
    category: "Leave-In",
    image: "https://m.media-amazon.com/images/I/71QSZBKyEQL.jpg",
  },
];

const budgetPicks = [
  {
    id: "1",
    name: "Eco Style Gel",
    brand: "Eco Styler",
    price: "Under $5",
    rating: "Great",
  },
  {
    id: "2",
    name: "Raw Shea Butter",
    brand: "Generic",
    price: "Under $5",
    rating: "Great",
  },
];

export default function SearchScreen() {
  const { hairProfile } = useHairProfile();
const [activeCategory, setActiveCategory] = useState("All");

const categories = ["All", "Shampoo", "Conditioner", "Leave-In"];

const filteredProducts =
  activeCategory === "All"
    ? trendingProducts
    : trendingProducts.filter(
        (product) => product.category === activeCategory
      );
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
             Curated for {hairProfile.hairType} | {hairProfile.porosity} Porosity
              </Text>      
                </View>

       <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.categoryRow}
>
  {categories.map((category) => {
    const isActive = activeCategory === category;

    return (
      <Pressable
        key={category}
        style={[
          styles.categoryPill,
          isActive && styles.activeCategoryPill,
        ]}
        onPress={() => setActiveCategory(category)}
      >
        <Text
          style={[
            styles.categoryText,
            isActive && styles.activeCategoryText,
          ]}
        >
          {category}
        </Text>
      </Pressable>
    );
  })}
</ScrollView>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>TRENDING IN 4C HAIR</Text>

          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImageWrapper}>
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>

                  <View
                    style={[
                      styles.matchBadge,
                      product.id === "4" && styles.lightMatchBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchText,
                        product.id === "4" && styles.lightMatchText,
                      ]}
                    >
                      {product.match}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.budgetTitle}>Budget Friendly Picks</Text>

          {budgetPicks.map((item) => (
            <View key={item.id} style={styles.budgetRow}>
              <View style={styles.moneyIcon}>
                <Text style={styles.moneyIconText}>$</Text>
              </View>

              <View style={styles.budgetTextContainer}>
                <Text style={styles.budgetName}>{item.name}</Text>

                <View style={styles.budgetMetaRow}>
                  <Text style={styles.budgetBrand}>{item.brand}</Text>
                  <Text style={styles.budgetPrice}>{item.price}</Text>
                </View>
              </View>

              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8BD",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FDF9E4",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    height: 132,
    backgroundColor: "#FFF8BD",
    justifyContent: "flex-end",
    paddingHorizontal: 19,
    paddingBottom: 17,
  },
  title: {
    fontSize: 30,
    color: "#3B251A",
    fontWeight: "500",
    fontFamily: "serif",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: "#3B251A",
  },
  categoryRow: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 10,
    gap: 12,
  },
  categoryPill: {
    height: 21,
    minWidth: 76,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCategoryPill: {
    backgroundColor: "#3B251A",
    borderColor: "#3B251A",
    minWidth: 58,
  },
  categoryText: {
    fontSize: 12,
    color: "#3B251A",
    fontWeight: "500",
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 26,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3B251A",
    marginBottom: 7,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 25,
    marginBottom: 34,
  },
  productCard: {
    width: 154,
    height: 181,
    borderRadius: 12,
    backgroundColor: "#3B251A",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  productImageWrapper: {
    height: 94,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: 88,
    height: 82,
  },
  productInfo: {
    paddingHorizontal: 10,
    paddingTop: 7,
  },
  productName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 17,
  },
  productBrand: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 2,
    marginBottom: 8,
  },
  matchBadge: {
    backgroundColor: "#D8F7B8",
    borderWidth: 1,
    borderColor: "#9AC879",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  lightMatchBadge: {
    backgroundColor: "#FFF8BD",
    borderColor: "#E1D67A",
  },
  matchText: {
    color: "#4E962B",
    fontSize: 11,
    fontWeight: "700",
  },
  lightMatchText: {
    color: "#9A8A25",
  },
  budgetTitle: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "400",
    marginBottom: 14,
    marginLeft: -10,
  },
  budgetRow: {
    minHeight: 57,
    borderBottomWidth: 1,
    borderBottomColor: "#BDBDBD",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginLeft: -16,
    marginRight: -6,
  },
  moneyIcon: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  moneyIconText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  budgetTextContainer: {
    flex: 1,
  },
  budgetName: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "900",
  },
  budgetMetaRow: {
    flexDirection: "row",
    gap: 17,
  },
  budgetBrand: {
    fontSize: 14,
    color: "#000000",
  },
  budgetPrice: {
    fontSize: 14,
    color: "#000000",
  },
  ratingBadge: {
    width: 77,
    height: 23,
    borderRadius: 20,
    backgroundColor: "#D6F0B8",
    borderWidth: 1,
    borderColor: "#9AC879",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingText: {
    fontSize: 13,
    color: "#4E962B",
    fontWeight: "600",
  },
});