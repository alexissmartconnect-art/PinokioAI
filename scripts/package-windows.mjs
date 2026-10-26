#!/usr/bin/env node
/**
 * PACKAGER WINDOWS 11 — Pinokio AI Studio
 * ============================================================================
 * Produit un dossier autonome (`release/Pinokio AI Studio/`) que l'on peut
 * copier n'importe où sur un PC Windows 11 :
 *
 *   Pinokio AI Studio/
 *   ├── Pinokio AI Studio.vbs     ← double-clic : démarre et ouvre la fenêtre
 *   ├── Pinokio AI Studio.bat     ← même chose, avec console (diagnostic)
 *   ├── Setup.bat                 ← 1re fois : runtime Node + raccourcis
 *   ├── Install-Shortcuts.ps1     ← raccourcis Bureau + Menu Démarrer
 *   ├── Stop.ps1 / Stop.bat       ← arrête le serveur
 *   ├── icon.ico, README.txt, VERSION
 *   ├── app/
 *   │   ├── server.cjs            ← serveur Express + API bundlés (esbuild)
 *   │   ├── dist/                 ← frontend Vite compilé
 *   │   └── .env.example
 *   └── runtime/node.exe          ← présent si --with-node (sinon Setup.bat le télécharge)
 *
 * Usage :
 *   npm run package:win                  # bundle + dossier (+ zip si possible)
 *   npm run package:win -- --with-node   # embarque node.exe (dossier 100 % autonome)
 *   npm run package:win -- --no-zip
 *   npm run package:win -- --skip-build  # réutilise dist/ existant
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const hasFlag = (name) => args.has(`--${name}`);

const APP_NAME = 'Pinokio AI Studio';
const NODE_RUNTIME_VERSION = process.env.NODE_RUNTIME_VERSION || '22.20.0';
const RELEASE_DIR = path.join(root, 'release');
const OUT_DIR = path.join(RELEASE_DIR, APP_NAME);

const log = (step, message) => console.log(`\n\u001b[36m[${step}]\u001b[0m ${message}`);
const ok = (message) => console.log(`  \u001b[32m✓\u001b[0m ${message}`);
const warn = (message) => console.log(`  \u001b[33m!\u001b[0m ${message}`);

function readVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    return pkg.version && pkg.version !== '0.0.0' ? pkg.version : '0.0.0-dev';
  } catch {
    return '0.0.0-dev';
  }
}

function run(command, argv, options = {}) {
  return execFileSync(command, argv, { cwd: root, stdio: 'inherit', ...options });
}

// ---------------------------------------------------------------------------
// 1. Frontend (Vite → dist/)
// ---------------------------------------------------------------------------
function buildFrontend() {
  log('1/6', 'Compilation du frontend (vite build)');
  if (hasFlag('skip-build')) {
    if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
      throw new Error('--skip-build demandé mais dist/index.html est absent.');
    }
    ok('dist/ réutilisé');
    return;
  }
  run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'build']);
  ok('dist/ généré');
}

// ---------------------------------------------------------------------------
// 2. Serveur + API (esbuild → app/server.cjs)
// ---------------------------------------------------------------------------
function buildServer(version) {
  log('2/6', 'Bundling du serveur (esbuild → server.cjs)');
  const outfile = path.join(OUT_DIR, 'app', 'server.cjs');
  fs.mkdirSync(path.dirname(outfile), { recursive: true });
  run(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
    'esbuild',
    'server.ts',
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--target=node20',
    '--minify',
    // vite et esbuild ne servent qu'au développement (import dynamique) : ils
    // restent externes pour ne pas les embarquer dans l'app de production.
    '--external:vite',
    '--external:esbuild',
    `--define:process.env.APP_VERSION=${JSON.stringify(version)}`,
    `--outfile=${outfile}`,
    '--log-level=warning',
  ]);
  ok(`app/server.cjs (${(fs.statSync(outfile).size / 1024 / 1024).toFixed(2)} Mo)`);
}

// ---------------------------------------------------------------------------
// 3. Assets de l'application
// ---------------------------------------------------------------------------
const ENV_TEMPLATE = `# Pinokio AI Studio — configuration locale
# Ouvrez ce fichier avec le Bloc-notes et collez vos clés entre les guillemets.

# --- Clés IA (facultatives : l'onglet LoRA Studio marche sans elles) ---
GEMINI_API_KEY=""
OPENROUTER_API_KEY=""
MISTRAL_API_KEY=""

# --- guaardvark (facultatif) : LoRA training délégué à son Cast Studio ---
# Backend Flask de guaardvark : 5000 par défaut (5055 sur macOS).
GUAARDVARK_URL="http://127.0.0.1:5000"
GUAARDVARK_API_KEY=""
GUAARDVARK_TIMEOUT_MS=8000
GUAARDVARK_ALLOW_REMOTE=""

# --- WanGP (Wan2GP) : racine de son dossier loras/ ---
# Windows : utilisez des slashs, ex. C:/Users/vous/pinokio/app/loras
WANGP_LORAS_ROOT=""

# --- Réseau local ---
# PORT=3000       port du serveur local
# HOST=0.0.0.0    mettez 127.0.0.1 pour n'écouter que sur ce PC
`;


const README_TXT = (version) => `Pinokio AI Studio ${version} — Windows 11
=====================================================

APPLICATION LOCALE : elle tourne sur VOTRE PC (serveur local sur 127.0.0.1).
Aucun compte, aucune donnee envoyee a un serveur tiers par l'application elle-meme.

------------------------------------------------------------------
1. PREMIER LANCEMENT (une seule fois)
------------------------------------------------------------------
  Double-cliquez sur  Setup.bat
    - verifie / telecharge le runtime Node.js (dossier runtime\\)
    - cree le fichier de configuration .env
    - installe le raccourci "Pinokio AI Studio" sur le Bureau et dans le Menu Demarrer
    - lance l'application

  Si Windows affiche un avertissement SmartScreen (fichier telecharge) :
    "Informations complementaires" -> "Executer quand meme".

------------------------------------------------------------------
2. ENSUITE
------------------------------------------------------------------
  Double-cliquez sur le raccourci du Bureau, ou sur
  "Pinokio AI Studio.vbs" dans ce dossier.
  L'application s'ouvre dans une fenetre dediee (Edge/Chrome en mode app).

  Pour arreter : "Stop.bat" (ou le raccourci "Arreter Pinokio AI Studio").
  Pour voir les messages : "Pinokio AI Studio (console).bat".

------------------------------------------------------------------
3. ONGLET LoRA STUDIO (entrainer un personnage)
------------------------------------------------------------------
  Le studio prepare tout : dataset, hyperparametres selon votre GPU,
  fichiers ai-toolkit (MiniMax H3), WanGP, kohya...

  Il ne lance pas l'entrainement a votre place : il produit les fichiers
  a executer (ai-toolkit, musubi-tuner, kohya) et sait deleguer le job
  a une instance guaardvark si vous en avez une.

  Livraison du .safetensors a WanGP :
    - copie : installez le fichier dans  loras\\minimax_h3\\  (script fourni)
    - sans copie : copiez l'URL affichee dans le champ "Enter Lora URL" de WanGP

------------------------------------------------------------------
4. CONFIGURATION (.env)
------------------------------------------------------------------
  Ouvrez .env avec le Bloc-notes :
    GEMINI_API_KEY / OPENROUTER_API_KEY / MISTRAL_API_KEY  -> assistant IA
    GUAARDVARK_URL, GUAARDVARK_API_KEY                    -> LoRA via guaardvark
    WANGP_LORAS_ROOT                                      -> dossier loras de WanGP
    PORT                                                  -> port local (3000 par defaut)

  Windows : utilisez des slashs dans les chemins,
    ex.  WANGP_LORAS_ROOT="C:/Users/vous/pinokio/app/loras"

------------------------------------------------------------------
5. EN CAS DE PROBLEME
------------------------------------------------------------------
  logs\\launcher.log          demarrage, port choisi
  logs\\server.err.log        erreurs du serveur
  logs\\server.out.log        sortie du serveur

  - "Node.js est introuvable"     -> relancez Setup.bat (connexion requise)
  - port deja utilise             -> l'app essaie 3000, 3100, 3200, 3300 ;
                                     ou mettez PORT=3400 dans .env
  - rien ne s'ouvre               -> lancez "Pinokio AI Studio (console).bat"
  - raccourci casse (dossier deplace) -> relancez Install-Shortcuts.ps1

Version ${version} · Depot : https://github.com/alexissmartconnect-art/PinokioAI
`.replace(/\\n/g, '\n');

function copyAppAssets(version) {
  log('3/6', 'Assemblage des fichiers de l’application');
  const appDir = path.join(OUT_DIR, 'app');

  // Frontend
  fs.cpSync(path.join(root, 'dist'), path.join(appDir, 'dist'), { recursive: true });
  ok('app/dist/ (frontend compilé)');

  // Modèle .env vierge (pas de valeurs factices)
  fs.writeFileSync(path.join(appDir, '.env.example'), ENV_TEMPLATE, 'utf8');
  ok('app/.env.example');

  // Modèle .env prêt à l'emploi à côté du lanceur (le serveur le lit au démarrage)
  const envFile = path.join(OUT_DIR, '.env');
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, ENV_TEMPLATE, 'utf8');
    ok('.env créé (clés vides, à remplir si besoin)');
  } else {
    ok('.env existant conservé');
  }

  // Icône + scripts Windows
  const windowsDir = path.join(root, 'scripts', 'windows');
  for (const entry of fs.readdirSync(windowsDir)) {
    fs.copyFileSync(path.join(windowsDir, entry), path.join(OUT_DIR, entry));
  }
  const iconSrc = path.join(root, 'assets', 'app-icon.ico');
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(OUT_DIR, 'icon.ico'));
    ok('icon.ico');
  } else {
    warn('assets/app-icon.ico absent : les raccourcis utiliseront l’icône générique');
  }

  fs.writeFileSync(path.join(OUT_DIR, 'README.txt'), README_TXT(version), 'utf8');
  ok('README.txt (démarrage, .env, dépannage)');

  fs.writeFileSync(path.join(OUT_DIR, 'VERSION'), `${version}\n`, 'utf8');
  ok(`VERSION ${version}`);
  ok(`${fs.readdirSync(windowsDir).length + 4} fichiers de lancement copiés`);
}

// ---------------------------------------------------------------------------
// 4. Runtime Node (optionnel mais recommandé pour un dossier autonome)
// ---------------------------------------------------------------------------
async function fetchNodeRuntime() {
  const runtimeDir = path.join(OUT_DIR, 'runtime');
  const nodeExe = path.join(runtimeDir, 'node.exe');
  if (fs.existsSync(nodeExe)) {
    ok('runtime/node.exe déjà présent');
    return;
  }

  const url = `https://nodejs.org/dist/v${NODE_RUNTIME_VERSION}/node-v${NODE_RUNTIME_VERSION}-win-x64.zip`;
  log('4/6', `Téléchargement du runtime Node ${NODE_RUNTIME_VERSION} (win-x64)`);
  const tmpZip = path.join(os.tmpdir(), `node-v${NODE_RUNTIME_VERSION}-win-x64.zip`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} sur ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tmpZip, buffer);
    ok(`${(buffer.length / 1024 / 1024).toFixed(1)} Mo téléchargés`);
  } catch (error) {
    warn(`Téléchargement impossible (${error.message}).`);
    warn('Le dossier fonctionnera quand même : Setup.bat téléchargera node.exe,');
    warn('ou le PC utilisera le Node.js déjà installé.');
    return;
  }

  fs.mkdirSync(runtimeDir, { recursive: true });
  try {
    // Expand-Archive est disponible partout sur Windows ; unzip ailleurs.
    if (process.platform === 'win32') {
      const extractDir = path.join(os.tmpdir(), `node-${NODE_RUNTIME_VERSION}`);
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Force -Path '${tmpZip}' -DestinationPath '${extractDir}'"`,
        { stdio: 'inherit' }
      );
      fs.copyFileSync(path.join(extractDir, `node-v${NODE_RUNTIME_VERSION}-win-x64`, 'node.exe'), nodeExe);
    } else {
      execSync(`unzip -o -j "${tmpZip}" "*/node.exe" -d "${runtimeDir}"`, { stdio: 'inherit' });
    }
    ok(`runtime/node.exe (${(fs.statSync(nodeExe).size / 1024 / 1024).toFixed(1)} Mo)`);
  } catch (error) {
    warn(`Extraction impossible : ${error.message}`);
    warn('Setup.bat fera le travail sur le PC Windows.');
  }
}

// ---------------------------------------------------------------------------
// 5. Archive zip
// ---------------------------------------------------------------------------
function makeZip(version) {
  log('5/6', 'Création de l’archive');
  const zipName = `Pinokio-AI-Studio-${version}-win64.zip`;
  const zipPath = path.join(RELEASE_DIR, zipName);
  if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${OUT_DIR}' -DestinationPath '${zipPath}' -CompressionLevel Optimal"`,
        { stdio: 'inherit' }
      );
    } else {
      execFileSync('zip', ['-r', '-q', zipPath, APP_NAME], { cwd: RELEASE_DIR, stdio: 'inherit' });
    }
    ok(`${zipName} (${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)} Mo)`);
    return zipPath;
  } catch (error) {
    warn(`Archive non créée (${error.message.split('\n')[0]}) : le dossier ${OUT_DIR} est prêt à être copié/zippé.`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const version = readVersion();
  console.log(`\n\u001b[1mPinokio AI Studio — packaging Windows 11\u001b[0m (v${version})`);

  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  buildFrontend();
  buildServer(version);
  copyAppAssets(version);

  if (hasFlag('with-node')) {
    await fetchNodeRuntime();
  } else {
    log('4/6', 'Runtime Node non embarqué (Setup.bat le récupérera au premier lancement)');
  }

  if (!hasFlag('no-zip')) {
    makeZip(version);
  } else {
    log('5/6', 'Archive zip ignorée (--no-zip)');
  }

  const hasRuntime = fs.existsSync(path.join(OUT_DIR, 'runtime', 'node.exe'));
  log('6/6', 'Terminé');
  console.log(`\n  Dossier : ${OUT_DIR}`);
  console.log(`  Runtime Node embarqué : ${hasRuntime ? 'oui' : 'non (Setup.bat)'}`);
  console.log('\n  Sur le PC Windows 11 :');
  console.log('    1. copier le dossier (ou dézipper l’archive) où vous voulez');
  console.log('    2. double-cliquer « Setup.bat » (une seule fois : runtime + raccourcis)');
  console.log('    3. ensuite, double-cliquer « Pinokio AI Studio » sur le Bureau\n');
}

main().catch((error) => {
  console.error(`\n\u001b[31m[échec]\u001b[0m ${error.message}`);
  process.exit(1);
});
