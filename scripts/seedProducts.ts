import fs from 'fs';
import path from 'path';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { productCatalog } from '../data/productCatalog';

const serviceAccountPath = path.resolve(
  process.cwd(),
  'serviceAccountKey.json'
);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    'Missing serviceAccountKey.json. Add it to your project root and make sure it is in .gitignore.'
  );
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

function getProductDocumentId(product: {
  id: string;
  barcodes?: string[];
}) {
  const firstBarcode = product.barcodes?.[0];

  if (firstBarcode && firstBarcode.trim().length > 0) {
    return firstBarcode.trim();
  }

  return product.id;
}

async function seedProducts() {
  console.log('Starting product seed...');
  console.log(`Found ${productCatalog.length} products.`);

  let successCount = 0;

  for (const product of productCatalog) {
    const documentId = getProductDocumentId(product);

    const productPayload = {
      ...product,
      id: documentId,
      updatedAt: FieldValue.serverTimestamp(),
      createdFromSeed: true,
    };

    await db.collection('products').doc(documentId).set(productPayload, {
      merge: true,
    });

    successCount += 1;

    console.log(
      `Uploaded ${successCount}/${productCatalog.length}: ${product.brand} - ${product.name}`
    );
  }

  console.log(`Done. Uploaded ${successCount} products to Firestore.`);
}

seedProducts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });