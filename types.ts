
export interface ProcessedImageState {
  mainImageSrc: string | null;
  bgImageSrc: string | null;
  text: string;
  accentColor: string;
  isSmallImage: boolean;
}

export type TextBackdropType = 'none' | 'shadow' | 'solid-black' | 'solid-white' | 'glass' | 'neon' | 'sticker' | 'outline' | 'gradient-bar' | 'retro-shadow' | 'cyber' | 'soft-blur' | 'soft-brush';

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'warm' | 'cool' | 'dramatic';

export interface EditorState {
  // Content
  text: string;
  // Colors
  textColor: string;
  accentColor: string;
  gradientColor1: string; // Background Grad Start
  gradientColor2: string; // Background Grad End
  // Overlay Gradients
  overlayTop: boolean;
  overlayBottom: boolean;
  overlayColor: string;
  overlayOpacity: number; // 0 to 1
  overlayHeight: number;  // 0.1 to 1.0 (Percentage of screen)
  // Movable Spotlight
  showSpotlight: boolean;
  spotlightX: number; // Offset from center
  spotlightY: number; // Offset from center
  // Typography
  fontFamily: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textBackdrop: TextBackdropType;
  textOpacity: number; // 0 to 1
  letterColors: Record<number, string>; // Index -> Hex Color
  // Transforms
  textScale: number;
  textX: number;
  textY: number;
  imageScale: number;
  imageX: number;
  imageY: number;
  // Image Adjustments
  imageBrightness: 'bright' | 'dark'; // Detected lightness for text color logic
  filter: FilterType;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT_2_3 = "2:3",
  LANDSCAPE_3_2 = "3:2",
  PORTRAIT_3_4 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  STORY_9_16 = "9:16",
  CINEMA_16_9 = "16:9",
  ULTRAWIDE_21_9 = "21:9"
}

export interface AnalysisResult {
  suggestedCaption: string;
  colorPalette: string[];
  imageBrightness: 'bright' | 'dark';
}