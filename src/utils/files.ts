import fs from "fs";
import path from "path";

// Fonction pour copier récursivement les dossiers
export function copyDirectory(src: string, dest: string): void {
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
export function createRootGitIgnore(projectName: string): void {
    const gitIgnoreContent = `node_modules/

dist/

.env

.env.local

.DS_Store

*.log

`;

    fs.writeFileSync(path.join(projectName, ".gitignore"), gitIgnoreContent);
}
