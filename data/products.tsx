export type ProductMatch = "Great Match" | "Good" | "Okay" | "Avoid";

export type Product = {
  id: string;
  name: string;
  brand: string;
  match: ProductMatch;
  image?: string;
  category?: string;
  price?: string;
};

export const recommendedProducts: Product[] = [
  {
    id: "1",
    name: "Jamaican Black Castor Oil Shampoo",
    brand: "SheaMoisture",
    match: "Great Match",
    image: "https://m.media-amazon.com/images/I/71yE2m9TEKL.jpg",
    category: "Shampoo",
  },
  {
    id: "2",
    name: "Moroccan Pear Conditioning Custard",
    brand: "Camille Rose",
    match: "Great Match",
    image: "https://m.media-amazon.com/images/I/61Ue1n7u6JL.jpg",
    category: "Styler",
  },
  {
    id: "3",
    name: "Curl Hydrating Product",
    brand: "Alafia",
    match: "Okay",
    image: "https://m.media-amazon.com/images/I/71QSZBKyEQL.jpg",
    category: "Moisturizer",
  },
];

export const recentlyScannedProducts: Product[] = [
  {
    id: "1",
    name: "Curl Defining Jelly",
    brand: "Camille Rose",
    match: "Great Match",
    image: "https://m.media-amazon.com/images/I/61Ue1n7u6JL.jpg",
  },
  {
    id: "2",
    name: "Moisture Retention Shampoo",
    brand: "SheaMoisture",
    match: "Good",
    image: "https://m.media-amazon.com/images/I/71yE2m9TEKL.jpg",
  },
  {
    id: "3",
    name: "Scalp Serum",
    brand: "The Ordinary",
    match: "Okay",
    image: "https://m.media-amazon.com/images/I/51jyIJw7lvL.jpg",
  },
];

export const trendingProducts: Product[] = [
  {
    id: "1",
    name: "Butter Cream Daily Moisturizer",
    brand: "TGIN",
    match: "Great Match",
    image: "https://m.media-amazon.com/images/I/71f0Jbt3vDL.jpg",
    category: "Leave-In",
  },
  {
    id: "2",
    name: "Curl Defining Jelly",
    brand: "Camille Rose",
    match: "Great Match",
    image: "https://m.media-amazon.com/images/I/61Ue1n7u6JL.jpg",
    category: "Styler",
  },
  {
    id: "3",
    name: "Bond Maintenance Clarifying Shampoo",
    brand: "Olaplex N°4",
    match: "Great Match",
    image: "https://m.media-amazon.com/images/I/51V0zZvcqNL.jpg",
    category: "Shampoo",
  },
  {
    id: "4",
    name: "Styling Cream",
    brand: "PATTERN",
    match: "Great Match",
    image: "https://m.media-amazon.com/images/I/71QSZBKyEQL.jpg",
    category: "Styler",
  },
];

export const budgetPicks: Product[] = [
  {
    id: "1",
    name: "Eco Style Gel",
    brand: "Eco Styler",
    match: "Great Match",
    price: "Under $5",
  },
  {
    id: "2",
    name: "Raw Shea Butter",
    brand: "Generic",
    match: "Great Match",
    price: "Under $5",
  },
];

export const resultProduct = {
  id: "1",
  name: "Curl Defining Jelly",
  brand: "Camille Rose",
  match: "Great Match",
  score: 92,
  image: "https://m.media-amazon.com/images/I/61Ue1n7u6JL.jpg",
  targets: ["Moisture", "Length Retention", "Growth"],
  ingredients: [
    {
      name: "Aloe Barbadensis Leaf Juice",
      description: "Natural moisturizer that hydrates and soothes the scalp.",
    },
    {
      name: "Shea Butter",
      description:
        "Rich emollient that seals in moisture. Excellent for high porosity and coily hair.",
    },
    {
      name: "Glycerin",
      description: "Draws moisture from air into the hair shaft.",
    },
    {
      name: "Cetyl Alcohol",
      description:
        "A fatty alcohol — conditioning, not drying. Safe for most hair types.",
    },
    {
      name: "Fragrance",
      description: "Synthetic fragrance. May irritate sensitive scalps.",
    },
  ],
};