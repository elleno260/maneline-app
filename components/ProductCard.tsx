import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import MatchBadge from "./MatchBadge";
import { COLORS } from "../constants/colors";
import type {
  HairProduct as Product,
} from '../types/product.types';
type Props = {
  product: Product;
  variant?: "light" | "dark";
  onPress?: () => void;
};

export default function ProductCard({
  product,
  variant = "light",
  onPress,
}: Props) {
  const isDark = variant === "dark";

  return (
    <Pressable
      style={[styles.card, isDark && styles.darkCard]}
      onPress={onPress}
    >
      <View style={styles.imageWrapper}>
      <View style={styles.productImage}>
  <Text style={styles.productEmoji}>
    {product.imageEmoji ?? '🧴'}
  </Text>
</View>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.name, isDark && styles.darkText]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        <Text style={[styles.brand, isDark && styles.darkText]}>
          {product.brand}
        </Text>

        {/* <MatchBadge label={compatibility.label} /> */}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 128,
    height: 176,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C0C0C0",
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  darkCard: {
    width: 154,
    height: 181,
    backgroundColor: COLORS.brown,
  },
  imageWrapper: {
    height: 96,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 88,
    height: 84,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  info: {
    paddingHorizontal: 8,
    paddingTop: 7,
  },
  name: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 13,
  },
  brand: {
    fontSize: 11,
    color: COLORS.black,
    marginBottom: 5,
  },
  darkText: {
    color: COLORS.white,
    fontSize: 14,
  },
  productEmoji: {
  fontSize: 32,
},
productImage: {
  width: '100%',
  height: 150,
  backgroundColor: '#FFF7F0',
  alignItems: 'center',
  justifyContent: 'center',
},
});