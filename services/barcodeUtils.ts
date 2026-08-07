export function normalizeBarcode(rawBarcode: string) {
  return rawBarcode.trim().replace(/\D/g, '');
}

export function getBarcodeVariants(rawBarcode: string): string[] {
  const cleanedBarcode = normalizeBarcode(rawBarcode);
  const variants = new Set<string>();

  if (!cleanedBarcode) {
    return [];
  }

  variants.add(cleanedBarcode);

  /**
   * UPC-A is 12 digits.
   * EAN-13 can store the same UPC with a leading 0.
   */
  if (cleanedBarcode.length === 12) {
    variants.add(`0${cleanedBarcode}`);
  }

  /**
   * Some APIs store EAN-13 beauty products without the leading 0.
   */
  if (cleanedBarcode.length === 13 && cleanedBarcode.startsWith('0')) {
    variants.add(cleanedBarcode.slice(1));
  }

  /**
   * If the scanner drops a leading zero, try restoring it.
   */
  if (cleanedBarcode.length === 11) {
    variants.add(`0${cleanedBarcode}`);
    variants.add(`00${cleanedBarcode}`);
  }

  return Array.from(variants);
}