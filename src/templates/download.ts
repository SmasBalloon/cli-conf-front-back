import pc from "picocolors";
import ora from "ora";
import { execa } from "execa";
import fs from "fs";
import path from "path";
import https from "https";
import { getTemplateTarballUrl, getTemplateRepo, Preset, TEMPLATE_REPOS } from "./config.js";

// Télécharger un fichier depuis une URL
async function downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);

        const request = (currentUrl: string) => {
            https.get(currentUrl, (response) => {
                // Suivre les redirections
                if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307 || response.statusCode === 308) {
                    // Consommer la réponse pour libérer les ressources
                    response.resume();
                    
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        request(redirectUrl);
                        return;
                    }
                }

                if (response.statusCode !== 200) {
                    response.resume(); // Consommer la réponse
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    resolve();
                });
            }).on("error", (err) => {
                fs.unlink(destPath, () => { }); // Supprimer le fichier partiel
                reject(err);
            });
        };

        request(url);
    });
}

// Extraire un tarball
async function extractTarball(tarballPath: string, destPath: string, stripComponents: number = 1): Promise<void> {
    await execa("tar", [
        "-xzf", tarballPath,
        "-C", destPath,
        `--strip-components=${stripComponents}`
    ]);
}

// Télécharger et extraire un template depuis GitHub
export async function downloadTemplate(
    type: "frontend" | "backend",
    template: string,
    preset: Preset,
    destPath: string,
    branch: string = "master"
): Promise<void> {
    const repo = getTemplateRepo(type, template, preset);

    const tarballUrl = getTemplateTarballUrl(type, template, preset, branch);
    const tempDir = path.join(destPath, "..", ".dualsync-temp");
    const tarballPath = path.join(tempDir, `${template}.tar.gz`);

    // Créer le dossier temporaire
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(destPath, { recursive: true });

    try {
        // Télécharger le tarball
        await downloadFile(tarballUrl, tarballPath);

        // Extraire le tarball
        await extractTarball(tarballPath, destPath);

    } finally {
        // Nettoyer le dossier temporaire
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

// Vérifier si un template existe sur GitHub
export async function templateExists(
    type: "frontend" | "backend",
    template: string,
    preset: Preset
): Promise<boolean> {
    try {
        const repo = getTemplateRepo(type, template, preset);
        // Vérifier si le repo existe en faisant une requête HEAD
        const { stdout } = await execa("git", ["ls-remote", `https://github.com/${repo}.git`], {
            reject: false,
        });
        return stdout.length > 0;
    } catch {
        return false;
    }
}

// Cloner un template avec git (alternative si le téléchargement échoue)
export async function cloneTemplate(
    type: "frontend" | "backend",
    template: string,
    preset: Preset,
    destPath: string,
    branch: string = "master"
): Promise<void> {
    const repo = getTemplateRepo(type, template, preset);
    const repoUrl = `https://github.com/${repo}.git`;

    // Cloner le repo
    await execa("git", ["clone", "--depth", "1", "--branch", branch, repoUrl, destPath]);

    // Supprimer le dossier .git pour éviter les conflits
    const gitDir = path.join(destPath, ".git");
    if (fs.existsSync(gitDir)) {
        fs.rmSync(gitDir, { recursive: true, force: true });
    }
}

// Télécharger un template avec fallback sur git clone
export async function fetchTemplate(
    type: "frontend" | "backend",
    template: string,
    preset: Preset,
    destPath: string
): Promise<void> {
    try {
        // Essayer d'abord le téléchargement direct (plus rapide)
        await downloadTemplate(type, template, preset, destPath);
    } catch (downloadError) {
        // Fallback sur git clone si le téléchargement échoue
        try {
            await cloneTemplate(type, template, preset, destPath);
        } catch (cloneError) {
            const repo = getTemplateRepo(type, template, preset);
            throw new Error(
                `Impossible de télécharger le template "${template}" (${preset}). ` +
                `Vérifiez que le repo https://github.com/${repo} existe.`
            );
        }
    }
}
