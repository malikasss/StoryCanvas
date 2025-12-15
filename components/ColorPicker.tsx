import React, { useState, useEffect, useRef, useCallback } from 'react';

interface HSV { h: number; s: number; v: number; }

const hexToHsv = (hex: string): HSV => {
  // Fallback for invalid hex
  if (!hex || !/^#([0-9A-F]{3}){1,2}$/i.test(hex)) return { h: 0, s: 0, v: 0 };

  let r = 0, g = 0, b = 0;
  // Handle shorthand #FFF
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = ({ h, s, v }: HSV): string => {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onCommit: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onCommit }) => {
  const [hsv, setHsv] = useState<HSV>(hexToHsv(color));
  const [isDragging, setIsDragging] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  // Sync internal state if prop changes externally, but avoid loops/jitter during drag
  useEffect(() => {
    if (!isDragging) {
        // Only update if valid hex
        if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
            setHsv(hexToHsv(color));
        }
    }
  }, [color, isDragging]);

  const handleAreaMove = useCallback((e: MouseEvent | TouchEvent) => {
      if (!areaRef.current) return;
      const rect = areaRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      let x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      
      // x is Saturation, y is Value (inverted: top is V=100)
      const s = x * 100;
      const v = (1 - y) * 100;
      
      const newHsv = { ...hsv, s, v };
      setHsv(newHsv);
      onChange(hsvToHex(newHsv));
  }, [hsv, onChange]);

  const handleAreaUp = useCallback(() => {
      setIsDragging(false);
      onCommit();
      window.removeEventListener('mousemove', handleAreaMove as any);
      window.removeEventListener('mouseup', handleAreaUp);
      window.removeEventListener('touchmove', handleAreaMove as any);
      window.removeEventListener('touchend', handleAreaUp);
  }, [handleAreaMove, onCommit]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
      // Don't prevent default on touch immediately to allow scrolling if not on area? 
      // Actually we want to capture drag on the area.
      if (e.type === 'touchstart') e.preventDefault(); 
      setIsDragging(true);
      handleAreaMove(e.nativeEvent);
      window.addEventListener('mousemove', handleAreaMove as any);
      window.addEventListener('mouseup', handleAreaUp);
      window.addEventListener('touchmove', handleAreaMove as any, { passive: false });
      window.addEventListener('touchend', handleAreaUp);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newH = Number(e.target.value);
      const newHsv = { ...hsv, h: newH };
      setHsv(newHsv);
      onChange(hsvToHex(newHsv));
  };
  
  const handleHueCommit = () => {
      onCommit();
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
        {/* Saturation/Value Area */}
        <div 
            ref={areaRef}
            className="w-full h-32 rounded-lg relative cursor-crosshair overflow-hidden shadow-inner ring-1 ring-white/10"
            style={{ 
                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                backgroundImage: `
                    linear-gradient(to top, #000, transparent), 
                    linear-gradient(to right, #fff, transparent)
                `
            }}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
        >
            <div 
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] -translate-x-2 -translate-y-2 pointer-events-none"
                style={{
                    left: `${hsv.s}%`,
                    top: `${100 - hsv.v}%`,
                    backgroundColor: hsvToHex(hsv)
                }}
            />
        </div>

        {/* Hue Slider */}
        <div className="relative h-4 rounded-full overflow-hidden ring-1 ring-white/10">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
            <input 
                type="range" 
                min="0" max="360" 
                value={hsv.h} 
                onChange={handleHueChange} 
                onMouseUp={handleHueCommit}
                onTouchEnd={handleHueCommit}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Simple Indicator for Hue */}
            <div 
                className="absolute top-0 bottom-0 w-1.5 bg-white shadow pointer-events-none -translate-x-0.5"
                style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
        </div>

        {/* Hex Input */}
        <div className="flex items-center gap-2 bg-zinc-950 rounded-md p-1.5 border border-zinc-700 focus-within:border-zinc-500 transition-colors">
             <div className="w-6 h-6 rounded bg-current border border-zinc-600 shadow-sm" style={{ color: hsvToHex(hsv) }}></div>
             <span className="text-zinc-500 select-none">#</span>
             <input 
                type="text" 
                value={color.replace('#', '')}
                onChange={(e) => {
                    // Allow typing without hash
                    const val = "#" + e.target.value;
                    onChange(val);
                    if (/^#[0-9A-F]{6}$/i.test(val)) {
                        setHsv(hexToHsv(val));
                    }
                }}
                onBlur={onCommit}
                className="bg-transparent text-sm font-mono w-full outline-none uppercase text-zinc-200"
                maxLength={6}
             />
        </div>
    </div>
  );
};

export default ColorPicker;