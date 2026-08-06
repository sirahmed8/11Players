'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModernColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

const PRESET_SWATCHES = [
  '#10b981', // Emerald
  '#059669', // Deep Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Royal Blue
  '#1d4ed8', // Dark Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#d946ef', // Magenta
  '#f43f5e', // Crimson
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Gold
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#0f172a', // Slate Dark
  '#1e293b', // Slate Medium
  '#475569', // Slate Light
  '#94a3b8', // Silver
  '#f8fafc', // Clean White
  '#000000', // Pitch Black
];

export default function ModernColorPicker({
  value,
  onChange,
  label,
  className = '',
}: ModernColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || '#10b981');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      onChange(val);
    }
  };

  const copyHex = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-emerald-500/60 transition-all cursor-pointer group shadow-inner"
      >
        <div
          className="w-6 h-6 rounded-lg border border-white/20 shadow-sm shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono text-xs font-extrabold text-white uppercase tracking-wider">
          {value}
        </span>
        <Palette className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors ml-1" />
      </button>

      {/* Modern Popover Picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 w-64 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-3.5"
            style={{ backdropFilter: 'blur(24px)' }}
          >
            {/* Header / Active Color Display */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-xl border border-white/20 shadow-md"
                  style={{ backgroundColor: value }}
                />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Color</p>
                  <p className="font-mono text-xs font-extrabold text-white uppercase">{value}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={copyHex}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy HEX code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                Pro Kit Swatches
              </p>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => {
                      onChange(swatch);
                      setHexInput(swatch);
                    }}
                    className={`w-9 h-9 rounded-xl border border-white/10 transition-all flex items-center justify-center cursor-pointer hover:scale-110 ${
                      value.toLowerCase() === swatch.toLowerCase()
                        ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-105 shadow-lg'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: swatch }}
                  >
                    {value.toLowerCase() === swatch.toLowerCase() && (
                      <Check
                        className={`w-4 h-4 ${
                          ['#f8fafc', '#eab308', '#84cc16', '#94a3b8'].includes(swatch)
                            ? 'text-slate-950'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom HEX Input */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                Custom HEX Color
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={7}
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#10B981"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white uppercase outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
