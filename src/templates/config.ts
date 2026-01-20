// Configuration des templates distants
// Organisation GitHub : dualSync-cli

export const GITHUB_ORG = "dualSync-cli";

// Types de presets disponibles
export type Preset = "minimal" | "standard" | "full";

// Mapping des templates vers les repos GitHub
export const TEMPLATE_REPOS: Record<string, Record<string, Record<Preset, string>>> = {
    frontend: {
        solidjs: {
            minimal: `${GITHUB_ORG}/frontend-solidjs`,
            standard: `${GITHUB_ORG}/frontend-solidjs-tailwind`,
            full: `${GITHUB_ORG}/frontend-solidjs-full`,
        },
        nextjs: {
            minimal: `${GITHUB_ORG}/frontend-nextjs`,
            standard: `${GITHUB_ORG}/frontend-nextjs-tailwind`,
            full: `${GITHUB_ORG}/frontend-nextjs-full`,
        },
        reactjs: {
            minimal: `${GITHUB_ORG}/frontend-reactjs`,
            standard: `${GITHUB_ORG}/frontend-reactjs-tailwind`,
            full: `${GITHUB_ORG}/frontend-reactjs-full`,
        },
        vuejs: {
            minimal: `${GITHUB_ORG}/frontend-vuejs`,
            standard: `${GITHUB_ORG}/frontend-vuejs-tailwind`,
            full: `${GITHUB_ORG}/frontend-vuejs-full`,
        },
        angularjs: {
            minimal: `${GITHUB_ORG}/frontend-angularjs`,
            standard: `${GITHUB_ORG}/frontend-angularjs-tailwind`,
            full: `${GITHUB_ORG}/frontend-angularjs-full`,
        },
    },
    backend: {
        nestjs: {
            minimal: `${GITHUB_ORG}/backend-nestjs`,
            standard: `${GITHUB_ORG}/backend-nestjs`,
            full: `${GITHUB_ORG}/backend-nestjs-full`,
        },
        "nestjs-prisma": {
            minimal: `${GITHUB_ORG}/backend-nestjs-prisma`,
            standard: `${GITHUB_ORG}/backend-nestjs-prisma`,
            full: `${GITHUB_ORG}/backend-nestjs-prisma-full`,
        },
        expressjs: {
            minimal: `${GITHUB_ORG}/backend-expressjs`,
            standard: `${GITHUB_ORG}/backend-expressjs`,
            full: `${GITHUB_ORG}/backend-expressjs-full`,
        },
        "expressjs-prisma": {
            minimal: `${GITHUB_ORG}/backend-expressjs-prisma`,
            standard: `${GITHUB_ORG}/backend-expressjs-prisma`,
            full: `${GITHUB_ORG}/backend-expressjs-prisma-full`,
        },
        hono: {
            minimal: `${GITHUB_ORG}/backend-hono`,
            standard: `${GITHUB_ORG}/backend-hono`,
            full: `${GITHUB_ORG}/backend-hono-full`,
        },
        "hono-prisma": {
            minimal: `${GITHUB_ORG}/backend-hono-prisma`,
            standard: `${GITHUB_ORG}/backend-hono-prisma`,
            full: `${GITHUB_ORG}/backend-hono-prisma-full`,
        },
    },
};

// Description des presets
export const PRESET_INFO: Record<Preset, { name: string; description: string; emoji: string }> = {
    minimal: {
        name: "Minimal",
        emoji: "📦",
        description: "Framework de base (TypeScript, ESLint, Prettier)",
    },
    standard: {
        name: "Standard",
        emoji: "🎨",
        description: "Minimal + Tailwind CSS",
    },
    full: {
        name: "Full",
        emoji: "🚀",
        description: "Standard + Add-ons populaires (Shadcn/Pinia, TanStack, Zod...)",
    },
};

// Récupérer l'URL du repo d'un template
export function getTemplateRepo(
    type: "frontend" | "backend",
    template: string,
    preset: Preset
): string {
    const repo = TEMPLATE_REPOS[type]?.[template]?.[preset];
    if (!repo) {
        throw new Error(`Template "${template}" with preset "${preset}" not found for type "${type}"`);
    }
    return repo;
}

// Récupérer l'URL de téléchargement d'un template
export function getTemplateUrl(
    type: "frontend" | "backend",
    template: string,
    preset: Preset
): string {
    const repo = getTemplateRepo(type, template, preset);
    return `https://github.com/${repo}`;
}

// Récupérer l'URL du tarball pour téléchargement direct
export function getTemplateTarballUrl(
    type: "frontend" | "backend",
    template: string,
    preset: Preset,
    branch: string = "master"
): string {
    const repo = getTemplateRepo(type, template, preset);
    return `https://codeload.github.com/${repo}/tar.gz/${branch}`;
}

// Liste tous les templates disponibles
export function listTemplates(): { frontend: string[]; backend: string[] } {
    return {
        frontend: Object.keys(TEMPLATE_REPOS.frontend),
        backend: Object.keys(TEMPLATE_REPOS.backend),
    };
}

// Liste les presets disponibles
export function listPresets(): Preset[] {
    return ["minimal", "standard", "full"];
}
