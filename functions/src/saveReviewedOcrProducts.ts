import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  getApps,
  initializeApp,
} from 'firebase-admin/app';

import {
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';

const app =
  getApps().length === 0
    ? initializeApp()
    : getApps()[0];

const db =
  getFirestore(app);

/* =========================================================
   HELPERS
   ========================================================= */

function cleanBarcode(
  value: unknown
): string {
  return String(
    value ?? ''
  ).replace(/\D/g, '');
}

function cleanString(
  value: unknown
): string {
  return typeof value ===
    'string'
    ? value.trim()
    : '';
}

function cleanArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) =>
          String(item)
            .trim()
        )
        .filter(Boolean)
    )
  );
}

/* =========================================================
   FUNCTION
   ========================================================= */

export const saveReviewedOcrProduct =
  onCall(
    {
      region:
        'us-central1',

      timeoutSeconds: 30,

      memory:
        '256MiB',
    },

    async (request) => {
      /* ---------------------------------------------------
         REQUIRE AUTH
         --------------------------------------------------- */

      if (!request.auth) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in to save product data.'
        );
      }

      const barcode =
        cleanBarcode(
          request.data?.barcode
        );

      if (
        ![
          8,
          12,
          13,
          14,
        ].includes(
          barcode.length
        )
      ) {
        throw new HttpsError(
          'invalid-argument',
          'A valid barcode is required.'
        );
      }

      const product =
        request.data?.product;

      if (
        !product ||
        typeof product !==
          'object'
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Product information is required.'
        );
      }

      const ingredients =
        cleanArray(
          request.data
            ?.ingredients
        );

      if (
        ingredients.length ===
        0
      ) {
        throw new HttpsError(
          'invalid-argument',
          'At least one reviewed ingredient is required.'
        );
      }

      const ingredientsText =
        cleanString(
          request.data
            ?.ingredientsText
        ) ||
        ingredients.join(
          ', '
        );

      const productRef =
        db
          .collection(
            'products'
          )
          .doc(barcode);

      /* ---------------------------------------------------
         DON'T OVERWRITE AN EXISTING INGREDIENT LIST
         --------------------------------------------------- */

      const existingSnapshot =
        await productRef.get();

      if (
        existingSnapshot.exists
      ) {
        const existing =
          existingSnapshot.data() ??
          {};

        const existingIngredients =
          cleanArray(
            existing.ingredients
          );

        /*
         * Once ManeLine has a canonical
         * ingredient list for this barcode,
         * use it instead of allowing every
         * scan to overwrite the global
         * product record.
         */
        if (
          existingIngredients.length >
          0
        ) {
          console.log(
            '[ManeLine OCR cache] Existing product already has ingredients:',
            {
              barcode,

              ingredientCount:
                existingIngredients.length,

              ingredientSource:
                existing
                  .ingredientSource ??
                null,
            }
          );

          return {
            saved: false,

            cached: true,

            product: {
              id: barcode,

              ...existing,

              ingredients:
                existingIngredients,
            },
          };
        }
      }

      /* ---------------------------------------------------
         BUILD CANONICAL PRODUCT
         --------------------------------------------------- */

      const canonicalProduct = {
        id:
          barcode,

        name:
          cleanString(
            product.name
          ) ||
          'Unknown product',

        brand:
          cleanString(
            product.brand
          ) ||
          'Unknown brand',

        category:
          cleanString(
            product.category
          ) ||
          'Treatment',

        description:
          cleanString(
            product.description
          ) ||
          'Ingredient list captured from the product label using ManeLine OCR.',

        barcodes:
          Array.from(
            new Set([
              ...cleanArray(
                product.barcodes
              ),

              barcode,
            ])
          ),

        ingredients,

        ingredientsText,

        /*
         * The source tells us this
         * ingredient list came from
         * label OCR and was reviewed
         * by the user before saving.
         */
        ingredientSource:
          'user_photo_ocr',

        ingredientVerification:
          'user_reviewed',

        /* -----------------------------------------------
           KEEP MATCHING METADATA
           ----------------------------------------------- */

        bestFor:
          cleanArray(
            product.bestFor
          ),

        tags:
          cleanArray(
            product.tags
          ),

        recommendedForHairTypes:
          cleanArray(
            product
              .recommendedForHairTypes
          ),

        recommendedForPorosity:
          cleanArray(
            product
              .recommendedForPorosity
          ),

        recommendedForDensity:
          cleanArray(
            product
              .recommendedForDensity
          ),

        recommendedForScalp:
          cleanArray(
            product
              .recommendedForScalp
          ),

        recommendedForGoals:
          cleanArray(
            product
              .recommendedForGoals
          ),

        avoidIf:
          cleanArray(
            product.avoidIf
          ),

        cautions:
          cleanArray(
            product.cautions
          ),

        routineStepMatch:
          cleanArray(
            product
              .routineStepMatch
          ),

        /*
         * Only include optional image
         * fields when they actually
         * exist.
         */
        ...(cleanString(
          product.imageUrl
        )
          ? {
              imageUrl:
                cleanString(
                  product.imageUrl
                ),
            }
          : {}),

        ...(cleanString(
          product.imageEmoji
        )
          ? {
              imageEmoji:
                cleanString(
                  product.imageEmoji
                ),
            }
          : {}),
      };

      /* ---------------------------------------------------
         WRITE USING ADMIN SDK
         --------------------------------------------------- */

      await productRef.set(
        {
          ...canonicalProduct,

          updatedAt:
            FieldValue
              .serverTimestamp(),

          ingredientUpdatedAt:
            FieldValue
              .serverTimestamp(),
        },

        {
          merge: true,
        }
      );

      console.log(
        '[ManeLine OCR cache] Reviewed product saved:',
        {
          barcode,

          productName:
            canonicalProduct.name,

          ingredientCount:
            ingredients.length,
        }
      );

      return {
        saved: true,

        cached: false,

        product:
          canonicalProduct,
      };
    }
  );