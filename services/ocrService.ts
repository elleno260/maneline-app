import TextRecognition from '@react-native-ml-kit/text-recognition';

export type OcrRecognitionResult = {
  text: string;
  characterCount: number;
  lineCount: number;
  blockCount: number;
};

/**
 * Runs on-device text recognition against
 * a photo captured from the ingredient label.
 */
export async function recognizeTextFromImage(
  imageUri: string
): Promise<OcrRecognitionResult> {
  const cleanUri =
    imageUri?.trim();

  if (!cleanUri) {
    throw new Error(
      'An image URI is required for OCR.'
    );
  }

  console.log(
    '[ManeLine OCR] Starting recognition:',
    cleanUri
  );

  const result =
    await TextRecognition.recognize(
      cleanUri
    );

  const text =
  cleanOcrText(
    result.text ?? ''
  );

  const lineCount =
    text
      ? text
          .split('\n')
          .filter(
            (line) =>
              line.trim().length >
              0
          ).length
      : 0;

  console.log(
    '[ManeLine OCR] Recognition complete:',
    {
      characterCount:
        text.length,

      lineCount,

      blockCount:
        result.blocks?.length ??
        0,
    }
  );

  return {
    text,

    characterCount:
      text.length,

    lineCount,

    blockCount:
      result.blocks?.length ??
      0,
  };
}

/**
 * OCR often returns inconsistent spaces
 * and large groups of blank lines.
 *
 * Clean those without changing ingredient
 * names or punctuation.
 */
function cleanOcrText(
  value: string
) {
  return value
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
