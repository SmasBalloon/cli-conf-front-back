import pc from "picocolors";
import ora from "ora";
import { execa } from "execa";
import fs from "fs";
import path from "path";

export async function dockerDevCommand(): Promise<void> {
    console.log(pc.cyan(pc.bold("\n🐳 DualSync Docker Dev - Lancement de l'environnement\n")));

    // Vérifier si on est dans un projet DualSync
    const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");

    if (!fs.existsSync(dockerComposePath)) {
        console.log(pc.red("  ❌ Aucun fichier docker-compose.yml trouvé."));
        console.log(pc.dim("  Assure-toi d'être à la racine d'un projet DualSync avec une base de données.\n"));
        process.exit(1);
    }

    // Vérifier si Docker est disponible
    try {
        await execa("docker", ["info"]);
    } catch (error) {
        console.log(pc.red("  ❌ Docker n'est pas en cours d'exécution."));
        console.log(pc.yellow("  → Lance Docker Desktop ou le daemon Docker.\n"));
        process.exit(1);
    }

    const spinner = ora("Démarrage des conteneurs...").start();

    try {
        // Lancer docker-compose
        await execa("docker", ["compose", "up", "-d"], { cwd: process.cwd() });
        spinner.succeed(pc.green("Conteneurs démarrés !"));

        // Afficher les conteneurs en cours
        const { stdout } = await execa("docker", ["compose", "ps", "--format", "table {{.Name}}\t{{.Status}}\t{{.Ports}}"], { cwd: process.cwd() });

        console.log(pc.cyan("\n  📦 Conteneurs actifs :"));
        console.log(pc.dim("  ─────────────────────────────────────────────"));

        const lines = stdout.split("\n").filter(line => line.trim());
        for (const line of lines) {
            console.log(`  ${line}`);
        }

        console.log(pc.green(pc.bold("\n  ✨ Environnement Docker prêt !\n")));
        console.log(pc.dim("  Commandes utiles :"));
        console.log(`  ${pc.cyan("dual docker:stop")}  - Arrêter les conteneurs`);
        console.log(`  ${pc.cyan("dual docker:logs")}  - Voir les logs`);
        console.log(`  ${pc.cyan("docker compose ps")} - Voir l'état des conteneurs\n`);

    } catch (error) {
        spinner.fail(pc.red("Erreur lors du démarrage des conteneurs."));
        console.error(pc.dim(String(error)));
        process.exit(1);
    }
}

export async function dockerStopCommand(): Promise<void> {
    console.log(pc.cyan(pc.bold("\n🐳 Arrêt des conteneurs Docker...\n")));

    const spinner = ora("Arrêt des conteneurs...").start();

    try {
        await execa("docker", ["compose", "down"], { cwd: process.cwd() });
        spinner.succeed(pc.green("Conteneurs arrêtés !"));
        console.log("");
    } catch (error) {
        spinner.fail(pc.red("Erreur lors de l'arrêt des conteneurs."));
        console.error(pc.dim(String(error)));
        process.exit(1);
    }
}

export async function dockerLogsCommand(): Promise<void> {
    console.log(pc.cyan(pc.bold("\n🐳 Logs des conteneurs Docker\n")));

    try {
        // Utiliser spawn pour les logs en temps réel
        const subprocess = execa("docker", ["compose", "logs", "-f", "--tail", "100"], {
            cwd: process.cwd(),
            stdio: "inherit"
        });

        // Gérer Ctrl+C proprement
        process.on("SIGINT", () => {
            subprocess.kill();
            console.log(pc.dim("\n  Logs arrêtés.\n"));
            process.exit(0);
        });

        await subprocess;
    } catch (error: any) {
        if (error.signal !== "SIGINT") {
            console.error(pc.red("Erreur lors de l'affichage des logs."));
            console.error(pc.dim(String(error)));
        }
    }
}
