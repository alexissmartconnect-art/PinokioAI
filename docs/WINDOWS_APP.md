# Application Windows 11 — Pinokio AI Studio

L'app est une **application de bureau locale** : un serveur Node embarque l'UI et les
API, s'écoute sur `127.0.0.1` et s'ouvre dans une fenêtre dédiée (Edge/Chrome en mode
« app », sans barre d'adresse). Aucune installation de Node.js n'est nécessaire pour
l'utilisateur final.

## 1. Récupérer l'application

### Option A — télécharger l'archive (aucun outil à installer)

1. GitHub → onglet **Actions** → dernier run **« Windows 11 build »** →
   artefact **`pinokio-ai-studio-windows`** (contenu : `Pinokio-AI-Studio-<version>-win64.zip`).
2. Dézipper où vous voulez (ex. `C:\Users\<vous>\Pinokio AI Studio`).
3. Double-cliquer **`Setup.bat`** (une seule fois) : runtime Node, fichier `.env`,
   raccourcis Bureau + Menu Démarrer, puis lancement.
4. Ensuite : double-clic sur le raccourci **Pinokio AI Studio**.

> Les runs sur un tag `v*` attachent l'archive directement à la **Release** GitHub.

### Option B — construire l'archive soi-même

```bash
npm install --legacy-peer-deps
npm run package:win:full     # = node scripts/package-windows.mjs --with-node
```

Résultat : `release/Pinokio AI Studio/` + `release/Pinokio-AI-Studio-<version>-win64.zip`.

Sans `--with-node`, le dossier reste autonome mais `Setup.bat` téléchargera `node.exe`
au premier lancement (ou utilisera le Node.js du PC). Options utiles :

| Commande | Effet |
|----------|-------|
| `npm run package:win` | bundle + dossier + zip (runtime récupéré par Setup.bat) |
| `npm run package:win:full` | idem **avec** `runtime/node.exe` (≈ 30 Mo de plus) |
| `npm run package:win -- --no-zip` | dossier seulement |
| `npm run package:win -- --skip-build` | réutilise `dist/` existant |
| `npm run icon` | régénère `assets/app-icon.ico` depuis la source PNG |

## 2. Contenu du dossier livré

```
Pinokio AI Studio/
├── Pinokio AI Studio.vbs          double-clic : démarre + ouvre la fenêtre (sans console)
├── Pinokio AI Studio (console).bat même chose avec la console (diagnostic)
├── Setup.bat                      première fois : runtime + .env + raccourcis + lancement
├── Install-Shortcuts.ps1          (re)crée les raccourcis Bureau / Menu Démarrer
├── Stop.bat / Stop.ps1            arrête le serveur de CE dossier
├── .env                           configuration (clés vides au départ)
├── icon.ico · README.txt · VERSION
├── app/
│   ├── server.cjs                 Express + toutes les API, bundlé (esbuild)
│   ├── dist/                      frontend Vite compilé
│   └── .env.example
├── runtime/node.exe               présent avec --with-node (sinon Setup.bat)
└── logs/                          créé au premier lancement
```

## 3. Comment ça marche

1. `Pinokio AI Studio.vbs` appelle `Launcher.ps1` en PowerShell caché.
2. Le lanceur cherche un serveur déjà actif (`/api/health` sur le port de `.env`, puis
   3000, 3100, 3200, 3300) et vérifie que la réponse vient bien de `pinokio-ai-studio`
   (`"app": "pinokio-ai-studio"`), sinon il démarre le sien.
   S'il n'y en a pas, il démarre `node app/server.cjs` avec `NODE_ENV=production`,
   écrit les logs dans `logs/` et attend que `/api/health` réponde (15 s max).
3. Il ouvre ensuite `http://127.0.0.1:<port>/` dans une fenêtre app (Edge, sinon Chrome,
   sinon le navigateur par défaut).
4. `Stop.bat` n'arrête **que** les `node.exe` dont la ligne de commande pointe sur
   `app\server.cjs` de ce dossier : vos autres projets Node restent intacts.

Le serveur écoute sur `HOST=0.0.0.0` par défaut afin que WanGP puisse récupérer les LoRA
via « Enter Lora URL ». Pour restreindre à la machine locale, mettez `HOST=127.0.0.1`
dans `.env` (dans ce cas, collez les fichiers dans `loras/` au lieu d'utiliser l'URL).

## 4. Configuration `.env`

```ini
GEMINI_API_KEY=""          # assistant IA (facultatif)
OPENROUTER_API_KEY=""      # idem
MISTRAL_API_KEY=""         # idem
GUAARDVARK_URL="http://127.0.0.1:5000"   # LoRA délégué à guaardvark (facultatif)
GUAARDVARK_API_KEY=""
WANGP_LORAS_ROOT=""        # ex. C:/Users/vous/pinokio/app/loras
PORT=3000                  # 3000 par défaut ; l'app bascule si occupé
HOST=0.0.0.0
```

Sur Windows, utilisez des **slashs** (`C:/Users/...`) ou doublez les antislashs.

Ce `.env` (à la racine du dossier de l'app) est lu au démarrage, quel que soit le
lanceur utilisé : le serveur cherche `.env` dans le répertoire courant, puis à côté
de `app/server.cjs`, puis un niveau au-dessus. `PORT` et `HOST` y sont pris en compte.

## 5. Dépannage

| Symptôme | Cause / solution |
|----------|------------------|
| SmartScreen « Windows a protégé votre PC » | fichier téléchargé : *Informations complémentaires → Exécuter quand même* |
| « Node.js est introuvable » | relancer `Setup.bat` (connexion nécessaire) ou installer Node.js LTS |
| Le port est déjà utilisé | l'app essaie 3000→3300 ; sinon `PORT=3400` dans `.env` |
| Les clés du `.env` sont ignorées | vérifier qu'il est bien dans le dossier de l'app (à côté de `Setup.bat`) |
| Rien ne s'ouvre | lancer `Pinokio AI Studio (console).bat` et lire l'erreur |
| La fenêtre reste blanche | `logs/server.err.log` ; vérifier que `app/dist/index.html` existe |
| Raccourci cassé après déplacement | relancer `Install-Shortcuts.ps1` |
| WanGP ne voit pas le LoRA | *Refresh* dans WanGP, vérifier `loras/<famille>/`, ou utiliser l'URL du studio |
| URL de LoRA inaccessible depuis WanGP | WanGP doit être sur la même machine ; sinon `HOST=0.0.0.0` + IP du poste |

Logs : `logs/launcher.log`, `logs/server.out.log`, `logs/server.err.log`.

## 6. Ce que l'app ne fait pas (volontairement)

- Elle n'installe pas ai-toolkit / musubi-tuner / kohya, et ne lance pas un entraînement
  GPU depuis l'interface : elle produit les fichiers et les commandes (le studio affiche
  quoi copier/exécuter), ou délègue le job à guaardvark s'il tourne.
- Aucune élévation de privilèges n'est demandée : tout s'installe dans le dossier de
  l'app et dans votre profil (`%USERPROFILE%`, Menu Démarrer, Bureau).
- Aucune télémétrie sortante hors des appels aux API que **vous** configurez.

## 7. Pour les curieux : chemins d'exécution

```
développement : npm run dev            → tsx server.ts (Vite en middleware, HMR)
production    : node app/server.cjs    → NODE_ENV=production, sert app/dist
bundle        : esbuild server.ts --bundle --platform=node --format=cjs \
                  --external:vite --external:esbuild --define:process.env.APP_VERSION=...
```

`vite` est importé dynamiquement : le bundle de production ne l'embarque pas et ne le
requiert jamais sur le disque (l'app packagée ne contient pas Vite).
