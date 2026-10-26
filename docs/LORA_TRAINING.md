# LoRA Studio — entraînement de LoRA dans Pinokio AI

Nouvel onglet **LoRA Studio** (Navbar → `LoRA Studio`) : il transforme un dataset et un
GPU en plan d'entraînement complet, sans rien installer.

Le studio est **autonome** : il génère les fichiers d'entraînement à exécuter dans un venv
local. Il sait aussi **déléguer** le job à une instance
[guaardvark](https://github.com/guaardvark/guaardvark) si elle tourne à côté, via son
plugin `lora_trainer` (Cast Studio).

## Ce que fait l'onglet

1. **Choix du modèle de base** — chaque base embarque sa recette (framework, résolutions,
   VRAM, rangs, steps) :

   | Base | Framework généré | VRAM conseillée | Notes |
   |------|------------------|-----------------|-------|
   | MiniMax H3 FL2VA Pruned 20B | ai-toolkit (`arch: minimax_h3`) | 12 Go (low VRAM) → 24 Go | Vidéo, 512 px, LoRA utilisable dans WanGP |
   | Wan 2.1 / 2.2 14B | musubi-tuner | 12 Go min (avec `blocks_to_swap`) | Vidéo, 480p |
   | Wan 2.1 1.3B | musubi-tuner | 8 Go | Point d'entrée vidéo |
   | FLUX.1 dev | ai-toolkit | 12 Go (quantize) → 24 Go | Image, 1024 px |
   | SDXL 1.0 | kohya sd-scripts | 10 Go | Compatibilité maximale |
   | Z-Image Turbo | guaardvark `lora_trainer` | 12 Go (512 px) | Backend par défaut de guaardvark |
   | LTX-Video 0.9.x | ltx-trainer | 16 Go | Vidéo, 768 px |

2. **Dataset** — dossier, nombre d'images, trigger word, classe, style de légende. Le
   nombre d'images pilote les steps recommandés.
3. **Hyperparamètres** — auto-réglés pour le profil GPU de la Navbar (`6GB` → `Mac_Silicon`) :
   résolution, rank/alpha, lr, steps, batch, accumulation, optimiseur, précision,
   gradient checkpointing, `blocks_to_swap` pour Wan.
4. **Estimations** — VRAM, durée, steps, epochs, taille du LoRA, et diagnostics :
   - `VRAM_WILL_OOM` (erreur bloquante) : la configuration ne tient pas ;
   - `MPS_UNSUPPORTED` : musubi-tuner / ltx-trainer exigent CUDA ;
   - `GUAARDVARK_TRAIN_TIMEOUT` : guaardvark tue les runs au-delà de 30 min (CUDA) / 3 h (MPS) ;
   - `H3_LOW_RES`, `H3_RANK_ABOVE_16`, `H3_BELOW_MIN_VRAM`, `LOW_VRAM_UNNEEDED` (spécifiques H3) ;
   - `DATASET_TOO_SMALL`, `LR_TOO_HIGH`, `FLUX_LOW_RES`, `STEPS_BELOW_RECOMMENDED`, etc.
5. **Fichiers générés** (copiables/téléchargeables depuis l'onglet) :
   - `dataset-checklist.md` — format des `.txt`, contrôles qualité, exemples de légendes ;
   - `train.sh` + `dataset.toml` (musubi/kohya), `<nom>.yaml` + `run.sh` (ai-toolkit),
     `ltx_lora.yaml` + `train.sh` (ltx-trainer), `setup-guaardvark.sh` (Z-Image) ;
   - `lora-plan.json` — le plan complet, archivable ;
   - `dispatch-guaardvark.sh` — l'appel `curl` équivalent au bouton d'envoi.
6. **Envoi à guaardvark** (optionnel) — sonde de connexion puis dispatch du job.

## Livraison WanGP (Wan2GP)

Un LoRA ne sert à rien s'il n'arrive pas dans l'interface de génération. Le studio sait où
WanGP attend chaque famille de modèles :

| Base | Dossier WanGP |
|------|----------------|
| MiniMax H3 | `loras/minimax_h3/` |
| Wan 14B (i2v) | `loras/wan_i2v/` |
| Wan 1.3B | `loras/wan_1.3B/` |
| FLUX.1 | `loras/flux/` |
| Z-Image | `loras/z_image/` |
| LTX-Video | `loras/ltxv/` |
| SDXL | — (WanGP n'héberge pas SDXL) |

Deux façons de livrer le fichier, toutes deux présentées dans le panneau **Livraison WanGP** :

1. **Copie** — l'artefact `install-to-wangp.sh` place le `.safetensors` dans le bon
   sous-dossier (`WANGP_LORAS` pour changer de racine), puis *Refresh* dans WanGP.
2. **Sans copie** — le serveur liste le dossier et sert chaque `.safetensors` en HTTP ;
   l'URL affichée se colle dans le champ **« Enter Lora URL »** de WanGP, qui la télécharge.

La racine est configurable : `WANGP_LORAS_ROOT` (prioritaire). Sinon l'app détecte
automatiquement `~/pinokio/app/loras`, `~/pinokio/app/wan2gp/loras`,
`~/pinokio/app/WanGP/loras`, `~/pinokio/app/Wan2GP/loras`, `~/WanGP/loras` ou
`~/Wan2GP/loras`, et retombe sinon sur `~/pinokio/app/loras`. La réponse de
`/api/lora/wangp` indique la racine retenue (`rootSource`: `env` | `auto` | `default`). Seuls les
sous-dossiers connus de WanGP et les `.safetensors` sont exposés, avec un garde-fou contre
les traversées de chemin.

Routes ajoutées :

| Route | Rôle |
|-------|------|
| `GET /api/lora/wangp` | Racine + sous-dossiers présents et nombre de LoRA |
| `GET /api/lora/wangp/:folder` | Fichiers `.safetensors` du dossier, avec URL prête à coller |
| `GET /api/lora/wangp/:folder/:name` | Téléchargement du `.safetensors` (streaming) |

### Spécificités MiniMax H3

- Entraînement via **ai-toolkit** (`arch: minimax_h3`), sur le checkpoint pruned int8
  ConvRot (`Comfy-Org/MiniMax-H3`) + text encoder Qwen3-VL-32B en nvfp4.
- `network_kwargs.ignore_if_contains: ["adaln_proj"]` : les projections AdaLN n'existent
  plus sur le build pruned, les entraîner produirait des clés inutilisables.
- L'**adaptateur de training** `ostris/minimax_h3_training_adapter_v1` doit être chargé
  pendant l'entraînement (il neutralise la distillation du guidance) et n'est jamais
  fusionné ni nécessaire en inférence.
- `low_vram` + `layer_offloading` dès qu'on descend sous 24 Go (un run 12 Go tient en 512 px).
- H3 est **guidance-distilled** : `guidance_scale: 1`, pas de CFG ni de prompt négatif.
  WanGP relit indifféremment les LoRA rank 8 / 16 / 64 (traduction `lora_affine`).

## Pont guaardvark

Endpoints ajoutés dans `server.ts` :

| Route | Rôle |
|-------|------|
| `GET  /api/lora/config` | URL par défaut, présence de la clé API |
| `POST /api/lora/plan` | Plan normalisé (même moteur que l'UI, utilisable en `curl`/MCP) |
| `POST /api/lora/health` | Sonde `/api/health`, `/api/training/hardware`, `/api/training/libraries` |
| `POST /api/lora/train` | `POST {url}/api/cast/subjects/<id>/train` avec `training_settings` |
| `GET  /api/lora/subjects/:id` | État d'entraînement (`training_status`, erreur, chemin du LoRA) |
| `POST /api/lora/train/cancel` | `POST {url}/api/cast/subjects/<id>/train/cancel` |

Le pont applique les règles de guaardvark avant d'appeler :

- une base non déclarée **train ready** dans son registre média (`zimage-turbo`,
  `sdxl-legacy`) est refusée côté Pinokio AI avec `409 BASE_MODEL_NOT_TRAIN_READY` et une
  suggestion ;
- les hyperparamètres sont envoyés dans les bornes que guaardvark normalise
  (résolution ≥ 512 multiple de 64, rank 4–64, alpha 4–128, lr 1e-4, steps calculés) ;
- `X-API-Key` n'est ajouté que si `GUAARDVARK_API_KEY` est défini côté Pinokio AI.

## Configuration

Dans `.env` (voir `.env.example`) :

```bash
GUAARDVARK_URL="http://127.0.0.1:5000"   # Flask de guaardvark (:5055 sur macOS)
GUAARDVARK_API_KEY=""                    # seulement si guaardvark l'exige
GUAARDVARK_TIMEOUT_MS=8000
GUAARDVARK_ALLOW_REMOTE=""              # "" = localhost/LAN seulement (anti-SSRF)
WANGP_LORAS_ROOT="$HOME/pinokio/app/loras"   # racine loras/ de WanGP
```

Sans guaardvark, tout le reste fonctionne : le studio est un générateur de plan et de
scripts, il ne lance rien de lui-même.

## Limites assumées

- Les valeurs de VRAM et de durée sont des **ordres de grandeur** (budgets communautaires
  Wan/FLUX/SDXL/LTX + budget déclaré par guaardvark). Mesurez le premier run, puis ajustez.
- Le studio ne télécharge aucun poids, ne crée aucun venv et ne prépare pas les images :
  il produit les commandes et vérifie que la combinaison est jouable.
- Un LoRA vidéo entraîné sur Wan 1.3B n'est pas interchangeable avec le 14B : testez
  toujours dans Wan2GP / LTX Director avant de l'industrialiser.
