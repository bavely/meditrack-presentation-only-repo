import * as ImagePicker from 'expo-image-picker';
import ExpoMlkitOcr from 'expo-mlkit-ocr';

import type { AlternativeScanResult } from './types';

/**
 * Single Photo Enhanced Scanning
 *
 * Uses advanced processing on a single photo when cylindrical unwrapping
 * is not available or practical.
 */
export class SinglePhotoScanner {
  async captureSinglePhoto(): Promise<string> {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
      aspect: [3, 4],
    });

    if (result.canceled || !result.assets[0]) {
      throw new Error('Photo capture was canceled');
    }

    return result.assets[0].uri;
  }

  async enhanceImageForOCR(imageUri: string): Promise<string> {
    // In a real implementation, this would apply image enhancement:
    // - Contrast adjustment
    // - Sharpening
    // - Noise reduction
    // - Perspective correction

    // For now, return the original image
    return imageUri;
  }

  async performSinglePhotoScan(imageUri?: string): Promise<AlternativeScanResult> {
    try {
      const captureUri = imageUri ?? (await this.captureSinglePhoto());
      const enhancedUri = await this.enhanceImageForOCR(captureUri);

      const ocrResult = await ExpoMlkitOcr.recognizeText(enhancedUri);
      const extractedText = ocrResult.text.trim();

      const confidence = this.calculateSinglePhotoConfidence(
        extractedText,
        ocrResult
      );

      return {
        success: true,
        extractedText,
        confidence,
        method: 'single_photo',
        images: [captureUri, enhancedUri],
      };
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        method: 'single_photo',
        images: imageUri ? [imageUri] : [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateSinglePhotoConfidence(text: string, ocrResult: { blocks: any[] }): number {
    if (!text || text.length < 5) return 0.1;

    // Estimate confidence based on number of detected text blocks
    const avgConfidence = ocrResult.blocks && ocrResult.blocks.length > 0
      ? 0.5 + Math.min(0.5, ocrResult.blocks.length * 0.05)
      : 0.5;

    // Text quality assessment
    const hasStructuredData = /\d+\s*(mg|ml|g)\b/i.test(text);
    const hasMedicationTerms = /(tablet|capsule|pill|liquid|syrup|injection)/i.test(text);
    const hasInstructions = /(take|use|apply|times?\s+daily|every)/i.test(text);

    let qualityScore = avgConfidence * 0.4; // OCR confidence weight

    if (hasStructuredData) qualityScore += 0.3;
    if (hasMedicationTerms) qualityScore += 0.2;
    if (hasInstructions) qualityScore += 0.1;

    return Math.min(qualityScore, 1.0);
  }
}
