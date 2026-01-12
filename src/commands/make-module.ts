import pc from "picocolors";
import ora from "ora";
import fs from "fs";
import path from "path";

interface ModuleTemplate {
    filename: string;
    content: string;
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getControllerTemplate(name: string, capitalizedName: string): string {
    return `import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ${capitalizedName}Service } from './${name}.service';
import { Create${capitalizedName}Dto } from './dto/create-${name}.dto';
import { Update${capitalizedName}Dto } from './dto/update-${name}.dto';

@Controller('${name}')
export class ${capitalizedName}Controller {
  constructor(private readonly ${name}Service: ${capitalizedName}Service) {}

  @Get()
  findAll() {
    return this.${name}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${name}Service.findOne(id);
  }

  @Post()
  create(@Body() create${capitalizedName}Dto: Create${capitalizedName}Dto) {
    return this.${name}Service.create(create${capitalizedName}Dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() update${capitalizedName}Dto: Update${capitalizedName}Dto) {
    return this.${name}Service.update(id, update${capitalizedName}Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${name}Service.remove(id);
  }
}
`;
}

function getServiceTemplate(name: string, capitalizedName: string): string {
    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { Create${capitalizedName}Dto } from './dto/create-${name}.dto';
import { Update${capitalizedName}Dto } from './dto/update-${name}.dto';

@Injectable()
export class ${capitalizedName}Service {
  private ${name}s: any[] = [];

  findAll() {
    return this.${name}s;
  }

  findOne(id: string) {
    const ${name} = this.${name}s.find(item => item.id === id);
    if (!${name}) {
      throw new NotFoundException(\`${capitalizedName} with ID "\${id}" not found\`);
    }
    return ${name};
  }

  create(create${capitalizedName}Dto: Create${capitalizedName}Dto) {
    const new${capitalizedName} = {
      id: Date.now().toString(),
      ...create${capitalizedName}Dto,
    };
    this.${name}s.push(new${capitalizedName});
    return new${capitalizedName};
  }

  update(id: string, update${capitalizedName}Dto: Update${capitalizedName}Dto) {
    const index = this.${name}s.findIndex(item => item.id === id);
    if (index === -1) {
      throw new NotFoundException(\`${capitalizedName} with ID "\${id}" not found\`);
    }
    this.${name}s[index] = { ...this.${name}s[index], ...update${capitalizedName}Dto };
    return this.${name}s[index];
  }

  remove(id: string) {
    const index = this.${name}s.findIndex(item => item.id === id);
    if (index === -1) {
      throw new NotFoundException(\`${capitalizedName} with ID "\${id}" not found\`);
    }
    const removed = this.${name}s.splice(index, 1);
    return removed[0];
  }
}
`;
}

function getModuleTemplate(name: string, capitalizedName: string): string {
    return `import { Module } from '@nestjs/common';
import { ${capitalizedName}Controller } from './${name}.controller';
import { ${capitalizedName}Service } from './${name}.service';

@Module({
  controllers: [${capitalizedName}Controller],
  providers: [${capitalizedName}Service],
  exports: [${capitalizedName}Service],
})
export class ${capitalizedName}Module {}
`;
}

function getCreateDtoTemplate(name: string, capitalizedName: string): string {
    return `export class Create${capitalizedName}Dto {
  // Ajoute tes propriétés ici
  // Exemple:
  // @IsString()
  // @IsNotEmpty()
  // name: string;
}
`;
}

function getUpdateDtoTemplate(name: string, capitalizedName: string): string {
    return `import { PartialType } from '@nestjs/mapped-types';
import { Create${capitalizedName}Dto } from './create-${name}.dto';

export class Update${capitalizedName}Dto extends PartialType(Create${capitalizedName}Dto) {}
`;
}

function getExpressControllerTemplate(name: string, capitalizedName: string): string {
    return `import { Request, Response } from 'express';

// GET /${name}
export const getAll${capitalizedName}s = async (req: Request, res: Response) => {
  try {
    // TODO: Implémenter la logique
    res.json({ message: 'Get all ${name}s' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /${name}/:id
export const get${capitalizedName}ById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Implémenter la logique
    res.json({ message: \`Get ${name} \${id}\` });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /${name}
export const create${capitalizedName} = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // TODO: Implémenter la logique
    res.status(201).json({ message: '${capitalizedName} created', data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /${name}/:id
export const update${capitalizedName} = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // TODO: Implémenter la logique
    res.json({ message: \`${capitalizedName} \${id} updated\`, data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /${name}/:id
export const delete${capitalizedName} = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Implémenter la logique
    res.json({ message: \`${capitalizedName} \${id} deleted\` });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
`;
}

function getExpressRouteTemplate(name: string, capitalizedName: string): string {
    return `import { Router } from 'express';
import {
  getAll${capitalizedName}s,
  get${capitalizedName}ById,
  create${capitalizedName},
  update${capitalizedName},
  delete${capitalizedName},
} from './${name}.controller';

const router = Router();

router.get('/', getAll${capitalizedName}s);
router.get('/:id', get${capitalizedName}ById);
router.post('/', create${capitalizedName});
router.put('/:id', update${capitalizedName});
router.delete('/:id', delete${capitalizedName});

export default router;
`;
}

export async function makeModuleCommand(name: string): Promise<void> {
    console.log(pc.cyan(pc.bold(`\n🔧 Génération du module "${name}"...\n`)));

    const moduleName = name.toLowerCase();
    const capitalizedName = capitalize(moduleName);

    // Détecter le type de backend
    const backendPath = path.join(process.cwd(), "backend");
    const srcPath = path.join(backendPath, "src");

    if (!fs.existsSync(backendPath)) {
        console.log(pc.red("  ❌ Dossier 'backend' non trouvé."));
        console.log(pc.dim("  Assure-toi d'être à la racine d'un projet DualSync.\n"));
        process.exit(1);
    }

    // Détecter si c'est NestJS ou Express
    const packageJsonPath = path.join(backendPath, "package.json");
    let backendType: "nestjs" | "express" | "hono" = "express";

    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps["@nestjs/core"]) {
            backendType = "nestjs";
        } else if (deps["hono"]) {
            backendType = "hono";
        }
    }

    const spinner = ora(`Création du module ${moduleName} (${backendType})...`).start();

    try {
        if (backendType === "nestjs") {
            // Créer la structure pour NestJS
            const modulePath = path.join(srcPath, moduleName);
            const dtoPath = path.join(modulePath, "dto");

            fs.mkdirSync(modulePath, { recursive: true });
            fs.mkdirSync(dtoPath, { recursive: true });

            // Créer les fichiers
            fs.writeFileSync(path.join(modulePath, `${moduleName}.controller.ts`), getControllerTemplate(moduleName, capitalizedName));
            fs.writeFileSync(path.join(modulePath, `${moduleName}.service.ts`), getServiceTemplate(moduleName, capitalizedName));
            fs.writeFileSync(path.join(modulePath, `${moduleName}.module.ts`), getModuleTemplate(moduleName, capitalizedName));
            fs.writeFileSync(path.join(dtoPath, `create-${moduleName}.dto.ts`), getCreateDtoTemplate(moduleName, capitalizedName));
            fs.writeFileSync(path.join(dtoPath, `update-${moduleName}.dto.ts`), getUpdateDtoTemplate(moduleName, capitalizedName));

            spinner.succeed(pc.green(`Module ${moduleName} créé !`));

            console.log(pc.cyan("\n  📁 Fichiers créés :"));
            console.log(pc.dim("  ─────────────────────────────────────────────"));
            console.log(`  ${pc.dim("•")} backend/src/${moduleName}/${moduleName}.controller.ts`);
            console.log(`  ${pc.dim("•")} backend/src/${moduleName}/${moduleName}.service.ts`);
            console.log(`  ${pc.dim("•")} backend/src/${moduleName}/${moduleName}.module.ts`);
            console.log(`  ${pc.dim("•")} backend/src/${moduleName}/dto/create-${moduleName}.dto.ts`);
            console.log(`  ${pc.dim("•")} backend/src/${moduleName}/dto/update-${moduleName}.dto.ts`);

            console.log(pc.yellow("\n  ⚠️  N'oublie pas d'importer le module dans app.module.ts :"));
            console.log(pc.dim(`  import { ${capitalizedName}Module } from './${moduleName}/${moduleName}.module';`));
            console.log(pc.dim(`  @Module({ imports: [..., ${capitalizedName}Module] })\n`));

        } else {
            // Créer la structure pour Express/Hono
            const modulePath = path.join(srcPath, moduleName);

            fs.mkdirSync(modulePath, { recursive: true });

            fs.writeFileSync(path.join(modulePath, `${moduleName}.controller.ts`), getExpressControllerTemplate(moduleName, capitalizedName));
            fs.writeFileSync(path.join(modulePath, `${moduleName}.routes.ts`), getExpressRouteTemplate(moduleName, capitalizedName));

            spinner.succeed(pc.green(`Module ${moduleName} créé !`));

            console.log(pc.cyan("\n  📁 Fichiers créés :"));
            console.log(pc.dim("  ─────────────────────────────────────────────"));
            console.log(`  ${pc.dim("•")} backend/src/${moduleName}/${moduleName}.controller.ts`);
            console.log(`  ${pc.dim("•")} backend/src/${moduleName}/${moduleName}.routes.ts`);

            console.log(pc.yellow("\n  ⚠️  N'oublie pas d'ajouter les routes dans ton app :"));
            console.log(pc.dim(`  import ${moduleName}Routes from './${moduleName}/${moduleName}.routes';`));
            console.log(pc.dim(`  app.use('/${moduleName}', ${moduleName}Routes);\n`));
        }

    } catch (error) {
        spinner.fail(pc.red("Erreur lors de la création du module."));
        console.error(pc.dim(String(error)));
        process.exit(1);
    }
}
