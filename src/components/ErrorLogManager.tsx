import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Copy, 
  Check, 
  Send, 
  Bot, 
  Terminal, 
  Activity, 
  Filter, 
  Download, 
  CheckCircle2, 
  Zap, 
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SystemErrorLog, AIProviderModel, HardwareVram } from '../types';

interface ErrorLogManagerProps {
  selectedVram: HardwareVram;
  onOpenCopilotWithLog?: (log: SystemErrorLog) => void;
  availableModels?: AIProviderModel[];
}

export const ErrorLogManager: React.FC<ErrorLogManagerProps> = ({
  selectedVram,
  onOpenCopilotWithLog,
  availableModels = [],
}) => {
  const [logs, setLogs] = useState<SystemErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'client' | 'server' | 'pinokio' | 'ai_provider' | 'cuda'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Log Submission state
  const [manualErrorText, setManualErrorText] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualSource, setManualSource] = useState<'client' | 'pinokio' | 'cuda' | 'server'>('pinokio');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Auto-Diagnosis state
  const [activeDiagnosingId, setActiveDiagnosingId] = useState<string | null>(null);
  const [diagnosisResults, setDiagnosisResults] = useState<{ [logId: string]: string }>({});
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState<{ [logId: string]: string }>({});

  // Fetch logs
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/logs?level=${filterLevel}&source=${filterSource}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Erreur récupération des logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterLevel, filterSource]);

  // Submit manual error / crash log
  const handleRecordManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualErrorText.trim()) return;

    setIsSubmittingLog(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: manualSource,
          level: 'error',
          title: manualTitle.trim() || `Log d'erreur ${manualSource.toUpperCase()}`,
          message: manualErrorText.trim(),
          context: {
            gpuVram: selectedVram,
            submittedAt: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        setManualErrorText('');
        setManualTitle('');
        await fetchLogs();
      }
    } catch (err) {
      console.error('Erreur enregistrement log manuel:', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Clear all logs
  const handleClearLogs = async () => {
    if (!window.confirm('Voulez-vous réinitialiser l\'historique des logs d\'erreur ?')) return;
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      if (res.ok) {
        setDiagnosisResults({});
        await fetchLogs();
      }
    } catch (err) {
      console.error('Erreur suppression logs:', err);
    }
  };

  // Trigger AI Auto-Diagnosis
  const handleDiagnoseLog = async (log: SystemErrorLog) => {
    setActiveDiagnosingId(log.id);
    setExpandedLogId(log.id);
    try {
      const res = await fetch('/api/logs/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logId: log.id,
          customInstructions: customInstructions[log.id] || '',
          provider: 'gemini',
          model: 'gemini-3.8-flash',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setDiagnosisResults(prev => ({ ...prev, [log.id]: data.analysis }));
        }
      }
    } catch (err: any) {
      setDiagnosisResults(prev => ({
        ...prev,
        [log.id]: `Échec du diagnostic IA : ${err?.message || 'Erreur réseau'}`
      }));
    } finally {
      setActiveDiagnosingId(null);
    }
  };

  // Copy to clipboard
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export logs to JSON
  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pinokio-error-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-900/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5" />
                <span>Centre de Télémétrie & Logs d'Erreurs</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                GPU: {selectedVram} VRAM
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Diagnostic & Auto-Correction IA des Pannes
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Capturez, analysez et résolvez instantanément tous vos crashs de génération vidéo, erreurs CUDA Out-Of-Memory, conflits Conda ou problèmes de ports Pinokio grâce au moteur de diagnostic automatique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Actualiser les Logs</span>
            </button>

            <button
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold flex items-center gap-2 border border-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Exporter JSON</span>
            </button>

            <button
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold flex items-center gap-2 border border-red-800/60 transition-all active:scale-95 disabled:opacity-50"
              title="Vider tous les logs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vider</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Submit Manual Log + Log History with Auto-Correction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (5 cols): Submit Crash Log / Terminal Trace */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Injecter un Crash Log ou Erreur Terminal
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Collez ci-dessous le message d'erreur de votre terminal Pinokio, une trace de traceback Python, un log CUDA ou un problème de démarrage :
            </p>

            <form onSubmit={handleRecordManualLog} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Titre ou description courte :</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Ex: CUDA out of memory sur Wan 2.1 14B à l'étape 12"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Source :</label>
                  <select
                    value={manualSource}
                    onChange={(e: any) => setManualSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="pinokio">Pinokio App / Caddy</option>
                    <option value="cuda">CUDA / PyTorch GPU</option>
                    <option value="server">Serveur / API</option>
                    <option value="client">Navigateur Client</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">GPU VRAM configuré :</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold">
                    {selectedVram}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Trace d'erreur complète (Traceback, Log, Console) :
                </label>
                <textarea
                  value={manualErrorText}
                  onChange={(e) => setManualErrorText(e.target.value)}
                  rows={7}
                  placeholder={`Exemple:\nRuntimeError: CUDA out of memory. Tried to allocate 4.20 GiB (GPU 0; 8.00 GiB total capacity; 6.10 GiB already allocated by PyTorch)...\nou\nError: Port 7860 already in use\nou\nModuleNotFoundError: No module named 'sageattention'`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Quick Preset Errors to Test */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">Exemples fréquents (cliquer pour charger) :</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'CUDA Out Of Memory', text: 'torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 3.80 GiB (GPU 0; 8.00 GiB total capacity; 6.90 GiB already allocated). Set PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True' },
                    { label: 'Port 7860 Bloqué', text: 'OSError: [Errno 98] Address already in use: 0.0.0.0:7860 (Pinokio process or zombie python instance still running)' },
                    { label: 'Missing SageAttention', text: 'ModuleNotFoundError: No module named \'sageattention\' when loading Wan2GP attentionBackend' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setManualTitle(preset.label);
                        setManualErrorText(preset.text);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-800 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingLog || !manualErrorText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSubmittingLog ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Enregistrer & Préparer la Correction IA</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols): Captured Logs List & AI Solutions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-5">
            
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Journal des Incidents ({logs.length})
                </h2>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <select
                  value={filterLevel}
                  onChange={(e: any) => setFilterLevel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">Tous niveaux</option>
                  <option value="error">Erreurs uniquement</option>
                  <option value="warning">Avertissements</option>
                  <option value="info">Informations</option>
                </select>

                <select
                  value={filterSource}
                  onChange={(e: any) => setFilterSource(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">Toutes sources</option>
                  <option value="cuda">CUDA / GPU</option>
                  <option value="pinokio">Pinokio</option>
                  <option value="ai_provider">Moteur IA</option>
                  <option value="server">Serveur</option>
                </select>
              </div>
            </div>

            {/* Logs List */}
            {logs.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Aucune erreur détectée</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Votre système fonctionne sans anomalies. Si vous rencontrez un crash dans Wan2GP ou Pinokio, collez le log dans le formulaire de gauche pour obtenir la solution immédiate.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isDiagnosing = activeDiagnosingId === log.id;
                  const diagnosis = diagnosisResults[log.id];

                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        log.level === 'error'
                          ? 'bg-red-950/20 border-red-900/40 hover:border-red-700/60'
                          : log.level === 'warning'
                          ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Log Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              log.level === 'error'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : log.level === 'warning'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {log.level}
                            </span>

                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                              {log.source.toUpperCase()}
                            </span>

                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <h3 className="font-bold text-xs text-white truncate">
                            {log.title}
                          </h3>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyText(log.message, log.id)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                            title="Copier le message d'erreur"
                          >
                            {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                            title="Développer / Réduire"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Log Message Preview / Full */}
                      <div className="p-3 rounded-lg bg-black/60 border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                        {isExpanded ? log.message : (log.message.length > 180 ? `${log.message.slice(0, 180)}...` : log.message)}
                      </div>

                      {/* Stack Trace if available and expanded */}
                      {isExpanded && log.stack && (
                        <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/30 font-mono text-[10px] text-red-300/90 overflow-x-auto max-h-36">
                          <span className="text-red-400 font-bold block mb-1">Stack Trace :</span>
                          <pre>{log.stack}</pre>
                        </div>
                      )}

                      {/* Context Metadata */}
                      {isExpanded && log.context && (
                        <div className="text-[10px] font-mono text-slate-400 flex flex-wrap gap-2 pt-1 border-t border-slate-800/50">
                          {Object.entries(log.context).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {k}: <strong className="text-slate-200">{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Auto-Correction AI Trigger Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleDiagnoseLog(log)}
                          disabled={isDiagnosing}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                          {isDiagnosing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                              <span>L'IA analyse et génère la solution...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                              <span>Diagnostiquer & Corriger avec l'IA</span>
                            </>
                          )}
                        </button>

                        {onOpenCopilotWithLog && (
                          <button
                            onClick={() => onOpenCopilotWithLog(log)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                          >
                            <Bot className="w-3.5 h-3.5 text-amber-400" />
                            <span>Résoudre dans le Chat Copilot</span>
                          </button>
                        )}
                      </div>

                      {/* AI Diagnosis Result Display */}
                      {diagnosis && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-amber-950/30 border border-indigo-500/40 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Diagnostic & Solution Proposée par l'IA :</span>
                            </span>
                            <button
                              onClick={() => copyText(diagnosis, `diag-${log.id}`)}
                              className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1"
                            >
                              {copiedId === `diag-${log.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              <span>Copier la solution</span>
                            </button>
                          </div>

                          <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed space-y-2">
                            {diagnosis}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
