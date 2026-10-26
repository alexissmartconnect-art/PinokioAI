# Pinokio AI Studio & Copilot

Assistant local pour l'écosystème [Pinokio](https://pinokio.co) : plan d'entraînement de
LoRA, livraison vers Wan2GP, direction LTX, diagnostic VRAM et copilote IA.

Disponible en **web (dev)** et en **application Windows 11** (dossier autonome + zip).

## Fonctionnalités

| Onglet | Rôle |
|--------|------|
| **KAI Expérience Cinématique** | manifestes d'expérience, stratégie 3D/vidéo/DOM |
| **Vision & Prompts IA** | analyse d'images/vidéos → prompts Wan2GP / LTX / Hunyuan |
| **Wan2GP & LTX Menus** | réglages avançés (steps, CFG, offload) selon la VRAM |
| **LTX Director & Plugins** | timeline, plugins WanGP, LoRA Manager |
| **LoRA Studio** | plan d'entraînement LoRA (MiniMax H3, Wan, FLUX, SDXL, Z-Image, LTX), fichiers prêts à exécuter, livraison Wan2GP, envoi à guaardvark |
| **Modules Pinokio** | annuaire d'apps (Wan2GP, Maestro, guaardvark…) |
| **Disk Saver & Système** | déduplication, espace disque, santé CUDA |
| **Scripts Pinokio.js** | génération `pinokio.js` / `install.json` / `run.json` |
| **Logs & Crash Doctor** | journal d'erreurs, diagnostic IA |

## Démarrage (développement)

```bash
npm install --legacy-peer-deps   # conflit de peer esbuild/vite déjà présent
cp .env.example .env             # clés IA, guaardvark, chemins loras
npm run dev                      # http://127.0.0.1:3000
```

Vérifications : `npm run lint` (tsc), `npm run build` (vite).

## Application Windows 11

Voir **[docs/WINDOWS_APP.md](docs/WINDOWS_APP.md)**.

```bash
npm run package:win:full   # → release/Pinokio AI Studio/ + zip
```

Le dossier livré contient `Setup.bat` (runtime Node, `.env`, raccourcis Bureau/Menu
Démarrer), `Pinokio AI Studio.vbs` (lancement silencieux), `Stop.bat`, une icône, et le
serveur + frontend compilés. Le workflow GitHub Actions **Windows 11 build** produit
l'archive à chaque push et l'attache aux releases `v*`.

## Entraînement de LoRA

Voir **[docs/LORA_TRAINING.md](docs/LORA_TRAINING.md)**.

En résumé : photos d'un personnage → `dataset-checklist.md` + configuration ai-toolkit
(MiniMax H3 FL2VA Pruned 20B) ou musubi/kohya/ltx-trainer → `.safetensors` →
`loras/minimax_h3/` de WanGP, ou directement via **« Enter Lora URL »**.

## API

| Route | Rôle |
|-------|------|
| `GET /api/health` | état, version, port, providers configurés |
| `POST /api/lora/plan` | plan LoRA normalisé (même moteur que l'UI) |
| `POST /api/lora/health` · `/train` · `GET /api/lora/subjects/:id` · `/train/cancel` | pont guaardvark |
| `GET /api/lora/wangp` · `/api/lora/wangp/:folder` · `/api/lora/wangp/:folder/:file` | livraison Wan2GP |
| `POST /api/analyze-image` · `/api/chat` · `/api/kai/*` | analyse, copilote, KAI |

## Configuration

`.env` (voir `.env.example`) : `GEMINI_API_KEY`, `OPENROUTER_API_KEY`,
`MISTRAL_API_KEY`, `GUAARDVARK_URL`, `GUAARDVARK_API_KEY`, `GUAARDVARK_ALLOW_REMOTE`,
`WANGP_LORAS_ROOT`, `PORT`, `HOST`.
