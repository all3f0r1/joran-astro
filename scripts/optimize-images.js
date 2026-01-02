/**
 * Script d'optimisation automatique des images
 * 
 * Installation:
 * npm install --save-dev sharp
 * 
 * Usage:
 * node scripts/optimize-images.js
 * 
 * Ce script va :
 * - Convertir toutes les JPG/PNG en WebP
 * - Créer plusieurs tailles responsives
 * - Compresser les images
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

// Configuration
const CONFIG = {
  inputDir: './public/images',
  outputDir: './public/images/optimized',
  
  // Tailles responsives à générer
  sizes: [400, 800, 1200, 1600],
  
  // Qualité de compression
  quality: {
    jpeg: 80,
    webp: 80,
    png: 80
  },
  
  // Extensions à traiter
  extensions: ['.jpg', '.jpeg', '.png']
};

/**
 * Crée le dossier de sortie s'il n'existe pas
 */
async function ensureOutputDir() {
  if (!existsSync(CONFIG.outputDir)) {
    await mkdir(CONFIG.outputDir, { recursive: true });
    console.log(`✅ Dossier créé : ${CONFIG.outputDir}`);
  }
}

/**
 * Liste tous les fichiers images dans le dossier d'entrée
 */
async function getImageFiles() {
  const files = await readdir(CONFIG.inputDir);
  return files.filter(file => {
    const ext = extname(file).toLowerCase();
    return CONFIG.extensions.includes(ext);
  });
}

/**
 * Optimise une seule image
 */
async function optimizeImage(filename) {
  const inputPath = join(CONFIG.inputDir, filename);
  const name = basename(filename, extname(filename));
  const ext = extname(filename).toLowerCase();
  
  console.log(`\n🔄 Traitement de ${filename}...`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // 1. Créer la version WebP optimale
    const webpPath = join(CONFIG.outputDir, `${name}.webp`);
    await image
      .webp({ quality: CONFIG.quality.webp })
      .toFile(webpPath);
    console.log(`  ✓ WebP créé : ${name}.webp`);
    
    // 2. Créer la version optimisée du format original
    const optimizedPath = join(CONFIG.outputDir, filename);
    if (ext === '.png') {
      await sharp(inputPath)
        .png({ quality: CONFIG.quality.png, compressionLevel: 9 })
        .toFile(optimizedPath);
    } else {
      await sharp(inputPath)
        .jpeg({ quality: CONFIG.quality.jpeg, progressive: true })
        .toFile(optimizedPath);
    }
    console.log(`  ✓ Original optimisé : ${filename}`);
    
    // 3. Créer les versions responsives
    for (const size of CONFIG.sizes) {
      if (metadata.width && metadata.width > size) {
        // Version WebP responsive
        const webpResponsivePath = join(CONFIG.outputDir, `${name}-${size}w.webp`);
        await sharp(inputPath)
          .resize(size, null, { withoutEnlargement: true })
          .webp({ quality: CONFIG.quality.webp })
          .toFile(webpResponsivePath);
        
        // Version originale responsive
        const responsivePath = join(CONFIG.outputDir, `${name}-${size}w${ext}`);
        if (ext === '.png') {
          await sharp(inputPath)
            .resize(size, null, { withoutEnlargement: true })
            .png({ quality: CONFIG.quality.png })
            .toFile(responsivePath);
        } else {
          await sharp(inputPath)
            .resize(size, null, { withoutEnlargement: true })
            .jpeg({ quality: CONFIG.quality.jpeg })
            .toFile(responsivePath);
        }
        
        console.log(`  ✓ Version ${size}px créée`);
      }
    }
    
    console.log(`✅ ${filename} optimisé avec succès !`);
    
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filename}:`, error.message);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'optimisation des images...\n');
  console.log(`📂 Dossier source : ${CONFIG.inputDir}`);
  console.log(`📂 Dossier destination : ${CONFIG.outputDir}\n`);
  
  try {
    // Créer le dossier de sortie
    await ensureOutputDir();
    
    // Récupérer la liste des images
    const images = await getImageFiles();
    
    if (images.length === 0) {
      console.log('⚠️  Aucune image trouvée dans le dossier source.');
      return;
    }
    
    console.log(`📸 ${images.length} image(s) trouvée(s)\n`);
    
    // Traiter chaque image
    for (const image of images) {
      await optimizeImage(image);
    }
    
    console.log('\n✨ Optimisation terminée avec succès !');
    console.log(`\n📊 Résumé :`);
    console.log(`   - ${images.length} image(s) traitée(s)`);
    console.log(`   - Formats : WebP + Original`);
    console.log(`   - Tailles responsives : ${CONFIG.sizes.join(', ')}px`);
    console.log(`\n💡 Les images optimisées sont dans : ${CONFIG.outputDir}`);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancer le script
main();

/**
 * INSTRUCTIONS D'UTILISATION
 * ==========================
 * 
 * 1. Installer Sharp :
 *    npm install --save-dev sharp
 * 
 * 2. Créer ce fichier :
 *    mkdir -p scripts
 *    # Copier ce code dans scripts/optimize-images.js
 * 
 * 3. Ajouter un script dans package.json :
 *    "scripts": {
 *      "optimize-images": "node scripts/optimize-images.js"
 *    }
 * 
 * 4. Placer vos images dans public/images/
 * 
 * 5. Lancer l'optimisation :
 *    npm run optimize-images
 * 
 * 6. Les images optimisées seront dans public/images/optimized/
 * 
 * STRUCTURE FINALE
 * ================
 * public/
 * └── images/
 *     ├── photo.jpg (original)
 *     └── optimized/
 *         ├── photo.jpg (compressé)
 *         ├── photo.webp
 *         ├── photo-400w.jpg
 *         ├── photo-400w.webp
 *         ├── photo-800w.jpg
 *         ├── photo-800w.webp
 *         └── ...
 * 
 * UTILISATION DANS LE CODE
 * =========================
 * 
 * Option 1 - Avec le composant OptimizedImage :
 * <OptimizedImage 
 *   src="/images/optimized/photo.jpg"
 *   alt="Description"
 * />
 * 
 * Option 2 - HTML natif :
 * <picture>
 *   <source 
 *     type="image/webp" 
 *     srcset="/images/optimized/photo-400w.webp 400w,
 *             /images/optimized/photo-800w.webp 800w"
 *   />
 *   <img src="/images/optimized/photo.jpg" alt="Description" />
 * </picture>
 */