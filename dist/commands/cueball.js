import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
}
export async function createCueball(name) {
    const projectRoot = process.cwd();
    const kebabName = toKebabCase(name);
    const templatesDir = join(__dirname, '..', '..', 'templates', 'cueball');
    console.log(chalk.blue.bold(`\n🎯 Creating Cueball: ${name}\n`));
    // Check if cueballs directory exists
    const cueballsDir = join(projectRoot, 'cueballs');
    if (!existsSync(cueballsDir)) {
        console.log(chalk.yellow('⚠️  Cueballs directory not found. Creating it...'));
        mkdirSync(cueballsDir, { recursive: true });
    }
    // Check if cueball already exists
    const cueballPath = join(cueballsDir, `${kebabName}.html`);
    if (existsSync(cueballPath)) {
        console.log(chalk.red(`❌ Cueball '${kebabName}' already exists!`));
        process.exit(1);
    }
    try {
        // Create CSS directory if it doesn't exist
        const cssDir = join(projectRoot, 'css');
        if (!existsSync(cssDir)) {
            mkdirSync(cssDir, { recursive: true });
        }
        // Create JS directory if it doesn't exist
        const jsDir = join(projectRoot, 'js');
        if (!existsSync(jsDir)) {
            mkdirSync(jsDir, { recursive: true });
        }
        // Read templates
        const htmlTemplate = readFileSync(join(templatesDir, 'cueball.html'), 'utf8');
        const cssTemplate = readFileSync(join(templatesDir, 'cueball.css'), 'utf8');
        const jsTemplate = readFileSync(join(templatesDir, 'cueball.js'), 'utf8');
        // Replace placeholders
        const replacements = {
            '{{NAME}}': name,
            '{{KEBAB_NAME}}': kebabName
        };
        let html = htmlTemplate;
        let css = cssTemplate;
        let js = jsTemplate;
        for (const [placeholder, value] of Object.entries(replacements)) {
            html = html.replace(new RegExp(placeholder, 'g'), value);
            css = css.replace(new RegExp(placeholder, 'g'), value);
            js = js.replace(new RegExp(placeholder, 'g'), value);
        }
        // Write files
        writeFileSync(join(cueballsDir, `${kebabName}.html`), html);
        console.log(chalk.green('✓') + chalk.gray(` Created cueballs/${kebabName}.html`));
        writeFileSync(join(cssDir, `${kebabName}.css`), css);
        console.log(chalk.green('✓') + chalk.gray(` Created css/${kebabName}.css`));
        writeFileSync(join(jsDir, `${kebabName}.js`), js);
        console.log(chalk.green('✓') + chalk.gray(` Created js/${kebabName}.js`));
        console.log(chalk.green('\n✨ Cueball created successfully!\n'));
        console.log(chalk.cyan('📋 Usage:'));
        console.log(chalk.white('   From QLab OSC:'));
        console.log(chalk.gray(`   /cuepernova/cuestation/showScreen/cueball ${kebabName} [arg1] [arg2] [arg3]`));
        console.log(chalk.white('   Direct URL:'));
        console.log(chalk.gray(`   http://localhost:8080/cueballs/${kebabName}.html?arg1=value&arg2=value\n`));
    }
    catch (error) {
        console.error(chalk.red('❌ Failed to create cueball:'), error.message);
        process.exit(1);
    }
}
