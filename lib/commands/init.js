import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copyDirectory(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export async function initProject(options) {
  const projectRoot = process.cwd();
  const templatesDir = join(__dirname, '..', '..', 'templates', 'init');
  
  console.log(chalk.blue.bold('\n🎭 Initializing Cuepernova Project\n'));
  
  const directories = ['cueballs', 'media'];
  const files = [
    { src: 'cuepernova.config.json', dest: 'cuepernova.config.json' },
    { src: 'cues.json', dest: 'cues.json' },
    { src: 'cueballs/example.html', dest: 'cueballs/example.html' },
    { src: 'media/.gitkeep', dest: 'media/.gitkeep' }
  ];
  
  // Check for existing files
  const existingItems = [];
  for (const dir of directories) {
    if (existsSync(join(projectRoot, dir))) {
      existingItems.push(dir);
    }
  }
  if (existsSync(join(projectRoot, 'cuepernova.config.json'))) {
    existingItems.push('cuepernova.config.json');
  }
  if (existsSync(join(projectRoot, 'cues.json'))) {
    existingItems.push('cues.json');
  }
  
  if (existingItems.length > 0 && !options.force) {
    console.log(chalk.yellow('⚠️  The following items already exist:'));
    existingItems.forEach(item => console.log(chalk.gray(`   - ${item}`)));
    console.log(chalk.red('\n❌ Initialization cancelled to prevent overwriting.'));
    console.log(chalk.gray('   Use --force to overwrite existing files.\n'));
    process.exit(1);
  }
  
  try {
    // Create directories
    for (const dir of directories) {
      const dirPath = join(projectRoot, dir);
      mkdirSync(dirPath, { recursive: true });
      console.log(chalk.green('✓') + chalk.gray(` Created ${dir}/`));
    }
    
    // Copy files
    for (const file of files) {
      const srcPath = join(templatesDir, file.src);
      const destPath = join(projectRoot, file.dest);
      
      // Ensure parent directory exists
      mkdirSync(dirname(destPath), { recursive: true });
      
      copyFileSync(srcPath, destPath);
      console.log(chalk.green('✓') + chalk.gray(` Created ${file.dest}`));
    }
    
    console.log(chalk.green('\n✨ Project initialized successfully!\n'));
    console.log(chalk.cyan('📋 Next steps:'));
    console.log(chalk.white('   1. Install dependencies:'));
    console.log(chalk.gray('      npm install'));
    console.log(chalk.white('   2. Start the server:'));
    console.log(chalk.gray('      npx cuepernova start'));
    console.log(chalk.white('   3. Create a new cueball:'));
    console.log(chalk.gray('      npx cuepernova cueball my-effect\n'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize project:'), error.message);
    process.exit(1);
  }
}