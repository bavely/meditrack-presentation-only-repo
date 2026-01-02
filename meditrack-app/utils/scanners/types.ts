export interface AlternativeScanResult {
  success: boolean;
  extractedText: string;
  confidence: number;
  method: 'photo_stitching' | 'single_photo' | 'manual_guide';
  images: string[];
  error?: string;
}
