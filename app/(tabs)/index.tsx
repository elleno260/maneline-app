import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Link } from "expo-router";
import { recommendedProducts } from "../../data/products";
import ProductCard from "../../components/ProductCard";

{recommendedProducts.map((product) => (
  <ProductCard key={product.id} product={product} />
))}

export default function HomeScreen() {
    const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.circleAccent} />

          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.welcomeText}>Welcome back, Ellen</Text>

          <View style={styles.hairBadge}>
            <Ionicons name="star" size={17} color="#BFD3F2" />
            <Text style={styles.hairBadgeText}>4c | Low Porosity | Fine</Text>
          </View>
        </View>

        <View style={styles.content}>
         <Link href="/(tabs)/scan" asChild>
  <Pressable style={styles.scanCard}>
    <View>
      <Text style={styles.scanTitle}>Scan a Product</Text>
      <Text style={styles.scanSubtitle}>Tap to analyze Ingredients</Text>
    </View>

    <View style={styles.cameraCircle}>
      <Ionicons name="camera" size={31} color="#000000" />
    </View>
  </Pressable>
</Link>

          <Text style={styles.sectionLabel}>DAILY TIP</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Low Porosity Hair Tip</Text>
            <Text style={styles.tipText}>
              Apply products to damp hair with heat to help open the cuticle and
              allow moisture to penetrate more effectively.
            </Text>
          </View>

          <Text style={styles.recommendedTitle}>RECOMMENDED FOR YOU</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {recommendedProducts.map((product) => (
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
                      product.match.toString() === "Okay Match" && styles.okayMatchBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchText,
                        product.match.toString() === "Okay Match" && styles.okayMatchText,
                      ]}
                    >
                      {product.match}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1D314F",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FDF9E4",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    height: 197,
    backgroundColor: "#1D314F",
    paddingHorizontal: 15,
    paddingTop: 78,
    position: "relative",
    overflow: "hidden",
  },
  circleAccent: {
    width: 145,
    height: 145,
    borderRadius: 72.5,
    backgroundColor: "#455B7C",
    position: "absolute",
    right: -15,
    top: -2,
  },
  greeting: {
    color: "#D7E2F3",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  welcomeText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    marginBottom: 9,
  },
  hairBadge: {
    backgroundColor: "#3F5A82",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
  },
  hairBadgeText: {
    color: "#C4D6F2",
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  scanCard: {
    height: 78,
    backgroundColor: "#3B251A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#140B07",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  scanTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  scanSubtitle: {
    color: "#D8C4BC",
    fontSize: 15,
    fontWeight: "500",
  },
  cameraCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF8BD",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#33261F",
    marginBottom: 6,
  },
  tipCard: {
    backgroundColor: "#FFF8BD",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 72,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tipTitle: {
    color: "#3B251A",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  tipText: {
    color: "#000000",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
  recommendedTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#33261F",
    marginBottom: 8,
  },
  productScroll: {
    paddingRight: 30,
    gap: 19,
  },
  productCard: {
    width: 128,
    height: 176,
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C0C0C0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  productImageWrapper: {
    height: 103,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: 82,
    height: 90,
  },
  productInfo: {
    paddingHorizontal: 7,
    paddingTop: 7,
  },
  productName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    lineHeight: 12,
  },
  productBrand: {
    fontSize: 11,
    color: "#000000",
    marginBottom: 4,
  },
  matchBadge: {
    backgroundColor: "#CFF1B2",
    borderWidth: 1,
    borderColor: "#83B75C",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  okayMatchBadge: {
    backgroundColor: "#FFF1A8",
    borderColor: "#E3BF33",
  },
  matchText: {
    color: "#438D25",
    fontSize: 10,
    fontWeight: "600",
  },
  okayMatchText: {
    color: "#B8860B",
  },
});