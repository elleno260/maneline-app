import { Ionicons } from '@expo/vector-icons';
import {CameraView,useCameraPermissions,} from 'expo-camera';
import { router,useLocalSearchParams,} from 'expo-router';
import {useRef,useState,} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,  Text,View,} from 'react-native';
import { useSafeAreaInsets,} from 'react-native-safe-area-context';
import {  recognizeTextFromImage,} from '../services/ocrService';
import { saveOcrDraft,} from '../services/ocrDraftService';

const COLORS = {
  lemonCream: '#FFF9C7',
  brown: '#3D2920',
  lightBlue: '#95BFFF',
  oxfordBlue: '#20314B',
  green: '#667D41',

  white: '#FFFFFF',
  background: '#FFFDF2',
  mutedText: '#6B7280',
  danger: '#B91C1C',
};
export default function ScanIngredientsScreen() {
  const insets =
    useSafeAreaInsets();

  const params =
    useLocalSearchParams<{
      barcode?: string;
      productId?: string;
      productName?: string;
      brand?: string;
      category?: string;
    }>();

  const [
    permission,
    requestPermission,
  ] =
    useCameraPermissions();

  const cameraRef =
    useRef<CameraView | null>(
      null
    );

  const [
    cameraReady,
    setCameraReady,
  ] =
    useState(false);

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  async function captureIngredientLabel() {
    if (
      !cameraRef.current ||
      !cameraReady ||
      processing
    ) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      /*
       * Take a high-quality still image.
       * OCR works much better on a photo
       * than trying to process random
       * barcode-camera frames.
       */
      const photo =
        await cameraRef.current
          .takePictureAsync({
            quality: 0.95,
          });

     


console.log(
  '[ManeLine OCR] Cropped ingredient region:',
  {
    original: {
      width: photo.width,
      height: photo.height,
    },

    cropped: {
      width:
        photo.width,
      height:
        photo.height,
    },
  }
);
      const result =
        await recognizeTextFromImage(
          photo.uri
        );

      /*
       * Don't send the user to an empty
       * review screen.
       */
      if (
        !result.text ||
        result.characterCount <
          20
      ) {
        setError(
          'ManeLine could not read enough text from this photo. Try again with the ingredient list closer, flatter, and in better lighting.'
        );

        return;
      }

      await saveOcrDraft({
        barcode:
          params.barcode,

        productId:
          params.productId,

        productName:
          params.productName,

        brand:
          params.brand,

        category:
          params.category,

        extractedText:
          result.text,

        ingredientSource:
          'user_photo_ocr',

        capturedAt:
          new Date()
            .toISOString(),
      });

      router.push(
        '/review-scan' as never
      );
    } catch (captureError) {
      console.warn(
        '[ManeLine OCR] Capture failed:',
        captureError
      );

      setError(
        'ManeLine could not read this ingredient label. Make sure the text is clear, well-lit, and not covered by glare.'
      );
    } finally {
      setProcessing(false);
    }
  }

  if (!permission) {
    return (
      <View
        style={
          styles.centered
        }
      >
        <ActivityIndicator
          color={
            COLORS.oxfordBlue
          }
        />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.centered,

          {
            paddingTop:
              insets.top,
          },
        ]}
      >
        <View
          style={
            styles.permissionCard
          }
        >
          <View
            style={
              styles.permissionIcon
            }
          >
            <Ionicons
              name="camera-outline"
              size={34}
              color={
                COLORS.oxfordBlue
              }
            />
          </View>

          <Text
            style={
              styles.permissionTitle
            }
          >
            Camera access needed
          </Text>

          <Text
            style={
              styles.permissionText
            }
          >
            ManeLine needs camera
            access to photograph and
            read the ingredient label.
          </Text>

          <Pressable
            style={
              styles.primaryButton
            }
            onPress={
              requestPermission
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Allow camera
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.cancelButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.cancelText
              }
            >
              Go back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.screen}
    >
      {/* HEADER */}

      <View
        style={[
          styles.header,

          {
            paddingTop:
              insets.top + 12,
          },
        ]}
      >
        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={
              COLORS.oxfordBlue
            }
          />
        </Pressable>

        <View
          style={{ flex: 1 }}
        >
          <Text
            style={
              styles.eyebrow
            }
          >
            INGREDIENT SCAN
          </Text>

          <Text
            style={styles.title}
          >
            Scan the ingredient
            label.
          </Text>
        </View>
      </View>

      {/* PRODUCT CONTEXT */}

      {params.productName ? (
        <View
          style={
            styles.productCard
          }
        >
          <Text
            style={
              styles.productLabel
            }
          >
            PRODUCT
          </Text>

          <Text
            style={
              styles.productName
            }
          >
            {
              params.productName
            }
          </Text>

          {params.brand ? (
            <Text
              style={
                styles.productBrand
              }
            >
              {params.brand}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* CAMERA */}

      <View
        style={
          styles.cameraWrap
        }
      >
        <CameraView
          ref={cameraRef}
          style={
            styles.camera
          }
          facing="back"
          onCameraReady={() =>
            setCameraReady(
              true
            )
          }
        />

        <View
          pointerEvents="none"
          style={
            styles.labelFrame
          }
        >
          <View
            style={
              styles.frameTopLeft
            }
          />

          <View
            style={
              styles.frameTopRight
            }
          />

          <View
            style={
              styles.frameBottomLeft
            }
          />

          <View
            style={
              styles.frameBottomRight
            }
          />

          <View
            style={
              styles.frameInstruction
            }
          >
            <Text
              style={
                styles.frameInstructionText
              }
            >
              Keep the ingredient
              list inside the frame
            </Text>
          </View>
        </View>

        {processing ? (
          <View
            style={
              styles.processingOverlay
            }
          >
            <ActivityIndicator
              color={
                COLORS.white
              }
              size="large"
            />

            <Text
              style={
                styles.processingTitle
              }
            >
              Reading ingredients...
            </Text>

            <Text
              style={
                styles.processingText
              }
            >
              ManeLine is extracting
              the text from your
              photo.
            </Text>
          </View>
        ) : null}
      </View>

      {/* INSTRUCTIONS */}

      <View
        style={
          styles.instructionsCard
        }
      >
        <Text
          style={
            styles.instructionsTitle
          }
        >
          For the clearest scan
        </Text>

        <Instruction
          text="Hold the product close enough for the ingredient text to be readable."
        />

        <Instruction
          text="Keep the label flat and avoid glare or shadows."
        />

        <Instruction
          text="Make sure the full ingredient list is visible."
        />
      </View>

      {/* ERROR */}

      {error ? (
        <View
          style={
            styles.errorCard
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={
              COLORS.danger
            }
          />

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        </View>
      ) : null}

      {/* CAPTURE */}

      <View
        style={[
          styles.bottomBar,

          {
            paddingBottom:
              Math.max(
                insets.bottom,
                18
              ),
          },
        ]}
      >
        <Pressable
          style={[
            styles.captureButton,

            (
              !cameraReady ||
              processing
            ) &&
              styles.captureButtonDisabled,
          ]}
          disabled={
            !cameraReady ||
            processing
          }
          onPress={
            captureIngredientLabel
          }
        >
          <Ionicons
            name="camera"
            size={20}
            color={
              COLORS.white
            }
          />

          <Text
            style={
              styles.captureButtonText
            }
          >
            Capture ingredient
            label
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Instruction({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.instructionRow
      }
    >
      <Ionicons
        name="checkmark-circle-outline"
        size={17}
        color={
          COLORS.green
        }
      />

      <Text
        style={
          styles.instructionText
        }
      >
        {text}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    centered: {
      flex: 1,

      padding: 24,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,
    },

    header: {
      paddingHorizontal: 18,

      paddingBottom: 14,

      flexDirection: 'row',

      alignItems:
        'center',

      gap: 12,
    },

    backButton: {
      width: 42,

      height: 42,

      borderRadius: 14,

      backgroundColor:
        COLORS.lemonCream,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    eyebrow: {
      fontSize: 10,

      letterSpacing: 1,

      fontWeight: '900',

      color:
        COLORS.green,
    },

    title: {
      marginTop: 3,

      fontSize: 23,

      lineHeight: 27,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    productCard: {
      marginHorizontal: 18,

      marginBottom: 12,

      padding: 12,

      borderRadius: 16,

      backgroundColor:
        COLORS.lemonCream,
    },

    productLabel: {
      fontSize: 9,

      letterSpacing: 0.8,

      fontWeight: '900',

      color:
        COLORS.green,
    },

    productName: {
      marginTop: 2,

      fontSize: 14,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    productBrand: {
      marginTop: 2,

      fontSize: 11,

      color:
        COLORS.brown,
    },

    cameraWrap: {
      flex: 1,

      marginHorizontal: 18,

      minHeight: 330,

      borderRadius: 28,

      overflow: 'hidden',

      backgroundColor:
        COLORS.oxfordBlue,

      position:
        'relative',
    },

    camera: {
      flex: 1,
    },

    labelFrame: {
      position:
        'absolute',

     left: '5%',
  top: '21%',

  width: '90%',
  height: '58%',
    },

    frameTopLeft: {
      position:
        'absolute',

      left: 0,

      top: 0,

      width: 45,

      height: 45,

      borderLeftWidth: 4,

      borderTopWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderTopLeftRadius:
        12,
    },

    frameTopRight: {
      position:
        'absolute',

      right: 0,

      top: 0,

      width: 45,

      height: 45,

      borderRightWidth: 4,

      borderTopWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderTopRightRadius:
        12,
    },

    frameBottomLeft: {
      position:
        'absolute',

      left: 0,

      bottom: 0,

      width: 45,

      height: 45,

      borderLeftWidth: 4,

      borderBottomWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderBottomLeftRadius:
        12,
    },

    frameBottomRight: {
      position:
        'absolute',

      right: 0,

      bottom: 0,

      width: 45,

      height: 45,

      borderRightWidth: 4,

      borderBottomWidth: 4,

      borderColor:
        COLORS.lemonCream,

      borderBottomRightRadius:
        12,
    },

    frameInstruction: {
      position:
        'absolute',

      left: 25,

      right: 25,

      bottom: 16,

      paddingHorizontal: 10,

      paddingVertical: 7,

      borderRadius: 12,

      backgroundColor:
        'rgba(32,49,75,0.75)',
    },

    frameInstructionText: {
      textAlign:
        'center',

      fontSize: 10,

      fontWeight: '800',

      color:
        COLORS.white,
    },

    processingOverlay: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        'rgba(32,49,75,0.80)',

      alignItems: 'center',

      justifyContent:
        'center',

      padding: 30,
    },

    processingTitle: {
      marginTop: 13,

      fontSize: 17,

      fontWeight: '900',

      color:
        COLORS.white,
    },

    processingText: {
      marginTop: 5,

      textAlign:
        'center',

      fontSize: 11,

      lineHeight: 17,

      color:
        '#E7ECF4',
    },

    instructionsCard: {
      marginHorizontal: 18,

      marginTop: 12,

      padding: 13,

      borderRadius: 18,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        '#E7E2CB',
    },

    instructionsTitle: {
      marginBottom: 7,

      fontSize: 12,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    instructionRow: {
      marginTop: 5,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 7,
    },

    instructionText: {
      flex: 1,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.mutedText,
    },

    errorCard: {
      marginHorizontal: 18,

      marginTop: 10,

      padding: 12,

      borderRadius: 15,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 8,

      backgroundColor:
        '#FEF2F2',
    },

    errorText: {
      flex: 1,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.danger,
    },

    bottomBar: {
      paddingTop: 12,

      paddingHorizontal: 18,
    },

    captureButton: {
      minHeight: 52,

      borderRadius: 17,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 8,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    captureButtonDisabled: {
      opacity: 0.45,
    },

    captureButtonText: {
      fontSize: 13,

      fontWeight: '900',

      color:
        COLORS.white,
    },

    permissionCard: {
      width: '100%',

      padding: 22,

      borderRadius: 24,

      alignItems: 'center',

      backgroundColor:
        COLORS.white,
    },

    permissionIcon: {
      width: 62,

      height: 62,

      borderRadius: 20,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.lemonCream,
    },

    permissionTitle: {
      marginTop: 13,

      fontSize: 19,

      fontWeight: '900',

      color:
        COLORS.oxfordBlue,
    },

    permissionText: {
      marginTop: 6,

      textAlign:
        'center',

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.mutedText,
    },

    primaryButton: {
      marginTop: 17,

      paddingHorizontal: 18,

      paddingVertical: 13,

      borderRadius: 15,

      backgroundColor:
        COLORS.oxfordBlue,
    },

    primaryButtonText: {
      fontSize: 12,

      fontWeight: '900',

      color:
        COLORS.white,
    },

    cancelButton: {
      marginTop: 12,

      padding: 8,
    },

    cancelText: {
      fontSize: 11,

      fontWeight: '800',

      color:
        COLORS.green,
    },
  });