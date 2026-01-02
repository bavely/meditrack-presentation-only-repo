import * as ImagePicker from 'expo-image-picker';
import ExpoMlkitOcr from 'expo-mlkit-ocr';

import type { AlternativeScanResult } from './types';

function mergePanoramaText(texts: string[]): string {
  if (!texts.length) return '';

  let merged = texts[0].trim();

  function findOverlap(a: string, b: string): number {
    const maxLen = Math.min(a.length, b.length);
    for (let len = maxLen; len > 0; len--) {
      if (a.endsWith(b.slice(0, len))) {
        return len;
      }
    }
    return 0;
  }

  for (let i = 1; i < texts.length; i++) {
    const segment = texts[i].trim();
    if (!segment) continue;

    const overlapLen = findOverlap(merged, segment);
    if (
      overlapLen >
      segment.split(/\s+/).slice(0, 3).join(' ').length / 2
    ) {
      merged = merged + segment.slice(overlapLen);
    } else {
      merged = merged + '\n' + segment;
    }
  }

  const lines = merged.split('\n');
  const seen = new Set<string>();
  const unique = lines.filter(line => {
    const key = line.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.join('\n').trim();
}

export interface PhotoStitchingOptions {
  numberOfPhotos: number;
  overlapPercentage: number;
  stitchingMethod: 'horizontal' | 'cylindrical';
  enhanceText: boolean;
}

/**
 * Multi-Photo Stitching Approach
 *
 * Captures multiple photos around the cylinder and stitches them together
 * as a fallback to video-based unwrapping.
 */
export class PhotoStitchingScanner {
  private capturedImages: string[] = [];
  private options: PhotoStitchingOptions;

  constructor(options: Partial<PhotoStitchingOptions> = {}) {
    this.options = {
      numberOfPhotos: 4,
      overlapPercentage: 20,
      stitchingMethod: 'cylindrical',
      enhanceText: true,
      ...options,
    };
  }

  async capturePhotoSequence(): Promise<string[]> {
    const images: string[] = [];
    const captureErrors: string[] = [];

    for (let i = 0; i < this.options.numberOfPhotos; i++) {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          aspect: [3, 4],
        });

        if (!result.canceled && result.assets[0]) {
          images.push(result.assets[0].uri);
        } else {
          captureErrors.push(`Photo ${i + 1} capture canceled or failed`);
        }
      } catch (error) {
        captureErrors.push(`Photo ${i + 1} error: ${error instanceof Error ? error.message : error}`);
      }

      // Brief pause between captures
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.capturedImages = images;

    if (captureErrors.length > 0) {
      throw new Error(captureErrors.join('; '));
    }

    return images;
  }

  static async process(
    imageUris: string[],
    options: Partial<PhotoStitchingOptions> = {}
  ): Promise<AlternativeScanResult> {
    try {
      const scanner = new PhotoStitchingScanner(options);
      const texts = await Promise.all(
        imageUris.map(async uri => {
          const res = await ExpoMlkitOcr.recognizeText(uri);
          return res.text.trim();
        })
      );
      const extractedText = mergePanoramaText(texts);
      const confidence = scanner.calculateTextConfidence(extractedText);

      return {
        success: true,
        extractedText,
        confidence,
        method: 'photo_stitching',
        images: imageUris,
      };
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        method: 'photo_stitching',
        images: imageUris,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async performPhotoStitchingScan(): Promise<AlternativeScanResult> {
    try {
      const images = await this.capturePhotoSequence();
      this.capturedImages = images;
      return await PhotoStitchingScanner.process(images, this.options);
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        method: 'photo_stitching',
        images: this.capturedImages,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Processes a sequence of images that were captured externally.
   *
   * This allows a single camera session to collect all photos and
   * then pass them in for stitching without re-launching the camera
   * for each capture.
   */
  async processImageSequence(imageUris: string[]): Promise<AlternativeScanResult> {
    try {
      if (!imageUris.length) {
        throw new Error('No images provided');
      }

      this.capturedImages = imageUris;
      const texts = await Promise.all(
        imageUris.map(async uri => {
          const res = await ExpoMlkitOcr.recognizeText(uri);
          return res.text.trim();
        })
      );
      const extractedText = mergePanoramaText(texts);

      // Calculate confidence based on text quality
      const confidence = this.calculateTextConfidence(extractedText);

      return {
        success: true,
        extractedText,
        confidence,
        method: 'photo_stitching',
        images: imageUris,
      };
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        method: 'photo_stitching',
        images: imageUris,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private calculateTextConfidence(text: string): number {
    // Simple heuristic for text quality assessment
    if (!text || text.length < 10) return 0.1;

    const wordCount = text.split(/\s+/).length;
    const hasNumbers = /\d/.test(text);
    const hasLetters = /[a-zA-Z]/.test(text);
    const hasMedicalTerms = /mg|ml|tablet|capsule|dosage|daily|twice/i.test(text);

    let confidence = 0.3; // Base confidence

    if (wordCount > 5) confidence += 0.2;
    if (hasNumbers && hasLetters) confidence += 0.2;
    if (hasMedicalTerms) confidence += 0.3;
    if (text.length > 50) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  reset(): void {
    this.capturedImages = [];
  }
}
