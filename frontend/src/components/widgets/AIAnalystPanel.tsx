import React, { useEffect, useRef, useState } from 'react';
import { BrainCircuit, ChevronDown, Copy, Check, Loader2, AlertTriangle, X, Settings } from 'lucide-react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { useAIConfig } from '../../hooks/useAIConfig';
import { CoTEntity } from '../../types';

interface AIAnalystPanelProps {
  entity: CoTEntity | null;
  onClose: () => void;
  isOpen: boolean;
  // allow injecting an initial trigger to run the analysis immediately when opened
  autoRunTrigger?: number;
}

const LOOKBACK_OPTIONS = [
  { label: '1 h', value: 1 },
  { label: '6 h', value: 6 },
  { label: '12 h', value: 12 },
  { label: '24 h', value: 24 },
  { label: '48 h', value: 48 },
  { label: '72 h', value: 72 },
];

export const AIAnalystPanel: React.FC<AIAnalystPanelProps> = ({ entity, onClose, isOpen, autoRunTrigger }) => {
  const { text, isStreaming, error, generatedAt, run, reset } = useAnalysis();
  const { config: aiConfig, isSaving, selectModel } = useAIConfig();
  const entityUid = entity?.uid;

  const [lookback, setLookback] = useState(24);
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as tokens arrive
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text, isStreaming]);

  // Cancel stream on uid change or when closing
  useEffect(() => {
    if (!isOpen || !entityUid) {
      reset();
    }
  }, [entityUid, isOpen, reset]);

  // Handle settings drawer reset during render instead of effect to avoid cascading renders
  if (!isOpen && isSettingsOpen) {
    setIsSettingsOpen(false);
  }

  const prevTriggerRef = useRef<number>(0);

  // Handle auto-run when triggered from the sidebar
  useEffect(() => {
    if (isOpen && entityUid && autoRunTrigger && autoRunTrigger > 0 && autoRunTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = autoRunTrigger;
      run(entityUid, lookback);
    }
  }, [autoRunTrigger, isOpen, entityUid, lookback, run]);

  const handleRun = () => {
    if (!entity) return;
    run(entity.uid, lookback);
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  // Determine accent color based on entity type (similar to SidebarRight logic)
  let accentColor = 'text-white/50';
  let accentBorder = 'border-white/20';
  let accentBg = 'bg-black/80';

  if (entity) {
    const isShip = entity.type.includes('S');
    const isSat = entity.type === 'a-s-K' || entity.type.indexOf('K') === 4;

    if (isSat) {
      accentColor = 'text-purple-400';
      accentBorder = 'border-purple-400/30';
      accentBg = 'bg-gradient-to-br from-black/90 to-purple-400/5';
    } else if (isShip) {
      accentColor = 'text-sea-accent';
      accentBorder = 'border-sea-accent/30';
      accentBg = 'bg-gradient-to-br from-black/90 to-sea-accent/5';
    } else {
      accentColor = 'text-air-accent';
      accentBorder = 'border-air-accent/30';
      accentBg = 'bg-gradient-to-br from-black/90 to-air-accent/5';
    }
  }

  const activeModelLabel = aiConfig?.available_models.find(m => m.id === aiConfig.active_model)?.label ?? aiConfig?.active_model ?? "AI ENGINE";

  return (
    <div className="absolute top-[80px] right-[400px] z-[200] w-[450px] animate-in slide-in-from-right fade-in duration-300">
      <div className={`flex flex-col border ${accentBorder} ${accentBg} backdrop-blur-xl rounded shadow-2xl overflow-hidden shadow-black/50`}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <BrainCircuit size={16} className={accentColor} />
            <span className="text-xs font-bold tracking-[.3em] text-white/70">AI_ANALYST_PANEL</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-1.5 rounded transition-colors ${isSettingsOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/50 hover:text-white/80'}`}
              title="AI Engine Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white/80 transition-colors"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Model Selection Drawer (Conditionally rendered) */}
        {isSettingsOpen && (
          <div className="border-b border-white/5 bg-black/60 p-3 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Active Engine</span>
              {!aiConfig && <Loader2 size={12} className="animate-spin text-white/30" />}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {aiConfig?.available_models.map(model => {
                const isActive = model.id === aiConfig.active_model;
                return (
                  <button
                    key={model.id}
                    disabled={isSaving}
                    onClick={() => {
                      selectModel(model.id);
                      setIsSettingsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded border transition-all text-left group ${isActive
                      ? 'bg-violet-500/20 border-violet-400/50'
                      : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold tracking-wider ${isActive ? 'text-violet-300' : 'text-white/70 group-hover:text-white/90'}`}>
                        {model.label}
                      </span>
                      <span className={`text-[8px] font-mono ${model.local ? 'text-emerald-400/80' : 'text-white/40 group-hover:text-white/60'}`}>
                        {model.local ? 'LOCAL · ' : ''}{model.provider.toUpperCase()}
                      </span>
                    </div>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Target Info & Controls */}
        <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold tracking-[.2em] text-white/40 uppercase mb-0.5">Target Entity</span>
              <span className={`text-sm font-bold truncate ${accentColor} drop-shadow-[0_0_5px_currentColor]`}>
                {entity?.callsign || entity?.uid || 'NONE SELECTED'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={lookback}
                  onChange={e => setLookback(Number(e.target.value))}
                  disabled={isStreaming || !entity}
                  className="appearance-none bg-black/60 border border-white/10 rounded px-2 py-1 pr-6 text-[10px] text-white/70 font-mono focus:outline-none focus:border-white/30 disabled:opacity-40 cursor-pointer"
                >
                  {LOOKBACK_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} Lookback</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 text-white/30 pointer-events-none" />
              </div>

              {isStreaming ? (
                <button
                  onClick={reset}
                  title="Cancel analysis"
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded text-[10px] text-red-400 transition-colors focus-visible:ring-1 focus-visible:ring-red-400 outline-none"
                >
                  <X size={12} />
                  <span className="font-bold tracking-widest">HALT</span>
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={!entity}
                  title="Run AI analysis"
                  className={`flex items-center gap-1.5 px-4 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold tracking-widest ${accentColor} hover:brightness-125 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-visible:ring-1 focus-visible:ring-violet-400 outline-none`}
                >
                  RUN
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-white/30">
             <span>ENGINE: <span className="text-violet-400/80">{activeModelLabel}</span></span>
             {!entity && <span className="text-amber-400/80">Select an entity to analyze</span>}
          </div>
        </div>

        {/* Output Area */}
        <div className="flex flex-col bg-black/60 h-[350px]">
          {/* Output header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-2">
              {isStreaming && (
                <Loader2 size={12} className={`${accentColor} animate-spin`} />
              )}
              <span className="text-[10px] font-mono text-white/40 tracking-widest">
                {isStreaming ? 'PROCESSING TELEMETRY...' : generatedAt
                  ? `ASSESSMENT GENERATED ${generatedAt.toLocaleTimeString()}`
                  : 'READY FOR INPUT'}
              </span>
            </div>
            {text && !isStreaming && (
              <button
                onClick={handleCopy}
                title="Copy assessment"
                className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/10 rounded border border-transparent hover:border-white/10 text-[9px] font-mono text-white/50 hover:text-white/80 transition-colors focus-visible:ring-1 focus-visible:ring-violet-400 outline-none"
              >
                {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            )}
          </div>

          {/* Scrollable text body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
          >
            {error ? (
              <div className="flex items-start gap-2 text-xs font-mono text-red-400/80 bg-red-500/10 p-3 rounded border border-red-500/20">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : !text && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center text-white/10 gap-3">
                <BrainCircuit size={48} className="opacity-20" />
                <span className="text-[10px] font-mono tracking-widest uppercase">Awaiting Tasking</span>
              </div>
            ) : (
              <p className="text-xs font-mono text-white/80 leading-relaxed whitespace-pre-wrap">
                {text}
                {isStreaming && (
                  <span className={`inline-block w-2 h-4 ml-1 ${accentColor.replace('text-', 'bg-')} animate-pulse align-middle`} />
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
