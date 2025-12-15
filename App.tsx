import React, { useState, useRef, useEffect } from 'react';
import { analyzeImageForCover, generateCreativeImage } from './services/geminiService';
import CanvasEditor from './components/CanvasEditor';
import ColorPicker from './components/ColorPicker';
import { AspectRatio, EditorState, TextBackdropType, FilterType } from './types';

// Icons
const IconMagic = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const IconUpload = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconDownload = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const IconSparkles = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const IconLayout = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
const IconUndo = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const IconRedo = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>;
const IconAdjust = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;

// Constants
// Reduced to 8 Essential Styles for reliability and speed
const FONTS = [
    'Inter',            // Modern Sans
    'Playfair Display', // Elegant Serif
    'Bebas Neue',       // Tall Display
    'Dancing Script',   // Handwritten
    'Pacifico',         // Fun/Retro
    'Cinzel',           // Cinematic/Luxury
    'Oswald',           // Condensed Sans
    'Montserrat'        // Geometric Sans
];

const BACKDROPS: { label: string, value: TextBackdropType }[] = [
    { label: 'None', value: 'none' },
    { label: 'Soft Shadow', value: 'shadow' },
    { label: 'Soft Brush', value: 'soft-brush' },
    { label: 'Solid Black', value: 'solid-black' },
    { label: 'Solid White', value: 'solid-white' },
    { label: 'Glass', value: 'glass' },
    { label: 'Neon Glow', value: 'neon' },
    { label: 'Outline', value: 'outline' },
    { label: 'Sticker', value: 'sticker' },
    { label: 'Gradient Bar', value: 'gradient-bar' },
    { label: 'Retro Box', value: 'retro-shadow' },
    { label: 'Cyber Frame', value: 'cyber' },
    { label: 'Soft Blur', value: 'soft-blur' }
];

const FILTERS: { label: string, value: FilterType }[] = [
    { label: 'Normal', value: 'none' },
    { label: 'Grayscale', value: 'grayscale' },
    { label: 'Sepia', value: 'sepia' },
    { label: 'Vintage', value: 'vintage' },
    { label: 'Warm', value: 'warm' },
    { label: 'Cool', value: 'cool' },
    { label: 'Dramatic', value: 'dramatic' },
];

const MAIN_COLORS = [
    '#000000', // Black
    '#ffffff', // White
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7'  // Purple
];

const DEFAULT_STATE: EditorState = {
    text: "Your Story",
    textColor: "#ffffff",
    accentColor: "#ffffff", 
    gradientColor1: "#000000",
    gradientColor2: "#000000", 
    overlayTop: false,
    overlayBottom: false,
    overlayColor: "#000000",
    overlayOpacity: 1.0,
    overlayHeight: 0.35,
    showSpotlight: false,
    spotlightX: 0,
    spotlightY: 0,
    fontFamily: 'Inter',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: 0,
    textBackdrop: 'none',
    textOpacity: 1.0,
    letterColors: {},
    textScale: 1,
    textX: 0,
    textY: 0,
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    imageBrightness: 'dark',
    filter: 'none',
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0
};

export default function App() {
  // --- Resources State (Not part of undo/redo history usually) ---
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [genPrompt, setGenPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [finalCanvasData, setFinalCanvasData] = useState<string | null>(null);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number>(-1);

  // --- History & Editor State ---
  const [history, setHistory] = useState<EditorState[]>([DEFAULT_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const state = history[historyIndex];

  // Helper to update state. 
  const updateState = (updates: Partial<EditorState>, pushToHistory = false) => {
      const newState = { ...state, ...updates };
      
      if (pushToHistory) {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(newState);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
      } else {
          // Replace current tip of history (live update)
          const newHistory = [...history];
          newHistory[historyIndex] = newState;
          setHistory(newHistory);
      }
  };

  const undo = () => {
      if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
      if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };

  // Used to snapshot state BEFORE a drag/slide begins so we can revert or properly calculate diff
  const snapshotRef = useRef<EditorState | null>(null);

  const handleInteractionStart = () => {
      snapshotRef.current = state;
  };

  const handleInteractionEnd = () => {
      if (snapshotRef.current) {
          const newHistory = history.slice(0, historyIndex); // Items before current
          newHistory.push(snapshotRef.current); // The Clean State before drag
          newHistory.push(state); // The Dirty State after drag
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          snapshotRef.current = null;
      }
  };

  // --- Handlers ---
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImageFile(file);
      setMainImage(URL.createObjectURL(file));
      updateState({ text: "Your Story" }, true);
    }
  };

  const handleAnalyze = async () => {
    if (!mainImageFile) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeImageForCover(mainImageFile);
      const updates: Partial<EditorState> = {};
      
      updates.text = result.suggestedCaption || state.text;
      if (result.colorPalette && result.colorPalette.length > 0) {
        // Keep analysis monochrome preference or use user accent, but defaulting to logic:
        updates.accentColor = result.colorPalette[1] || result.colorPalette[0];
        updates.gradientColor1 = result.colorPalette[0];
        updates.gradientColor2 = result.colorPalette[1] || '#000000';
        updates.textColor = result.imageBrightness === 'bright' ? '#000000' : '#ffffff';
        updates.overlayColor = result.colorPalette[0]; // Set overlay to dominant
      }
      if (result.imageBrightness) {
        updates.imageBrightness = result.imageBrightness;
      }
      updateState(updates, true); // Push analysis result
    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateBg = async () => {
    if (!genPrompt) return;
    setIsGenerating(true);
    try {
      const imageUrl = await generateCreativeImage(genPrompt, AspectRatio.STORY_9_16);
      setBgImage(imageUrl);
    } catch (err) {
      console.error(err);
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (finalCanvasData) {
      const link = document.createElement('a');
      link.download = `story-canvas-${Date.now()}.png`;
      link.href = finalCanvasData;
      link.click();
    }
  };
  
  const handlePositionChange = (target: 'image' | 'text' | 'spotlight', dx: number, dy: number) => {
      if (target === 'image') {
          updateState({
              imageX: state.imageX + dx,
              imageY: state.imageY + dy
          }, false);
      } else if (target === 'spotlight') {
          updateState({
              spotlightX: state.spotlightX + dx,
              spotlightY: state.spotlightY + dy
          }, false);
      } else {
          updateState({
              textX: state.textX + dx,
              textY: state.textY + dy
          }, false);
      }
  };
  
  const resetImageTransforms = () => {
      updateState({ imageScale: 1, imageX: 0, imageY: 0 }, true);
  };
  const resetTextTransforms = () => {
      updateState({ textScale: 1, textX: 0, textY: 0, textOpacity: 1.0 }, true);
  };
  const resetSpotlight = () => {
      updateState({ spotlightX: 0, spotlightY: 0 }, true);
  };
  const resetFilters = () => {
      updateState({
          filter: 'none',
          brightness: 1,
          contrast: 1,
          saturation: 1,
          blur: 0
      }, true);
  }

  const handleSliderChange = (key: keyof EditorState, val: number) => {
      updateState({ [key]: val }, false);
  };
  
  const handleSliderCommit = () => {
     handleInteractionEnd();
  };

  const handleSliderStart = () => {
      handleInteractionStart();
  };

  const handleLetterColorChange = (color: string) => {
      if (selectedCharIndex === -1) {
          updateState({ textColor: color }, false);
      } else {
          const newColors = { ...state.letterColors, [selectedCharIndex]: color };
          updateState({ letterColors: newColors }, false);
      }
  };

  const handleColorCommit = () => {
      updateState({}, true);
  };
  
  // Reusable Control for Slider + Number
  const AdjustmentControl = ({ label, prop, min, max, step }: { label: string, prop: keyof EditorState, min: number, max: number, step: number }) => (
      <div>
         <label className="text-[10px] text-zinc-500 uppercase block mb-1">{label}</label>
         <div className="flex items-center gap-2">
             <input 
                type="range" min={min} max={max} step={step} 
                value={state[prop] as number} 
                onMouseDown={handleSliderStart} onTouchStart={handleSliderStart}
                onChange={(e) => handleSliderChange(prop, Number(e.target.value))} 
                onMouseUp={handleSliderCommit} onTouchEnd={handleSliderCommit}
                className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <input 
                type="number" step={step} 
                value={(state[prop] as number).toFixed(step < 1 ? 2 : 0)}
                onChange={(e) => updateState({ [prop]: Number(e.target.value) }, true)}
                className="w-16 bg-zinc-950 border border-zinc-700 rounded text-xs px-2 py-1 text-right focus:border-white outline-none"
            />
         </div>
     </div>
  );

  return (
    <div className="flex h-screen w-full bg-black text-zinc-100 font-sans overflow-hidden">
      
      {/* --- Sidebar: Controls --- */}
      <div className="w-full md:w-[400px] flex flex-col border-r border-zinc-800 bg-black h-full overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 sticky top-0 bg-black z-10 flex justify-between items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white"><IconMagic /></span>
            <h1 className="text-xl font-bold tracking-tight text-white">StoryCanvas</h1>
          </div>
          
          <div className="flex gap-1">
             <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors" title="Undo">
                <IconUndo />
             </button>
             <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors" title="Redo">
                <IconRedo />
             </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          
          {/* 1. Upload */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Source</h2>
            <div className="flex gap-2">
                <label className="flex-1 cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg border border-zinc-700 flex flex-col items-center gap-2 transition-all">
                    <IconUpload />
                    <span className="text-xs font-medium">Main Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                </label>
            </div>
          </div>

          {/* 2. Text */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Text</h2>
            <input 
                type="text" 
                value={state.text}
                onChange={(e) => updateState({ text: e.target.value }, false)}
                onBlur={() => updateState({}, true)} // Commit on blur
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-500 outline-none transition-all placeholder-zinc-600"
            />
            {mainImageFile && (
               <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                {isAnalyzing ? <span className="animate-pulse">Thinking...</span> : <><IconSparkles /> Auto-Enhance</>}
              </button>
             )}
          </div>

           {/* 3. Layout / Image Position */}
           <div className="space-y-4 pt-4 border-t border-zinc-800">
             <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><IconLayout /> Position & Scale</h2>
                <button onClick={resetImageTransforms} className="text-[10px] text-zinc-500 hover:text-white uppercase">Reset</button>
             </div>
             
             <div className="grid grid-cols-2 gap-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                 <div className="col-span-2">
                    <AdjustmentControl label="Scale" prop="imageScale" min={0.5} max={2.0} step={0.01} />
                 </div>
                 <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Position X</label>
                    <input 
                        type="number" step="10"
                        value={Math.round(state.imageX)}
                        onChange={(e) => updateState({ imageX: Number(e.target.value) }, true)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded text-xs px-2 py-1.5 focus:border-white outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Position Y</label>
                    <input 
                        type="number" step="10"
                        value={Math.round(state.imageY)}
                        onChange={(e) => updateState({ imageY: Number(e.target.value) }, true)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded text-xs px-2 py-1.5 focus:border-white outline-none"
                    />
                 </div>
             </div>
           </div>

           {/* 4. Filters & Adjustments */}
           <div className="space-y-4 pt-4 border-t border-zinc-800">
             <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><IconAdjust /> Filters & Adjust</h2>
                <button onClick={resetFilters} className="text-[10px] text-zinc-500 hover:text-white uppercase">Reset</button>
             </div>

             <div className="space-y-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                 <div>
                     <label className="text-[10px] text-zinc-500 uppercase block mb-1">Preset Filter</label>
                     <div className="flex flex-wrap gap-1">
                         {FILTERS.map(f => (
                             <button
                                key={f.value}
                                onClick={() => updateState({ filter: f.value }, true)}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${state.filter === f.value ? 'bg-zinc-100 border-white text-black' : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'}`}
                             >
                                 {f.label}
                             </button>
                         ))}
                     </div>
                 </div>
                 
                 <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                    <AdjustmentControl label="Brightness" prop="brightness" min={0} max={2} step={0.05} />
                    <AdjustmentControl label="Contrast" prop="contrast" min={0} max={2} step={0.05} />
                    <AdjustmentControl label="Saturation" prop="saturation" min={0} max={2} step={0.05} />
                    <AdjustmentControl label="Blur (px)" prop="blur" min={0} max={20} step={1} />
                 </div>
             </div>
           </div>
          
           {/* 5. Typography */}
           <div className="space-y-4 pt-4 border-t border-zinc-800">
             <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Typography</h2>
                <button onClick={resetTextTransforms} className="text-[10px] text-zinc-500 hover:text-white uppercase">Reset</button>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                 <select value={state.fontFamily} onChange={(e) => updateState({ fontFamily: e.target.value }, true)} className="bg-zinc-900 border border-zinc-700 rounded p-2 text-xs focus:outline-none focus:border-white">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                 </select>
                 <select value={state.textBackdrop} onChange={(e) => updateState({ textBackdrop: e.target.value as TextBackdropType }, true)} className="bg-zinc-900 border border-zinc-700 rounded p-2 text-xs focus:outline-none focus:border-white">
                    {BACKDROPS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                 </select>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 flex justify-between">Size <span className="text-zinc-500">{Math.round(state.textScale * 100)}%</span></label>
                <input type="range" min="0.5" max="2" step="0.1" 
                    value={state.textScale} 
                    onMouseDown={handleSliderStart} onTouchStart={handleSliderStart}
                    onChange={(e) => handleSliderChange('textScale', Number(e.target.value))} 
                    onMouseUp={handleSliderCommit} onTouchEnd={handleSliderCommit}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"/>
             </div>
             
             <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 flex justify-between">Opacity <span className="text-zinc-500">{Math.round(state.textOpacity * 100)}%</span></label>
                <input type="range" min="0" max="1" step="0.01" 
                    value={state.textOpacity} 
                    onMouseDown={handleSliderStart} onTouchStart={handleSliderStart}
                    onChange={(e) => handleSliderChange('textOpacity', Number(e.target.value))} 
                    onMouseUp={handleSliderCommit} onTouchEnd={handleSliderCommit}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"/>
             </div>
           </div>

           {/* 6. Colors & Gradients */}
           <div className="space-y-4 pt-4 border-t border-zinc-800">
             <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Colors & Overlay</h2>
             
             {/* Main Palette Selection */}
             <div className="space-y-2">
                 <label className="text-xs text-zinc-400">Gradient Palette</label>
                 <div className="flex flex-wrap gap-2">
                     {MAIN_COLORS.map(c => (
                         <button 
                            key={c} 
                            onClick={() => updateState({ overlayColor: c }, true)}
                            className={`w-6 h-6 rounded-full border border-zinc-600 focus:ring-2 ring-white/50 ${state.overlayColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                            style={{ backgroundColor: c }}
                         />
                     ))}
                     <input 
                        type="color" 
                        value={state.overlayColor}
                        onChange={(e) => updateState({ overlayColor: e.target.value }, false)}
                        onBlur={() => updateState({}, true)}
                        className="w-6 h-6 rounded-full overflow-hidden p-0 border-0 cursor-pointer" 
                     />
                 </div>
             </div>
             
             {/* Gradient Adjustment Sliders */}
             <div className="grid grid-cols-2 gap-3">
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase">Intensity</label>
                    <input type="range" min="0" max="1" step="0.01" 
                        value={state.overlayOpacity} 
                        onMouseDown={handleSliderStart} onTouchStart={handleSliderStart}
                        onChange={(e) => handleSliderChange('overlayOpacity', Number(e.target.value))} 
                        onMouseUp={handleSliderCommit} onTouchEnd={handleSliderCommit}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"/>
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase">Height</label>
                    <input type="range" min="0.1" max="1" step="0.01" 
                        value={state.overlayHeight} 
                        onMouseDown={handleSliderStart} onTouchStart={handleSliderStart}
                        onChange={(e) => handleSliderChange('overlayHeight', Number(e.target.value))} 
                        onMouseUp={handleSliderCommit} onTouchEnd={handleSliderCommit}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"/>
                 </div>
             </div>

             {/* Overlay Toggles */}
             <div className="flex flex-wrap gap-4 mt-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={state.overlayTop} onChange={(e) => updateState({ overlayTop: e.target.checked }, true)} className="accent-white" />
                     <span className="text-xs text-zinc-300">Top Fade</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={state.overlayBottom} onChange={(e) => updateState({ overlayBottom: e.target.checked }, true)} className="accent-white" />
                     <span className="text-xs text-zinc-300">Bottom Fade</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer w-full">
                     <input type="checkbox" checked={state.showSpotlight} onChange={(e) => updateState({ showSpotlight: e.target.checked }, true)} className="accent-white" />
                     <span className="text-xs text-zinc-300">Draggable Spotlight <span className="text-zinc-600 text-[10px] ml-1">(Drag center)</span></span>
                 </label>
                 {state.showSpotlight && (
                     <button onClick={resetSpotlight} className="text-[10px] text-zinc-500 hover:text-white uppercase ml-auto">Reset Spot</button>
                 )}
             </div>

             <div className="h-px bg-zinc-800 my-2"></div>
             
             {/* Character Color Tinter */}
             <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs text-zinc-400 uppercase">Text Color Tint</label>
                    {selectedCharIndex !== -1 && (
                         <button onClick={() => setSelectedCharIndex(-1)} className="text-[10px] text-zinc-500 hover:text-white uppercase">Deselect Char</button>
                    )}
                </div>
                
                {/* Visual Text Selector */}
                <div className="flex flex-wrap gap-1 p-2 bg-zinc-900 rounded border border-zinc-800 max-h-24 overflow-y-auto">
                    {state.text.split('').map((char, index) => {
                         const color = state.letterColors[index] || state.textColor;
                         const isSelected = selectedCharIndex === index;
                         return (
                            <button
                                key={index}
                                onClick={() => setSelectedCharIndex(isSelected ? -1 : index)}
                                className={`w-6 h-8 text-xs font-bold border rounded flex items-center justify-center transition-all ${isSelected ? 'border-white ring-2 ring-white/50 scale-110 z-10' : 'border-zinc-700 hover:border-zinc-500'}`}
                                style={{ backgroundColor: isSelected ? '#3f3f46' : 'transparent', color: color }}
                            >
                                {char === ' ' ? <span className="opacity-20">_</span> : char}
                            </button>
                         );
                    })}
                </div>

                <div className="mt-2">
                    <label className="text-[10px] text-zinc-500 uppercase mb-1 block">
                        {selectedCharIndex === -1 ? "Global Text Color" : `Character #${selectedCharIndex + 1} Color`}
                    </label>
                     <ColorPicker 
                        color={selectedCharIndex === -1 ? state.textColor : (state.letterColors[selectedCharIndex] || state.textColor)}
                        onChange={handleLetterColorChange}
                        onCommit={handleColorCommit}
                     />
                </div>
             </div>

             <div className="flex flex-col gap-1 mt-2">
                <label className="text-[10px] text-zinc-500 uppercase">Accent</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={state.accentColor} onChange={(e) => updateState({ accentColor: e.target.value }, true)} className="h-6 w-6 rounded bg-transparent cursor-pointer border-0" />
                    <span className="text-xs font-mono text-zinc-300">{state.accentColor}</span>
                </div>
             </div>
           </div>
           
           {/* 7. Creative AI */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">AI Texture</h2>
            <div className="space-y-3">
              <textarea 
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Describe a mood..."
                className="w-full h-12 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-zinc-500 outline-none resize-none placeholder-zinc-600"
              />
              <button onClick={handleGenerateBg} disabled={isGenerating || !genPrompt} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-xs font-medium uppercase transition-all disabled:opacity-50">
                {isGenerating ? "Dreaming..." : "Generate"}
              </button>
            </div>
          </div>

        </div>
        
        <div className="mt-auto p-6 border-t border-zinc-800 bg-black sticky bottom-0">
          <button onClick={handleDownload} className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
            <IconDownload /> Download
          </button>
        </div>
      </div>

      {/* --- Preview --- */}
      <div className="flex-1 bg-black relative flex items-center justify-center p-8 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="relative h-[90%] aspect-[9/16] max-h-[850px] shadow-2xl rounded-2xl overflow-hidden ring-8 ring-[#09090b] bg-black">
          <CanvasEditor 
            mainImageSrc={mainImage}
            bgImageSrc={bgImage}
            
            {...state}

            onCanvasReady={setFinalCanvasData}
            onPositionChange={handlePositionChange}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                 <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-white font-medium text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}