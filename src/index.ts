#!/usr/bin/env node

import { program } from "commander";
// @ts-ignore
import prompts from "prompts";
import pc from "picocolors";
import ora from "ora";
import { execa } from "execa";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Imports des modules
import { getInstallCommand, getDevCommand } from "./utils/commands.js";
import { createRootGitIgnore } from "./utils/files.js";
import { generateEnvFiles } from "./utils/env.js";
import { generateDockerCompose } from "./docker/compose.js";

// Import du système de templates
import { fetchTemplate } from "./templates/download.js";
import { PRESET_INFO, Preset } from "./templates/config.js";
import { createEcosystemConfig, createLogsDirectory } from "./templates/pm2.js";

// Imports des commandes
import { doctorCommand } from "./commands/doctor.js";
import { dockerDevCommand, dockerStopCommand, dockerLogsCommand } from "./commands/docker.js";
import { makeModuleCommand } from "./commands/make-module.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_NAME = "dualsync";
const CURRENT_VERSION = "2.1.1";

// Logo ASCII art
const LOGO = `
${pc.cyan(pc.bold(`    ____              __   _____                  
   / __ \\__  ______ _/ /  / ___/__  ______  _____
  / / / / / / / __ \`/ /   \\__ \\/ / / / __ \\/ ___/
 / /_/ / /_/ / /_/ / /   ___/ / /_/ / / / / /__  
/_____/\\__,_/\\__,_/_/   /____/\\__, /_/ /_/\\___/  
                             /____/              `))}
`;

// Afficher la bannière
function showBanner() {
  console.log(LOGO);
  console.log(`  ${pc.green(pc.bold("DualSync"))} ${pc.dim(`v${CURRENT_VERSION}`)} - CLI fullstack moderne\n`);
}

// Fonction pour vérifier les mises à jour
async function checkForUpdates() {
  try {
    const { stdout } = await execa("npm", ["view", PACKAGE_NAME, "version"]);
    const latestVersion = stdout.trim();

    if (latestVersion !== CURRENT_VERSION) {
      console.log(pc.yellow(`\n⚠️  Une nouvelle version est disponible : ${pc.bold(latestVersion)} (actuellement: ${CURRENT_VERSION})\n`));
      console.log(pc.cyan("Pour mettre à jour, utilisez l'une de ces commandes :"));
      console.log(pc.dim("  npm install -g dualsync@latest"));
      console.log(pc.dim("  yarn global add dualsync@latest"));
      console.log(pc.dim("  pnpm add -g dualsync@latest"));
      console.log(pc.dim("  bun install -g dualsync@latest\n"));
    }
  } catch (error) {
    // Ignorer les erreurs de vérification (offline, etc.)
  }
}

// Afficher la bannière si aucune commande n'est passée ou si --help
if (process.argv.length === 2 || process.argv.includes("--help") || process.argv.includes("-h")) {
  showBanner();
}

program
  .version(CURRENT_VERSION)
  .description("CLI pour créer des projets fullstack avec frontend et backend pré-configurés")
  .addHelpText("before", "");

program
  .command("new <name>")
  .description("Créer un nouveau projet")
  .action(async (name: string) => {
    // Vérifier les mises à jour
    await checkForUpdates();

    console.log(
      pc.cyan(`\n🚀 Bienvenue dans l'assistant de création ${pc.bold(name)}\n`)
    );

    // 1. Questions avec prompts
    const answers = await prompts([
      {
        type: "select",
        name: "frontend",
        message: "Quel framework frontend veux-tu utiliser ?",
        choices: [
          { title: "💎 SolidJS - Léger et réactif", value: "solidjs" },
          { title: "▲ Next.js - Framework React complet", value: "nextjs" },
          { title: "⚛️  React - La librairie classique", value: "reactjs" },
          { title: "💚 Vue.js - Le framework progressif", value: "vuejs" },
          { title: "🅰️  Angular - Le framework robuste", value: "angularjs" },
        ],
        initial: 0,
      },
      {
        type: "select",
        name: "frontendPreset",
        message: "Quel preset frontend veux-tu ?",
        choices: [
          {
            title: `${PRESET_INFO.minimal.emoji} ${PRESET_INFO.minimal.name} - ${PRESET_INFO.minimal.description}`,
            value: "minimal"
          },
          {
            title: `${PRESET_INFO.standard.emoji} ${PRESET_INFO.standard.name} - ${PRESET_INFO.standard.description}`,
            value: "standard"
          },
          {
            title: `${PRESET_INFO.full.emoji} ${PRESET_INFO.full.name} - ${PRESET_INFO.full.description}`,
            value: "full"
          },
        ],
        initial: 1,
      },
      {
        type: "select",
        name: "backend",
        message: "Quel framework backend veux-tu utiliser ?",
        choices: [
          { title: "🐱 NestJS - Framework complet", value: "nestjs" },
          { title: "🐱 NestJS + Prisma - Avec ORM", value: "nestjs-prisma" },
          { title: "⚡ Express - Léger et flexible", value: "expressjs" },
          {
            title: "⚡ Express + Prisma - Express avec ORM",
            value: "expressjs-prisma",
          },
          { title: "🔥 Hono - Ultra-léger pour serverless", value: "hono" },
          { title: "🔥 Hono + Prisma - Hono avec ORM", value: "hono-prisma" },
        ],
        initial: 0,
      },
      {
        type: "select",
        name: "backendPreset",
        message: "Quel preset backend veux-tu ?",
        choices: [
          {
            title: `${PRESET_INFO.minimal.emoji} ${PRESET_INFO.minimal.name} - Framework de base`,
            value: "minimal"
          },
          {
            title: `${PRESET_INFO.full.emoji} ${PRESET_INFO.full.name} - Avec Swagger, Helmet, JWT, Zod...`,
            value: "full"
          },
        ],
        initial: 0,
      },
      {
        type: "select",
        name: "database",
        message: "Quelle base de données veux-tu utiliser ?",
        choices: [
          { title: "🐬 MariaDB - MySQL compatible", value: "MariaDB" },
          { title: "🐘 PostgreSQL - Robuste et fiable", value: "PostgreSQL" },
          { title: "🪶 SQLite - Léger et embarqué", value: "SQLite" },
          { title: "❌ Aucune - Pas de BD", value: "Aucune" },
        ],
        initial: 3,
      },
      {
        type: "select",
        name: "packageManager",
        message: "Quel gestionnaire de packages veux-tu utiliser ?",
        choices: [
          { title: "📦 npm - Le classique", value: "npm" },
          { title: "🧶 yarn - Rapide et fiable", value: "yarn" },
          { title: "🚀 pnpm - Économe en espace", value: "pnpm" },
          { title: "🥟 bun - Ultra-rapide", value: "bun" },
          { title: "🦕 deno - Moderne et sécurisé", value: "deno" },
        ],
        initial: 0,
      },
      {
        type: "confirm",
        name: "usePM2",
        message: "Veux-tu utiliser PM2 (process manager) pour gérer ton backend ?",
        initial: true,
      },
    ]);

    // Vérifier si l'utilisateur a annulé
    if (!answers.frontend || !answers.backend) {
      console.log(pc.yellow("\n❌ Création annulée.\n"));
      return;
    }

    const frontendPreset: Preset = answers.frontendPreset || "minimal";
    const backendPreset: Preset = answers.backendPreset || "minimal";

    const spinner = ora("Création du projet...").start();
    try {
      // 2. Créer le dossier principal
      fs.mkdirSync(name);

      // 3. Télécharger les templates depuis GitHub
      spinner.text = `Téléchargement de ${answers.frontend} (${frontendPreset})...`;
      const frontendDest = path.join(name, "frontend");
      await fetchTemplate("frontend", answers.frontend, frontendPreset, frontendDest);

      spinner.text = `Téléchargement de ${answers.backend} (${backendPreset})...`;
      const backendDest = path.join(name, "backend");
      await fetchTemplate("backend", answers.backend, backendPreset, backendDest);

      // 4. Générer docker-compose.yml si une BD est sélectionnée
      if (answers.database !== "Aucune") {
        generateDockerCompose(name, answers.database);
      }

      // 4.5. Générer ecosystem.config.js pour PM2 si demandé
      if (answers.usePM2) {
        createEcosystemConfig(name, name, answers.backend, answers.packageManager);
        createLogsDirectory(name);
      }

      // 5. Créer un fichier .gitignore pour le projet
      createRootGitIgnore(name);

      // 6. Générer les fichiers .env pour le frontend et le backend
      generateEnvFiles(name, answers.backend, answers.database);
      spinner.succeed(pc.green("Projet créé avec succès !"));

      // 7. Initialisation Git (optionnel)
      const gitPrompt = await prompts({
        type: "confirm",
        name: "initGit",
        message: "Initialiser un dépôt Git ?",
        initial: true,
      });
      if (gitPrompt.initGit) {
        const gitSpinner = ora("Initialisation de Git...").start();
        try {
          await execa("git", ["init"], { cwd: name });
          await execa("git", ["add", "."], { cwd: name });
          await execa("git", ["commit", "-m", "Initial commit"], { cwd: name });
          gitSpinner.succeed("Dépôt Git initialisé.");
        } catch (error) {
          gitSpinner.warn("Git non disponible ou erreur lors de l'initialisation.");
        }
      }

      // 8. Installation des dépendances (optionnel)
      const installPrompt = await prompts({
        type: "confirm",
        name: "install",
        message: "Installer les dépendances maintenant ?",
      });
      if (installPrompt.install) {
        const installSpinner = ora("Installation des packages...").start();
        try {
          const pm = answers.packageManager;
          const installCmd = getInstallCommand(pm);
          await execa(installCmd.cmd, installCmd.args, { cwd: path.join(name, "frontend") });
          await execa(installCmd.cmd, installCmd.args, { cwd: path.join(name, "backend") });
          installSpinner.succeed("Dépendances installées.");
        } catch (error) {
          installSpinner.fail("Erreur lors de l'installation des dépendances.");
        }
      }

      // 9. Afficher instructions finales
      console.log(pc.green("\n✨ Configuration:"));
      console.log(` Frontend: ${pc.cyan(answers.frontend)} ${pc.dim(`(${PRESET_INFO[frontendPreset].name})`)}`);
      console.log(` Backend: ${pc.cyan(answers.backend)} ${pc.dim(`(${PRESET_INFO[backendPreset].name})`)}`);
      console.log(` Database: ${pc.cyan(answers.database)}`);
      console.log(` Package Manager: ${pc.cyan(answers.packageManager)}`);
      console.log(` PM2: ${answers.usePM2 ? pc.green("✅ Activé") : pc.dim("Désactivé")}`);

      // Afficher info sur les fichiers .env générés
      console.log(`\n${pc.green("🔐 Fichiers .env générés:")}`);
      console.log(` ${pc.dim("• " + name + "/backend/.env")} ${pc.cyan("(avec JWT_SECRET, API_KEY, etc.)")}`);
      console.log(` ${pc.dim("• " + name + "/frontend/.env")} ${pc.cyan("(configuration API)")}`);
      console.log(` ${pc.dim("• Les fichiers .env.example sont également créés pour le partage")}`);

      // Afficher info sur PM2 si activé
      if (answers.usePM2) {
        console.log(`\n${pc.green("⚙️ PM2 Ecosystem Config:")}`);
        console.log(` ${pc.dim("• " + name + "/ecosystem.config.js")} ${pc.cyan("(configuration PM2 créée)")}`);
        console.log(` ${pc.dim("• " + name + "/logs/")} ${pc.cyan("(dossier de logs créé)")}`);
        console.log(`\n${pc.dim("Commandes PM2 utiles:")}` );
        console.log(` ${pc.cyan("pm2 start ecosystem.config.js")} ${pc.dim("(démarrer l'appli")}`);
        console.log(` ${pc.cyan("pm2 logs")} ${pc.dim("(voir les logs)")}`);
        console.log(` ${pc.cyan("pm2 monit")} ${pc.dim("(monitorer les ressources)")}`);
      }
      if (answers.database !== "Aucune") {
        console.log(`\n${pc.yellow("📦 Docker Compose détecté:")}`);
        console.log(` ${pc.dim("cd " + name + " && docker-compose up -d")}\n`);
      }

      const devCmd = getDevCommand(answers.packageManager);
      console.log(`\nMaintenant, fais:`);
      console.log(
        ` ${pc.yellow(`cd ${name}/frontend && ${devCmd}`)} ${pc.dim(
          "(terminal 1)"
        )}`
      );

      console.log(
        ` ${pc.yellow(`cd ${name}/backend && ${devCmd}`)} ${pc.dim(
          "(terminal 2)"
        )}\n`
      );
    } catch (error) {
      spinner.fail("Erreur lors de la création du projet.");
      console.error(error);
    }
  });

// Commande doctor
program
  .command("doctor")
  .description("Vérifier si les outils nécessaires sont installés")
  .action(async () => {
    await doctorCommand();
  });

// Commande docker:dev
program
  .command("docker:dev")
  .description("Lancer l'environnement Docker de développement")
  .action(async () => {
    await dockerDevCommand();
  });

// Commande docker:stop
program
  .command("docker:stop")
  .description("Arrêter les conteneurs Docker")
  .action(async () => {
    await dockerStopCommand();
  });

// Commande docker:logs
program
  .command("docker:logs")
  .description("Afficher les logs des conteneurs Docker")
  .action(async () => {
    await dockerLogsCommand();
  });

// Commande make:module
program
  .command("make:module <name>")
  .description("Générer un module backend (controller, service, routes)")
  .action(async (name: string) => {
    await makeModuleCommand(name);
  });

program.parse(process.argv);
