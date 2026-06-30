/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { IssueCategory, SeverityLevel } from '../types';
import { Upload, Camera, MapPin, Sparkles, Terminal, FileText, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportingFormProps {
  selectedCoords: { lat: number; lng: number; address: string; neighborhood: string } | null;
  onSubmitReport: (data: {
    title: string;
    description: string;
    category: IssueCategory;
    severity: SeverityLevel;
    location: { lat: number; lng: number; address: string; neighborhood: string };
    imageUrl: string;
  }) => Promise<void>;
  currentUsername: string;
}

// Preset visual simulation templates to let the user test instantly!
const SIMULATED_PHOTOS = [
  {
    name: 'Dadar Pothole',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    title: 'Monsoon Pothole near Dadar West Station',
    description: 'Severe structural asphalt failure causing motorbikes and auto-rickshaws to skid on Gokhale Road, Dadar West.',
    category: 'Roads & Potholes' as IssueCategory,
  },
  {
    name: 'Bandra Main Leak',
    imageUrl: 'https://images.unsplash.com/photo-1485134532658-d720895a3b5e?auto=format&fit=crop&w=600&q=80',
    title: 'BMC Main Pipeline Rupture',
    description: 'Massive drinking water leakage bubbling up from beneath the pavement near Hill Road, Bandra West, eroding sub-grade soil.',
    category: 'Water Leakage' as IssueCategory,
  },
  {
    name: 'BEST Dark Pole',
    imageUrl: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=600&q=80',
    title: 'Faulty BEST Streetlamp Outage',
    description: 'Decorative streetlight fitting next to Marine Drive Promenade remains completely pitch dark at night, causing safety concerns.',
    category: 'Electrical/Streetlights' as IssueCategory,
  },
];

export default function ReportingForm({ selectedCoords, onSubmitReport, currentUsername }: ReportingFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Roads & Potholes');
  const [severity, setSeverity] = useState<SeverityLevel>('Medium');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Loading & logs state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file and convert to Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG/JPG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageFile(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Helper to simulate photo templates
  const applySimulation = (tpl: typeof SIMULATED_PHOTOS[0]) => {
    setTitle(tpl.name + ' Incident');
    setDescription(tpl.description);
    setCategory(tpl.category);
    setImageFile(tpl.imageUrl);
  };

  // Log simulator
  const appendLogWithDelay = (log: string, delayMs: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setAiLogs((prev) => [...prev, log]);
        resolve();
      }, delayMs);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoords) return;
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the Title and Description.');
      return;
    }

    setIsSubmitting(true);
    setAiLogs([]);

    // Simulate real-time terminal diagnostics
    const nowStr = () => new Date().toLocaleTimeString();
    await appendLogWithDelay(`[${nowStr()}] SECURE TUNNEL ESTABLISHED WITH CIVIC SERVICE PORTAL`, 400);
    await appendLogWithDelay(`[${nowStr()}] UPLOADING MEDIA ATTACHMENTS (SIZE: ${imageFile ? Math.round(imageFile.length / 1024) : 0}KB)...`, 500);
    await appendLogWithDelay(`[${nowStr()}] CONTACTING GOOGLE GEMINI 2.5 INSPECTION SUITE`, 600);
    await appendLogWithDelay(`[${nowStr()}] ANALYZING GEOSPATIAL VECTOR: LAT: ${selectedCoords.lat.toFixed(4)}, LNG: ${selectedCoords.lng.toFixed(4)}`, 500);
    await appendLogWithDelay(`[${nowStr()}] PARSING TEXT CONTEXT FOR KEYWORD CROSS-REFERENCE`, 500);
    await appendLogWithDelay(`[${nowStr()}] GEMINI CLASSIFICATION ENGINE RUNNING VISUAL DEEP SCAN...`, 800);

    try {
      await onSubmitReport({
        title,
        description,
        category,
        severity,
        location: {
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          address: selectedCoords.address,
          neighborhood: selectedCoords.neighborhood,
        },
        imageUrl: imageFile || '',
      });

      await appendLogWithDelay(`[${nowStr()}] SUCCESS: CIVIC ENTRY REGISTERED UNDER ID: ${Math.random().toString(36).substring(3, 7).toUpperCase()}`, 300);
      await appendLogWithDelay(`[${nowStr()}] SYSTEM STAMP ASSIGNED: [STATUS: REPORTED] • [SEVERITY: AUTO-SET]`, 300);
      
      setTimeout(() => {
        // Reset Form
        setTitle('');
        setDescription('');
        setImageFile(null);
        setIsSubmitting(false);
        setAiLogs([]);
      }, 1000);

    } catch (err) {
      console.error(err);
      await appendLogWithDelay(`[${nowStr()}] EXCEPTION: GEMINI ANALYZER OFFLINE, APPLYING MUNICIPAL RULE-BASED MATCHING`, 600);
      setIsSubmitting(false);
    }
  };

  return (
    <div id="reporting-form-card" className="bg-[#ffffff] border border-[#e5e5e5] shadow-sm rounded-[14.4px] overflow-hidden h-full flex flex-col relative text-[#161616] transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.002]">
      {/* Header Stamp style */}
      <div className="bg-[#ffffff] text-[#161616] px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#7b7a7c]" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#555555]">MUNICIPAL CIVIL ENTRY FORM</span>
        </div>
        <span className="font-mono text-[9px] bg-[#ffffff] border border-[#e5e5e5] text-[#555555] px-2.5 py-0.5 rounded-[14.4px] uppercase tracking-wider">
          USER: {currentUsername.toUpperCase().replace(' ', '_')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step 1: Location selection details */}
        <div className={`rounded-[14.4px] border p-4 font-grotesk text-xs shadow-sm transition-all duration-300 ease-in-out hover:shadow hover:border-neutral-400 hover:scale-[1.005] ${
          selectedCoords ? 'bg-[#ffffff] border-[#e5e5e5] text-[#161616]' : 'bg-[#ff4c24]/5 border-[#ff4c24]/20 text-[#161616]'
        }`}>
          {selectedCoords ? (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#ff4c24] shrink-0 mt-0.5" />
              <div>
                <p className="font-mono uppercase tracking-wider text-[9px] text-[#7b7a7c]">Tagged Location</p>
                <p className="font-grotesk font-semibold text-[#161616] mt-1 text-sm">{selectedCoords.address}</p>
                <p className="text-[#555555] font-mono mt-1 text-[10px]">
                  District Zone: <span className="underline">{selectedCoords.neighborhood}</span> • Lat: {selectedCoords.lat.toFixed(5)}, Lng: {selectedCoords.lng.toFixed(5)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-[#161616]">
              <AlertCircle className="w-4 h-4 text-[#ff4c24] shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#ff4c24]">LOCATION PIN REQUIRED</p>
                <p className="text-[11px] mt-1 text-[#555555] leading-relaxed">Please click or drag on the District Map on the left to set the exact reporting location.</p>
              </div>
            </div>
          )}
        </div>

        {selectedCoords && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block font-mono text-[9px] text-[#7b7a7c] uppercase tracking-widest mb-1.5">
                Incident Subject / Title *
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="e.g. Monsoon Pothole near Maharaja Junction"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] text-[#161616] placeholder-[#7b7a7c] font-grotesk text-xs focus:outline-none focus:border-[#ff4c24] transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-mono text-[9px] text-[#7b7a7c] uppercase tracking-widest mb-1.5">
                Detailed Incident Description *
              </label>
              <textarea
                required
                rows={3}
                disabled={isSubmitting}
                placeholder="Describe the depth of damage, nearby risks, and clear hazards to people or vehicles..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] text-[#161616] placeholder-[#7b7a7c] font-grotesk text-xs focus:outline-none focus:border-[#ff4c24] transition"
              />
            </div>

            {/* Manual Categories */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[9px] text-[#7b7a7c] uppercase tracking-widest mb-1.5">
                  Manual Category
                </label>
                <select
                  disabled={isSubmitting}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full px-2.5 py-2 border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] text-[#161616] font-grotesk text-xs focus:outline-none focus:border-[#ff4c24] transition cursor-pointer"
                >
                  <option value="Roads & Potholes">Roads & Potholes</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Electrical/Streetlights">Electrical/Streetlights</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Public Safety/Infrastructure">Public Safety/Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[9px] text-[#7b7a7c] uppercase tracking-widest mb-1.5">
                  Manual Severity
                </label>
                <select
                  disabled={isSubmitting}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full px-2.5 py-2 border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] text-[#161616] font-grotesk text-xs focus:outline-none focus:border-[#ff4c24] transition cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* File Drag and Drop */}
            <div>
              <label className="block font-mono text-[9px] text-[#7b7a7c] uppercase tracking-widest mb-1.5">
                Proof of Evidence (Photo Upload)
              </label>

              {imageFile ? (
                <div className="relative border border-[#e5e5e5] rounded-[14.4px] overflow-hidden group">
                  <img src={imageFile} alt="Evidence Preview" className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-[#ffffff]/90 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="px-4 py-2 border border-[#ff4c24] text-[#161616] rounded-[14.4px] font-mono text-[10px] uppercase tracking-widest hover:bg-[#ff4c24] hover:text-white cursor-pointer transition-all"
                    >
                      REMOVE EVIDENCE
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-[14.4px] p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#ff4c24] bg-[#ff4c24]/5'
                      : 'border-[#e5e5e5] bg-[#ffffff] hover:border-[#ff4c24] hover:bg-[#ff4c24]/5'
                  }`}
                >
                  <Upload className="w-5 h-5 text-[#7b7a7c] mb-2" />
                  <p className="font-grotesk text-xs text-[#161616] uppercase tracking-wider">DRAG AND DROP INCIDENT PHOTO</p>
                  <p className="font-mono text-[9px] text-[#7b7a7c] mt-1 uppercase">or click to browse local folders</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* simulated preset buttons */}
            <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] p-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow hover:border-neutral-400 hover:scale-[1.005]">
              <p className="font-mono text-[9px] text-[#7b7a7c] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#7b7a7c]" /> Quick Simulate (No Camera Needed)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SIMULATED_PHOTOS.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => applySimulation(tpl)}
                    className="px-3 py-1.5 text-[10px] bg-[#ffffff] border border-[#e5e5e5] rounded-[14.4px] text-[#161616] hover:border-[#ff4c24] hover:text-[#ff4c24] transition font-mono cursor-pointer"
                  >
                    + {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Warning / Badge notification */}
            <div className="bg-[#ffffff] border border-[#e5e5e5] border-l-2 border-l-[#ff4c24] rounded-[14.4px] p-4 flex gap-2.5 text-[#555555] text-[11px] leading-relaxed shadow-sm transition-all duration-300 ease-in-out hover:shadow hover:border-neutral-400 hover:scale-[1.005]">
              <Sparkles className="w-4 h-4 text-[#ff4c24] shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[#161616] uppercase tracking-widest block mb-0.5 text-[9px]">AI ASSISTED CIVIL ACTION</span>
                Submitting coordinates triggers Gemini vision engine to analyze structural integrity and auto-generate the official engineering work summary.
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#161616] hover:bg-[#222222] border border-[#e5e5e5] hover:border-[#ff4c24] text-white rounded-[14.4px] font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#ff4c24]" />
              COMPILE & SEND TO CIVIC RADAR
            </button>
          </form>
        )}
      </div>

      {/* Terminal Loading Screen in Ember glow */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#ffffff] border border-[#e5e5e5] flex flex-col p-6 font-mono text-xs text-[#ff4c24] z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#ff4c24] animate-pulse" />
                <span className="tracking-widest text-[#161616] uppercase font-mono text-[10px]">CIVIC RADAR INTERCEPTOR</span>
              </div>
              <span className="text-[9px] text-[#7b7a7c] uppercase font-mono">SECURE SHELL</span>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto font-mono text-[10px] leading-relaxed text-[#ff4c24]">
              {aiLogs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              <div className="h-4 w-2 bg-[#ff4c24] animate-pulse inline-block ml-1"></div>
            </div>

            <div className="border-t border-[#e5e5e5] pt-4 mt-4 flex items-center justify-between text-[9px] text-[#7b7a7c] shrink-0">
              <span>SYSTEM STATE: PROCESSING</span>
              <span>DO NOT CLOSE TERMINAL</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
