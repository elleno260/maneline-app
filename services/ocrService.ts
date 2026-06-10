import TextRecognition from "@react-native-ml-kit/text-recognition";

export async function recognizeTextFromImage(imageUri: string) {
  const result = await TextRecognition.recognize(imageUri);

  return {
    fullText: result.text,
    blocks: result.blocks,
  };
}