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
import { copyDirectory, createRootGitIgnore } from "./utils/files.js";
import { generateEnvFiles } from "./utils/env.js";
import { generateDockerCompose } from "./docker/compose.js";
import { FRONTEND_ADDONS, BACKEND_ADDONS } from "./addons/config.js";
import { getFrontendAddonsChoices, getBackendAddonsChoices } from "./addons/choices.js";
import { installAddons } from "./addons/install.js";

// Imports des commandes
import { doctorCommand } from "./commands/doctor.js";
import { dockerDevCommand, dockerStopCommand, dockerLogsCommand } from "./commands/docker.js";
import { makeModuleCommand } from "./commands/make-module.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_NAME = "dualsync";
const CURRENT_VERSION = "1.2.2";

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
    ]);

    // Vérifier si l'utilisateur a annulé
    if (!answers.frontend || !answers.backend) {
      console.log(pc.yellow("\n❌ Création annulée.\n"));
      return;
    }

    // 2. Questions pour les add-ons frontend
    const frontendAddonsChoices = getFrontendAddonsChoices(answers.frontend);
    const frontendAddons = await prompts({
      type: "multiselect",
      name: "addons",
      message: "Quels add-ons frontend veux-tu ajouter ? (Espace pour sélectionner, Entrée pour valider)",
      choices: frontendAddonsChoices,
      hint: "- Espace pour sélectionner. Entrée pour confirmer",
    });

    // 3. Questions pour les add-ons backend
    const backendAddonsChoices = getBackendAddonsChoices(answers.backend);
    const backendAddons = await prompts({
      type: "multiselect",
      name: "addons",
      message: "Quels add-ons backend veux-tu ajouter ? (Espace pour sélectionner, Entrée pour valider)",
      choices: backendAddonsChoices,
      hint: "- Espace pour sélectionner. Entrée pour confirmer",
    });

    const spinner = ora("Création des fichiers...").start();
    try {
      // 4. Créer le dossier principal
      fs.mkdirSync(name);

      // 5. Copier les dossiers frontend et backend
      const templatesRoot = path.join(__dirname, "..", "templates");
      const frontendSource = path.join(
        templatesRoot,
        "frontend",
        answers.frontend
      );
      const backendSource = path.join(
        templatesRoot,
        "backend",
        answers.backend
      );

      const frontendDest = path.join(name, "frontend");
      const backendDest = path.join(name, "backend");
      copyDirectory(frontendSource, frontendDest);
      copyDirectory(backendSource, backendDest);

      // 6. Générer docker-compose.yml si une BD est sélectionnée
      if (answers.database !== "Aucune") {
        generateDockerCompose(name, answers.database);
      }

      // 7. Créer un fichier .gitignore pour le projet
      createRootGitIgnore(name);

      // 8. Générer les fichiers .env pour le frontend et le backend
      generateEnvFiles(name, answers.backend, answers.database);
      spinner.succeed(pc.green("Projet créé avec succès !"));

      // 9. Initialisation Git (optionnel)
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

      // 10. Installation des dépendances (optionnel)
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

          // 10b. Installation des add-ons sélectionnés
          const selectedFrontendAddons = frontendAddons.addons || [];
          const selectedBackendAddons = backendAddons.addons || [];

          if (selectedFrontendAddons.length > 0 || selectedBackendAddons.length > 0) {
            const addonsSpinner = ora("Installation des add-ons...").start();
            try {
              if (selectedFrontendAddons.length > 0) {
                await installAddons(name, "frontend", selectedFrontendAddons, pm);
              }
              if (selectedBackendAddons.length > 0) {
                await installAddons(name, "backend", selectedBackendAddons, pm);
              }
              addonsSpinner.succeed("Add-ons installés.");
            } catch (error) {
              addonsSpinner.fail("Erreur lors de l'installation des add-ons.");
              console.error(pc.dim(String(error)));
            }
          }
        } catch (error) {
          installSpinner.fail("Erreur lors de l'installation des dépendances.");
        }
      }

      // 11. Afficher instructions finales
      console.log(pc.green("\n✨ Configuration:"));
      console.log(` Frontend: ${pc.cyan(answers.frontend)}`);
      console.log(` Backend: ${pc.cyan(answers.backend)}`);
      console.log(` Database: ${pc.cyan(answers.database)}`);
      console.log(` Package Manager: ${pc.cyan(answers.packageManager)}`);

      // Afficher les add-ons sélectionnés
      const selectedFrontendAddonsFinal = frontendAddons.addons || [];
      const selectedBackendAddonsFinal = backendAddons.addons || [];

      if (selectedFrontendAddonsFinal.length > 0) {
        const addonNames = selectedFrontendAddonsFinal.map((a: string) => FRONTEND_ADDONS[a]?.name || a).join(", ");
        console.log(` Frontend Add-ons: ${pc.magenta(addonNames)}`);
      }

      if (selectedBackendAddonsFinal.length > 0) {
        const addonNames = selectedBackendAddonsFinal.map((a: string) => BACKEND_ADDONS[a]?.name || a).join(", ");
        console.log(` Backend Add-ons: ${pc.magenta(addonNames)}`);
      }

      // Afficher info sur les fichiers .env générés
      console.log(`\n${pc.green("🔐 Fichiers .env générés:")}`);
      console.log(` ${pc.dim("• " + name + "/backend/.env")} ${pc.cyan("(avec JWT_SECRET, API_KEY, etc.)")}`);
      console.log(` ${pc.dim("• " + name + "/frontend/.env")} ${pc.cyan("(configuration API)")}`);
      console.log(` ${pc.dim("• Les fichiers .env.example sont également créés pour le partage")}`);

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
