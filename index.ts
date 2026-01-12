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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .version("1.0.0")
  .description("Ma CLI personnalisée pour mon duo de frameworks");

program
  .command("new <name>")
  .description("Créer un nouveau projet")
  .action(async (name: string) => {
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
          { title: "⚡ SolidJS - Léger et réactif", value: "solidjs" },
          { title: "🚀 Next.js - Framework React complet", value: "my-app" },
          { title: "⚛️ React - La librairie classique", value: "reactjs" },
          { title: "🖖 Vue.js - Le framework progressif", value: "vuejs" },
        ],
        initial: 0,
      },
      {
        type: "select",
        name: "backend",
        message: "Quel framework backend veux-tu utiliser ?",
        choices: [
          { title: "🏗️ NestJS - Framework complet", value: "nest-js" },
          { title: "🏗️ NestJS + Prisma - Avec ORM", value: "nestjs+prisma" },
          { title: "⚡ Express - Léger et flexible", value: "expressjs" },
          {
            title: "⚡ Express + Prisma - Express avec ORM",
            value: "expressjs+prisma",
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
          { title: "📄 SQLite - Léger et embarqué", value: "SQLite" },
          { title: "❌ Aucune - Pas de BD", value: "Aucune" },
        ],
        initial: 3,
      },
    ]);

    const spinner = ora("Création des fichiers...").start();
    try {
      // 2. Créer le dossier principal
      fs.mkdirSync(name);
      // 3. Copier les dossiers frontend et backend
      const frontendSource = path.join(
        __dirname,
        "templates",
        "frontend",
        answers.frontend
      );

      const backendSource = path.join(
        __dirname,
        "templates",
        "backend",
        answers.backend
      );

      const frontendDest = path.join(name, "frontend");
      const backendDest = path.join(name, "backend");
      copyDirectory(frontendSource, frontendDest);
      copyDirectory(backendSource, backendDest);

      // 4. Générer docker-compose.yml si une BD est sélectionnée
      if (answers.database !== "Aucune") {
        generateDockerCompose(name, answers.database);
      }
      // 5. Créer un fichier .gitignore pour le projet
      createRootGitIgnore(name);
      spinner.succeed(pc.green("Projet créé avec succès !"));

      // 6. Installation des dépendances (optionnel)
      const installPrompt = await prompts({
        type: "confirm",
        name: "install",
        message: "Installer les dépendances maintenant ?",
      });
      if (installPrompt.install) {
        const installSpinner = ora("Installation des packages...").start();
        await execa("npm", ["install"], { cwd: path.join(name, "frontend") });
        await execa("npm", ["install"], { cwd: path.join(name, "backend") });
        installSpinner.succeed("Dépendances installées.");
      }

      // 7. Afficher instructions finales
      console.log(pc.green("\n✨ Configuration:"));
      console.log(` Frontend: ${pc.cyan(answers.frontend)}`);
      console.log(` Backend: ${pc.cyan(answers.backend)}`);
      console.log(` Database: ${pc.cyan(answers.database)}`);
      if (answers.database !== "Aucune") {
        console.log(`\n${pc.yellow("📦 Docker Compose détecté:")}`);
        console.log(` ${pc.dim("cd " + name + " && docker-compose up -d")}\n`);
      }

      console.log(`\nMaintenant, fais:`);
      console.log(
        ` ${pc.yellow(`cd ${name}/frontend && npm run dev`)} ${pc.dim(
          "(terminal 1)"
        )}`
      );

      console.log(
        ` ${pc.yellow(`cd ${name}/backend && npm run dev`)} ${pc.dim(
          "(terminal 2)"
        )}\n`
      );
    } catch (error) {
      spinner.fail("Erreur lors de la création du projet.");
      console.error(error);
    }
  });

program.parse(process.argv);

// Fonction pour copier récursivement les dossiers

function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory not found: ${src}`);
  }

  fs.mkdirSync(dest, { recursive: true });

  const files = fs.readdirSync(src);

  files.forEach((file: string) => {
    const srcPath = path.join(src, file);

    const destPath = path.join(dest, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Fonction pour créer un .gitignore à la racine

function createRootGitIgnore(projectName: string): void {
  const gitIgnoreContent = `node_modules/

dist/

.env

.env.local

.DS_Store

*.log

`;

  fs.writeFileSync(path.join(projectName, ".gitignore"), gitIgnoreContent);
}

// Fonction pour générer docker-compose.yml

function generateDockerCompose(projectName: string, database: string): void {
  const dbConfigs: Record<string, any> = {
    PostgreSQL: {
      image: "postgres:15-alpine",

      port: 5432,

      env: {
        POSTGRES_USER: "user",

        POSTGRES_PASSWORD: "password",

        POSTGRES_DB: "my_database",
      },
    },

    MariaDB: {
      image: "mariadb:latest",

      port: 3306,

      env: {
        MARIADB_ROOT_PASSWORD: "root",

        MARIADB_DATABASE: "my_database",

        MARIADB_USER: "user",

        MARIADB_PASSWORD: "password",
      },
    },

    SQLite: null,
  };

  if (database === "SQLite" || database === "Aucune") {
    return;
  }

  const config = dbConfigs[database];

  if (!config) return;

  const dockerCompose = generateDockerComposeYaml(database, config);

  const filePath = path.join(projectName, "docker-compose.yml");

  fs.writeFileSync(filePath, dockerCompose);
}

// Fonction pour générer le contenu YAML

function generateDockerComposeYaml(database: string, config: any): string {
  const envVars = Object.entries(config.env)

    .map(([key, value]) => ` ${key}: ${value}`)

    .join("\n");

  if (database === "PostgreSQL") {
    return `version: '3.8'


services:

postgres:

image: ${config.image}

container_name: ${database.toLowerCase()}_container

ports:

- "${config.port}:5432"

environment:

${envVars}

volumes:

- postgres_data:/var/lib/postgresql/data

restart: unless-stopped

healthcheck:

test: ["CMD-SHELL", "pg_isready -U user"]

interval: 10s

timeout: 5s

retries: 5


volumes:

postgres_data:

`;
  } else if (database === "MariaDB") {
    return `version: '3.8'


services:

mariadb:

image: ${config.image}

container_name: ${database.toLowerCase()}_container

ports:

- "${config.port}:3306"

environment:

${envVars}

volumes:

- mariadb_data:/var/lib/mysql

restart: unless-stopped

healthcheck:

test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1"]

interval: 10s

timeout: 5s

retries: 5


volumes:

mariadb_data:

`;
  }

  return "";
}
