import fs from "fs";
import path from "path";

/**
 * Génère un fichier ecosystem.config.js pour PM2
 */
export function generateEcosystemConfig(
  projectName: string,
  backend: string,
  packageManager: string
): string {
  // Déterminer le port du backend
  const backendPort = 3001;
  
  // Déterminer la commande de démarrage selon le backend et le package manager
  let startScript = "npm start";
  
  if (packageManager === "yarn") {
    startScript = "yarn start";
  } else if (packageManager === "pnpm") {
    startScript = "pnpm start";
  } else if (packageManager === "bun") {
    startScript = "bun start";
  }

  // Déterminer si c'est NestJS ou Express
  const isNestJS = backend.includes("nestjs");
  
  const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: "${projectName}-backend",
      script: "${startScript}",
      cwd: "./backend",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: ${backendPort},
      },
      env_production: {
        NODE_ENV: "production",
        PORT: ${backendPort},
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      watch: ["src"],
      ignore_watch: ["node_modules", "dist", ".git"],
      max_memory_restart: "500M",
      restart_delay: 4000,
      ${isNestJS ? `autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",` : ""}
    },
  ],
  deploy: {
    production: {
      user: "node",
      host: "your-production-server.com",
      ref: "origin/main",
      repo: "git@github.com:your-repo.git",
      path: "/var/www/your-app",
      "post-deploy": "npm install && npm run build && pm2 startOrRestart ecosystem.config.js --env production",
      "pre-deploy-local": "echo 'Deploying to production'",
    },
  },
};
`;

  return ecosystemConfig;
}

/**
 * Créer le fichier ecosystem.config.js dans le répertoire du projet
 */
export function createEcosystemConfig(
  projectPath: string,
  projectName: string,
  backend: string,
  packageManager: string
): void {
  const content = generateEcosystemConfig(projectName, backend, packageManager);
  const ecosystemPath = path.join(projectPath, "ecosystem.config.js");
  
  fs.writeFileSync(ecosystemPath, content, "utf-8");
}

/**
 * Créer les dossiers de logs nécessaires
 */
export function createLogsDirectory(projectPath: string): void {
  const logsDir = path.join(projectPath, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}
