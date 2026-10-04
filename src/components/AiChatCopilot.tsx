import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  User, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  FileCode,
  Sliders,
  Trash2,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Zap,
  Wand2,
  Settings
} from 'lucide-react';
import { ChatMessage, ChatAttachment, HardwareVram, Wan2GPSettings, AIProvider, AIProviderModel } from '../types';

interface AiChatCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVram: HardwareVram;
  currentSettings: Wan2GPSettings;
  onApplySettingsToConfigurator?: (settings: Partial<Wan2GPSettings>, prompt?: string) => void;
  availableModels?: AIProviderModel[];
  selectedModel?: AIProviderModel;
  onSelectModel?: (model: AIProviderModel) => void;
  onOpenApiSettings?: () => void;
}

const AVAILABLE_AI_MODELS: AIProviderModel[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'Multimodal rapide & analyse visuelle directe pour Wan2GP / LTX',
    badge: 'Natif & Vision',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    description: 'Expert en scripts complexes, architectures logiques & correction',
    badge: 'OpenRouter',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (OpenRouter)',
    provider: 'openrouter',
    description: 'Raisonnement pointu sur les optimisations VRAM & paramètres',
    badge: 'OpenRouter',
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 2',
    provider: 'mistral',
    description: 'Excellence en prompt crafting cinématographique & code',
    badge: 'Mistral AI',
  },
  {
    id: 'codestral-latest',
    name: 'Codestral (Mistral)',
    provider: 'mistral',
    description: 'Spécialiste de la génération de scripts Pinokio.js, install & run',
    badge: 'Mistral Code',
  },
];

export const AiChatCopilot: React.FC<AiChatCopilotProps> = ({
  isOpen,
  onClose,
  selectedVram,
  currentSettings,
  onApplySettingsToConfigurator,
  availableModels = AVAILABLE_AI_MODELS,
  selectedModel: externalSelectedModel,
  onSelectModel: externalOnSelectModel,
  onOpenApiSettings,
}) => {
  const [internalSelectedModel, setInternalSelectedModel] = useState<AIProviderModel>(AVAILABLE_AI_MODELS[0]);
  const activeModel = externalSelectedModel || internalSelectedModel;
  const setActiveModel = (m: AIProviderModel) => {
    if (externalOnSelectModel) {
      externalOnSelectModel(m);
    } else {
      setInternalSelectedModel(m);
    }
  };

  const [providerStatuses, setProviderStatuses] = useState<{ [key: string]: boolean }>({
    gemini: true,
    openrouter: false,
    mistral: false,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour ! Je suis votre Copilote Pinokio multi-fournisseurs (Gemini 3.8 Flash, OpenRouter, Mistral AI).
      
Je vous assiste pour :
1. **Analyser & corriger vos prompts** pour Wan 2.1 (14B/1.3B) et LTX-Video.
2. **Optimiser vos curseurs VRAM** en temps réel pour votre GPU (${selectedVram}).
3. **Diagnostiquer vos logs de crash** CUDA, Conda ou Caddy (via le trombone 📎).
4. **Générer des scripts d'installation 1-clic** pour n'importe quel dépôt GitHub d'IA.

Sélectionnez votre moteur IA préféré dans le menu en haut ou posez directement votre question !`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: 'gemini',
      modelUsed: 'gemini-3.8-flash',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check health and provider availability
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.providers) {
          setProviderStatuses({
            gemini: Boolean(data.providers.gemini?.available),
            openrouter: Boolean(data.providers.openrouter?.available),
            mistral: Boolean(data.providers.mistral?.available),
          });
        }
      })
      .catch((err) => console.error('Error fetching providers:', err));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, pendingAttachments]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = () => {
        const attachment: ChatAttachment = {
          name: file.name,
          type: isImg ? 'image' : 'file',
          mimeType: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          size: file.size,
        };

        setPendingAttachments((prev) => [...prev, attachment]);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputMessage;
    if ((!text.trim() && pendingAttachments.length === 0) || isLoading) return;

    const currentAtts = [...pendingAttachments];
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim() || (currentAtts.length > 0 ? `[A analysé ${currentAtts.map(a => a.name).join(', ')}]` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAtts.length > 0 ? currentAtts : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setPendingAttachments([]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeModel.provider,
          model: activeModel.id,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          context: {
            gpuVram: selectedVram,
            activeSettings: currentSettings,
          },
        }),
      });

      if (!res.ok) throw new Error('Erreur de réponse du serveur IA');

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        provider: data.provider || activeModel.provider,
        modelUsed: data.modelUsed || activeModel.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Une erreur est survenue lors de l'appel à ${activeModel.name} : ${err?.message || 'Erreur réseau'}. Veuillez vérifier la configuration de l'API ou basculer sur Gemini.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0c0e12] border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Pinokio Copilot Multi-API</span>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </h2>
            <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1.5">
              <span>Assistant Intelligent</span>
              <span>•</span>
              <span className="text-slate-400">{selectedVram} VRAM</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenApiSettings && (
            <button
              onClick={onOpenApiSettings}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Ouvrir les réglages des APIs et modèles"
            >
              <Settings className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* API Model Selector Bar */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Moteur IA :</span>
        </div>

        <select
          value={activeModel.id}
          onChange={(e) => {
            const chosen = availableModels.find(m => m.id === e.target.value);
            if (chosen) setActiveModel(chosen);
          }}
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-amber-400 truncate"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} [{m.badge}]
            </option>
          ))}
        </select>

        {onOpenApiSettings && (
          <button
            onClick={onOpenApiSettings}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-slate-700/80 shrink-0"
            title="Gérer les clés d'API et actualiser les modèles"
          >
            <Settings className="w-3 h-3 text-amber-400" />
            <span>Réglages</span>
          </button>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/80 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        {[
          'Diagnostiquer un crash ou log d\'erreur CUDA',
          'Comment installer Wan2GP & LTX sur Windows 11 ?',
          'Tester la connexion locale à Pinokio',
          'Régler LTX Director v1.3.25 T33 pour mon GPU',
          'Corriger et booster mon prompt Wan2GP',
          'Comment configurer Pinokio Home Server ?',
          'Ajuster mes curseurs pour 8GB sans crash',
          'Résoudre erreur Caddy / Conda',
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-300 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs'
              }`}
            >
              {/* Render Attached Files inside Message */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-black/10">
                  {msg.attachments.map((att, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-black/10 bg-black/10 p-1.5 flex items-center gap-2">
                      {att.type === 'image' ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-14 h-14 object-cover rounded-md border border-black/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-800/40 flex items-center justify-center text-slate-900">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="overflow-hidden text-[11px]">
                        <div className="font-bold truncate">{att.name}</div>
                        <div className="opacity-75 text-[10px]">
                          {att.type === 'image' ? 'Image jointe' : 'Fichier joint'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap font-sans">
                {msg.content}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-black/10 text-[10px] opacity-70">
                <div className="flex items-center gap-2">
                  <span>{msg.timestamp}</span>
                  {msg.provider && (
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-black/20 border border-black/10">
                      {msg.provider} ({msg.modelUsed || ''})
                    </span>
                  )}
                </div>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === msg.id ? 'Copié' : 'Copier'}</span>
                  </button>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-300 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{activeModel.name} analyse, corrige et formule les conseils...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Attachments Preview Area (before sending) */}
      {pendingAttachments.length > 0 && (
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="relative group bg-slate-900 border border-slate-700/80 rounded-lg p-1.5 flex items-center gap-2 pr-6 shrink-0"
            >
              {att.type === 'image' ? (
                <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded object-cover" />
              ) : (
                <FileCode className="w-6 h-6 text-amber-400" />
              )}
              <span className="text-[11px] text-slate-200 font-mono max-w-[120px] truncate">
                {att.name}
              </span>
              <button
                type="button"
                onClick={() => removePendingAttachment(idx)}
                className="absolute right-1 top-1 text-slate-400 hover:text-red-400 p-0.5 rounded"
                title="Supprimer la pièce jointe"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Box with Attachment Button and Model Indicator */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* File Attachment Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.json,.txt,.log,.js,.py,.sh"
            className="hidden"
            id="chat-file-upload"
          />

          {/* Attachment Button */}
          <label
            htmlFor="chat-file-upload"
            className="cursor-pointer p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors border border-slate-700/80 flex items-center justify-center shrink-0"
            title="Joindre une image (JPG, PNG, WebP) ou un fichier de config/log (JSON, TXT, LOG)"
          >
            <Paperclip className="w-4 h-4" />
          </label>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              pendingAttachments.length > 0
                ? "Ajoutez des consignes pour ce fichier..."
                : `Demandez à ${activeModel.name} d'analyser, corriger ou guider...`
            }
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />

          <button
            type="submit"
            disabled={isLoading || (!inputMessage.trim() && pendingAttachments.length === 0)}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20 shrink-0"
            title="Envoyer le message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-2">
          <span>🛡️ Traitement 100% sécurisé côté serveur (proxy API)</span>
          <span className="font-mono text-amber-400 font-semibold">{activeModel.name}</span>
        </div>
      </div>

    </div>
  );
};
