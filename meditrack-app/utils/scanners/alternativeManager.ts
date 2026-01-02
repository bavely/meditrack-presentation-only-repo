import * as FileSystem from 'expo-file-system';

import { PhotoStitchingScanner } from './photoStitchingScanner';
import { SinglePhotoScanner } from './singlePhotoScanner';
import type { AlternativeScanResult } from './types';


/**
 * Alternative Scanning Manager
 *
 * Orchestrates different scanning methods with automatic fallback logic.
 */
export class AlternativeScanningManager {
  private photoStitcher = new PhotoStitchingScanner();
  private singlePhotoScanner = new SinglePhotoScanner();


  async performAlternativeScan(
    preferredMethod?: 'photo_stitching' | 'single_photo' | 'auto'
  ): Promise<AlternativeScanResult> {
    const method = preferredMethod || 'auto';

    switch (method) {
      case 'photo_stitching':
        return this.photoStitcher.performPhotoStitchingScan();

      case 'single_photo':
        return this.singlePhotoScanner.performSinglePhotoScan();
      case 'auto':
      default:
        return this.performAutoFallbackScan();
    }
  }

  private async performAutoFallbackScan(): Promise<AlternativeScanResult> {
    // Try methods in order of reliability and user experience

    // 1. Try single photo first (fastest)
    console.log('Attempting single photo scan...');
    const singleResult = await this.singlePhotoScanner.performSinglePhotoScan();

    if (singleResult.success && singleResult.confidence > 0.6) {
      return singleResult;
    }

    // 2. Try photo stitching (more comprehensive)
    console.log('Attempting photo stitching scan...');
    const stitchingResult = await this.photoStitcher.performPhotoStitchingScan();

    if (stitchingResult.success && stitchingResult.confidence > 0.5) {
      return stitchingResult;
    }

    // 3. Fall back to manual guidance (highest success rate)
    console.log('Falling back to manual guidance scan...');
    return await this.photoStitcher.performPhotoStitchingScan();
  }

  reset(): void {
    this.photoStitcher.reset();
  }
}

/**
 * Utility function to clean up temporary image files
 */
export async function cleanupAlternativeScanFiles(result: AlternativeScanResult): Promise<void> {
  for (const imageUri of result.images) {
    try {
      await FileSystem.deleteAsync(imageUri, { idempotent: true });
    } catch (error) {
      console.warn('Failed to cleanup image file:', imageUri, error);
    }
  }
}
