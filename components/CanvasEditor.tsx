import React, { useRef, useEffect, useState } from 'react';
import { TextBackdropType, FilterType } from '../types';

interface CanvasEditorProps {
  mainImageSrc: string | null;
  bgImageSrc: string | null;
  
  // Editor State flattened for props
  text: string;
  textColor: string;
  gradientColor1: string;
  gradientColor2: string;
  accentColor: string;
  imageBrightness?: 'bright' | 'dark';
  
  overlayTop: boolean;
  overlayBottom: boolean;
  overlayColor: string;
  overlayOpacity: number;
  overlayHeight: number;
  
  showSpotlight: boolean;
  spotlightX: number;
  spotlightY: number;

  imageScale: number;
  imageX: number;
  imageY: number;

  // Visual Adjustments
  filter: FilterType;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;

  fontFamily: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textScale: number;
  textX: number;
  textY: number;
  textBackdrop: TextBackdropType;
  textOpacity: number;
  letterColors: Record<number, string>;

  onCanvasReady: (dataUrl: string) => void;
  onPositionChange: (target: 'image' | 'text' | 'spotlight', dx: number, dy: number) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  mainImageSrc, 
  bgImageSrc, 
  text, 
  textColor,
  gradientColor1,
  gradientColor2,
  accentColor,
  imageBrightness = 'dark',
  
  overlayTop,
  overlayBottom,
  overlayColor,
  overlayOpacity,
  overlayHeight,
  
  showSpotlight,
  spotlightX,
  spotlightY,

  imageScale,
  imageX,
  imageY,

  filter,
  brightness,
  contrast,
  saturation,
  blur,

  fontFamily,
  fontWeight,
  lineHeight,
  letterSpacing,
  textScale,
  textX,
  textY,
  textBackdrop,
  textOpacity,
  letterColors,

  onCanvasReady,
  onPositionChange,
  onInteractionStart,
  onInteractionEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Drag State
  const [isDragging, setIsDragging] = useState<'image' | 'text' | 'spotlight' | null>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const boundsRef = useRef<{
    image: { x: number, y: number, w: number, h: number } | null,
    text: { x: number, y: number, w: number, h: number } | null,
    spotlight: { x: number, y: number, r: number } | null
  }>({ image: null, text: null, spotlight: null });

  // Draw Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIDTH = 1080;
    const HEIGHT = 1920;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const draw = async () => {
      // --- Helper: Load Image ---
      const loadImage = (src: string) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // --- 1. BACKDROP ---
      ctx.fillStyle = '#000000'; 
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (bgImageSrc) {
        try {
          const bgImg = await loadImage(bgImageSrc);
          const scale = Math.max(WIDTH / bgImg.width, HEIGHT / bgImg.height);
          const x = (WIDTH / 2) - (bgImg.width / 2) * scale;
          const y = (HEIGHT / 2) - (bgImg.height / 2) * scale;
          
          ctx.save();
          ctx.filter = 'blur(40px) brightness(0.4) contrast(1.2)';
          ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
          ctx.restore();
        } catch (e) { console.error("BG load fail", e); }
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        grad.addColorStop(0, gradientColor1);
        grad.addColorStop(1, gradientColor2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // --- 2. MAIN IMAGE ---
      boundsRef.current.image = null;
      
      if (mainImageSrc) {
        try {
          const mainImg = await loadImage(mainImageSrc);
          
          const baseTargetWidth = WIDTH * 0.88;
          const baseScale = baseTargetWidth / mainImg.width;
          const effectiveScale = baseScale * imageScale;

          const drawW = mainImg.width * effectiveScale;
          const drawH = mainImg.height * effectiveScale;
          
          const baseX = (WIDTH - drawW) / 2;
          const baseY = (HEIGHT - drawH) / 2 - 120;

          const x = baseX + imageX;
          const y = baseY + imageY;

          boundsRef.current.image = { x, y, w: drawW, h: drawH };

          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 50;
          ctx.shadowOffsetY = 30;

          ctx.save();
          ctx.beginPath();
          const radius = 50; 
          ctx.roundRect(x, y, drawW, drawH, radius);
          ctx.clip();

          // --- APPLY FILTERS ---
          const baseFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`;
          let presetFilter = '';
          
          switch (filter) {
              case 'grayscale': presetFilter = 'grayscale(100%)'; break;
              case 'sepia': presetFilter = 'sepia(100%)'; break;
              case 'vintage': presetFilter = 'sepia(50%) contrast(120%) brightness(90%)'; break;
              case 'warm': presetFilter = 'sepia(30%) hue-rotate(-15deg) saturate(140%)'; break;
              case 'cool': presetFilter = 'hue-rotate(30deg) saturate(80%) brightness(110%)'; break;
              case 'dramatic': presetFilter = 'contrast(150%) saturate(120%) brightness(90%)'; break;
              default: presetFilter = '';
          }

          ctx.filter = `${baseFilter} ${presetFilter}`.trim();
          
          ctx.drawImage(mainImg, x, y, drawW, drawH);
          ctx.restore();
          
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
          ctx.filter = "none";
        } catch (e) {
          console.error("Main img load fail", e);
        }
      }

      // --- 3. OVERLAYS & SPOTLIGHT ---
      // Fixed gradients
      const gradHeight = HEIGHT * overlayHeight;

      if (overlayTop) {
        ctx.save();
        const gradTop = ctx.createLinearGradient(0, 0, 0, gradHeight);
        gradTop.addColorStop(0, overlayColor);
        gradTop.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.globalAlpha = overlayOpacity;
        ctx.fillStyle = gradTop;
        ctx.fillRect(0, 0, WIDTH, gradHeight);
        ctx.restore();
      }

      if (overlayBottom) {
        ctx.save();
        const gradBot = ctx.createLinearGradient(0, HEIGHT, 0, HEIGHT - gradHeight);
        gradBot.addColorStop(0, overlayColor);
        gradBot.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = overlayOpacity;
        ctx.fillStyle = gradBot;
        ctx.fillRect(0, HEIGHT - gradHeight, WIDTH, gradHeight);
        ctx.restore();
      }

      // Movable Spotlight
      boundsRef.current.spotlight = null;
      if (showSpotlight) {
        const sx = (WIDTH / 2) + spotlightX;
        const sy = (HEIGHT / 2) + spotlightY;
        const radius = 600; // Large soft glow

        boundsRef.current.spotlight = { x: sx, y: sy, r: 150 }; // Hit area smaller than visual

        ctx.save();
        const spotGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
        // Parse overlayColor hex to rgb for alpha
        const hex = overlayColor.replace('#', '');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        
        spotGrad.addColorStop(0, `rgba(${r},${g},${b}, ${0.7 * overlayOpacity})`);
        spotGrad.addColorStop(0.5, `rgba(${r},${g},${b}, ${0.3 * overlayOpacity})`);
        spotGrad.addColorStop(1, `rgba(${r},${g},${b}, 0)`);
        
        ctx.globalCompositeOperation = 'screen'; // Nice blending mode for lights
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        ctx.restore();
      }

      // --- 4. TEXT ---
      boundsRef.current.text = null;

      if (text) {
        const safeY = HEIGHT - 280; 
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top'; // Easier to align line by line
        
        const baseFontSize = 72;
        const fontSize = baseFontSize * textScale;
        const getFont = (size: number) => `${fontWeight} ${size}px "${fontFamily}", sans-serif`;
        ctx.font = getFont(fontSize);
        
        // Disable native spacing for manual char drawing loop to work predictably
        // We will add spacing manually in the loop.
        // @ts-ignore
        ctx.letterSpacing = '0px'; 
        
        const maxWidth = WIDTH * 0.85;
        const words = text.split(' ');
        let lines: string[] = [];
        let currentLine = words[0];

        // Line wrap logic
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width + (currentLine.length + 1) * letterSpacing; 
            // ^ Crude estimation of width with spacing for wrapping check
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        const lineHeightPx = fontSize * lineHeight;
        const totalHeight = lines.length * lineHeightPx;
        
        const startY = (safeY - totalHeight + lineHeightPx) + textY; 
        const centerX = (WIDTH / 2) + textX;

        // Calculate bounding box for the whole text block
        let maxLineWidth = 0;
        lines.forEach(line => {
             // Precise measure including custom spacing
             let w = 0;
             for (let i = 0; i < line.length; i++) {
                 w += ctx.measureText(line[i]).width + letterSpacing;
             }
             if (w > maxLineWidth) maxLineWidth = w;
        });
        const padding = 30;
        const bgX = centerX - (maxLineWidth/2) - padding;
        const bgY = startY - padding + 10;
        const bgW = maxLineWidth + (padding * 2);
        const bgH = totalHeight + (padding/2);

        boundsRef.current.text = { x: bgX, y: bgY, w: bgW, h: bgH };

        ctx.save();
        ctx.globalAlpha = textOpacity;

        // --- BACKDROP DRAWING ---
        if (textBackdrop === 'solid-black') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.beginPath(); ctx.roundRect(bgX, bgY, bgW, bgH, 16); ctx.fill();
        } 
        else if (textBackdrop === 'solid-white') {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath(); ctx.roundRect(bgX, bgY, bgW, bgH, 16); ctx.fill();
        } 
        else if (textBackdrop === 'glass') {
             ctx.fillStyle = 'rgba(255,255,255,0.1)';
             ctx.strokeStyle = 'rgba(255,255,255,0.2)';
             ctx.lineWidth = 1;
             ctx.beginPath(); ctx.roundRect(bgX, bgY, bgW, bgH, 16); ctx.fill(); ctx.stroke();
        } 
        else if (textBackdrop === 'neon') {
             ctx.fillStyle = 'rgba(0,0,0,0.6)';
             ctx.shadowColor = accentColor;
             ctx.shadowBlur = 40;
             ctx.strokeStyle = accentColor;
             ctx.lineWidth = 2;
             ctx.beginPath(); ctx.roundRect(bgX, bgY, bgW, bgH, 16); ctx.fill(); ctx.stroke();
        } 
        else if (textBackdrop === 'sticker') {
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.roundRect(bgX, bgY, bgW, bgH, 16); ctx.fill();
        }
        else if (textBackdrop === 'gradient-bar') {
             const grad = ctx.createLinearGradient(bgX, bgY, bgX + bgW, bgY);
             grad.addColorStop(0, accentColor);
             grad.addColorStop(1, 'rgba(0,0,0,0)');
             ctx.fillStyle = grad;
             ctx.globalAlpha = 0.8 * textOpacity;
             ctx.beginPath(); ctx.roundRect(bgX, bgY, bgW, bgH, 16); ctx.fill();
             ctx.globalAlpha = textOpacity; // Reset
        }
        else if (textBackdrop === 'retro-shadow') {
             ctx.fillStyle = 'black';
             ctx.fillRect(bgX + 12, bgY + 12, bgW, bgH);
             ctx.fillStyle = accentColor;
             ctx.fillRect(bgX, bgY, bgW, bgH);
             ctx.strokeStyle = 'black';
             ctx.lineWidth = 4;
             ctx.strokeRect(bgX, bgY, bgW, bgH);
        }
        else if (textBackdrop === 'cyber') {
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 15;
            const L = 25; 
            ctx.beginPath();
            ctx.moveTo(bgX, bgY + L); ctx.lineTo(bgX, bgY); ctx.lineTo(bgX + L, bgY);
            ctx.moveTo(bgX + bgW - L, bgY); ctx.lineTo(bgX + bgW, bgY); ctx.lineTo(bgX + bgW, bgY + L);
            ctx.moveTo(bgX + bgW, bgY + bgH - L); ctx.lineTo(bgX + bgW, bgY + bgH); ctx.lineTo(bgX + bgW - L, bgY + bgH);
            ctx.moveTo(bgX + L, bgY + bgH); ctx.lineTo(bgX, bgY + bgH); ctx.lineTo(bgX, bgY + bgH - L);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(bgX, bgY, bgW, bgH);
        }
        else if (textBackdrop === 'soft-blur') {
             ctx.shadowColor = 'black';
             ctx.shadowBlur = 50;
             ctx.fillStyle = 'rgba(0,0,0,0.5)';
             ctx.beginPath(); ctx.roundRect(bgX + 10, bgY + 10, bgW - 20, bgH - 20, 30); ctx.fill();
        }
        else if (textBackdrop === 'soft-brush') {
             // Soft Brush effect: Draw a loose, blurry line behind the text lines
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             ctx.shadowColor = accentColor;
             ctx.shadowBlur = 30;
             ctx.strokeStyle = accentColor;
             ctx.globalAlpha = 0.6 * textOpacity;
             ctx.lineWidth = lineHeightPx * 0.7;
             
             lines.forEach((line, index) => {
                 const ly = startY + (index * lineHeightPx) + (lineHeightPx * 0.5);
                 let w = 0;
                 for (let char of line) w += ctx.measureText(char).width + letterSpacing;
                 
                 const lx = centerX - (w / 2);
                 ctx.beginPath();
                 ctx.moveTo(lx - 20, ly);
                 ctx.lineTo(lx + w + 20, ly);
                 ctx.stroke();
             });
             ctx.globalAlpha = textOpacity; // Reset alpha
             ctx.shadowBlur = 0; // Reset shadow
        }

        // Text Drawing Configuration
        ctx.fillStyle = textColor;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = fontSize * 0.05;

        // Shadow Config for text itself
        if (textBackdrop === 'shadow') {
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 4;
        } else if (textBackdrop === 'neon') {
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 0;
        } else if (textBackdrop === 'soft-blur') {
             ctx.shadowColor = "rgba(0,0,0,0.8)";
             ctx.shadowBlur = 10;
        } else {
            ctx.shadowColor = "transparent";
        }

        let charGlobalIndex = 0;
        
        lines.forEach((line, index) => {
            const ly = startY + (index * lineHeightPx);
            
            // Calculate width of this specific line to center it
            let lineWidth = 0;
            for (let i = 0; i < line.length; i++) {
                lineWidth += ctx.measureText(line[i]).width + letterSpacing;
            }
            
            // Starting X for this line (Centered)
            let cursorX = centerX - (lineWidth / 2);

            // Draw character by character
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const charWidth = ctx.measureText(char).width;
                
                // Determine color: Specific char color > Global text color
                const specificColor = letterColors[charGlobalIndex];
                
                ctx.fillStyle = specificColor || textColor;
                
                if (textBackdrop === 'outline') {
                     ctx.strokeStyle = specificColor || textColor;
                     ctx.strokeText(char, cursorX, ly);
                } else if (textBackdrop === 'sticker') {
                     // For sticker, usually black text on white
                     // But if we want colored letters on sticker:
                     ctx.fillStyle = specificColor || 'black';
                     ctx.fillText(char, cursorX, ly);
                } else if (textBackdrop === 'retro-shadow') {
                     // Retro shadow forces white usually, but we can allow overrides
                     ctx.fillStyle = specificColor || 'white';
                     ctx.shadowColor = 'black';
                     ctx.shadowBlur = 0;
                     ctx.shadowOffsetX = 2;
                     ctx.shadowOffsetY = 2;
                     ctx.fillText(char, cursorX, ly);
                     ctx.shadowOffsetX = 0; 
                     ctx.shadowOffsetY = 0;
                } else {
                     // Normal draw
                     ctx.fillText(char, cursorX, ly);
                }
                
                cursorX += charWidth + letterSpacing;
                charGlobalIndex++;
            }
            // Add space for the newline/space that was split (approximate, just increment index)
            charGlobalIndex++; 
        });
        ctx.restore();
      }
      
      onCanvasReady(canvas.toDataURL('image/png'));
    };

    draw();

  }, [
    mainImageSrc, bgImageSrc, text, textColor, gradientColor1, gradientColor2, accentColor, imageBrightness, 
    overlayTop, overlayBottom, overlayColor, overlayOpacity, overlayHeight,
    showSpotlight, spotlightX, spotlightY,
    filter, brightness, contrast, saturation, blur,
    fontWeight, lineHeight, letterSpacing, fontFamily,
    imageScale, imageX, imageY,
    textScale, textX, textY, textBackdrop, textOpacity,
    letterColors,
    onCanvasReady
  ]);

  // --- Handlers ---
  
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    const { x, y } = getPointerPos(e);
    dragStartRef.current = { x, y };

    // Priority 1: Text
    const tBounds = boundsRef.current.text;
    if (tBounds && x >= tBounds.x && x <= tBounds.x + tBounds.w && y >= tBounds.y && y <= tBounds.y + tBounds.h) {
      setIsDragging('text');
      onInteractionStart();
      return;
    }

    // Priority 2: Spotlight (if visible)
    const sBounds = boundsRef.current.spotlight;
    if (sBounds) {
        const dist = Math.sqrt(Math.pow(x - sBounds.x, 2) + Math.pow(y - sBounds.y, 2));
        if (dist <= sBounds.r) {
            setIsDragging('spotlight');
            onInteractionStart();
            return;
        }
    }

    // Priority 3: Image (Main)
    const iBounds = boundsRef.current.image;
    if (iBounds && x >= iBounds.x && x <= iBounds.x + iBounds.w && y >= iBounds.y && y <= iBounds.y + iBounds.h) {
      setIsDragging('image');
      onInteractionStart();
      return;
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    e.preventDefault();
    
    const { x, y } = getPointerPos(e);
    const dx = x - dragStartRef.current.x;
    const dy = y - dragStartRef.current.y;
    
    onPositionChange(isDragging, dx, dy);
    
    dragStartRef.current = { x, y };
  };

  const handlePointerUp = () => {
    if (isDragging) {
        onInteractionEnd();
    }
    setIsDragging(null);
    dragStartRef.current = null;
  };

  return (
    <div className="w-full h-full flex justify-center items-center bg-gray-950 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 touch-none">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full h-auto w-auto object-contain shadow-xl cursor-move"
        style={{ aspectRatio: '9/16' }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
    </div>
  );
};

export default CanvasEditor;