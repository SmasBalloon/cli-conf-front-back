import fs from "fs";
import path from "path";

// Configuration des bases de données pour docker-compose
interface DbConfig {
    image: string;
    port: number;
    env: Record<string, string>;
}

const dbConfigs: Record<string, DbConfig | null> = {
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

// Fonction pour générer docker-compose.yml
export function generateDockerCompose(projectName: string, database: string): void {
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
function generateDockerComposeYaml(database: string, config: DbConfig): string {
    const envVars = Object.entries(config.env)
        .map(([key, value]) => `      ${key}: ${value}`)
        .join("\n");

    if (database === "PostgreSQL") {
        return `services:
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
        return `services:
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
