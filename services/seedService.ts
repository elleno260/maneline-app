import { seedProductCatalogToFirestore } from '../services/productFirebaseService';

export async function seedDemoProducts() {
  const count = await seedProductCatalogToFirestore();
  console.log(`Seeded ${count} products to Firestore.`);
  return count;
}