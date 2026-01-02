# Guide de Style - JORAN Cidrothèque

## 🎨 Palette de Couleurs

### Couleurs Principales
```css
--color-primary: #1a3a5c    /* Bleu marine breton */
--color-secondary: #d4af37   /* Or cidre */
--color-accent: #8b0000      /* Rouge profond */
--color-hermine: #f8f9fa     /* Blanc cassé */
```

### Utilisation
- **Bleu marine** : Titres, navigation, éléments principaux
- **Or cidre** : Accents, boutons secondaires, highlights
- **Rouge profond** : Badges spéciaux, éléments d'attention
- **Blanc cassé** : Arrière-plans, sections claires

## 📝 Typographie

### Polices
- **Titres** : `Cinzel` (serif élégant)
  - Poids : 400, 600, 700
  - Usage : Tous les h1-h6, logo, navigation
  
- **Corps de texte** : `Lato` (sans-serif moderne)
  - Poids : 300, 400, 700
  - Usage : Paragraphes, descriptions, formulaires

### Hiérarchie
```css
h1 : clamp(2.5rem, 5vw, 4rem)
h2 : clamp(2rem, 4vw, 3rem)
h3 : clamp(1.5rem, 3vw, 2rem)
p  : 1rem (16px base)
```

## 🎯 Composants Réutilisables

### Boutons
```html
<!-- Bouton primaire (bleu) -->
<a href="#" class="btn btn-primary">Texte</a>

<!-- Bouton secondaire (or) -->
<a href="#" class="btn btn-secondary">Texte</a>
```

### Cartes
```html
<div class="feature-card">
  <div class="feature-icon">🍎</div>
  <h3>Titre</h3>
  <p>Description...</p>
</div>
```

### Sections
```html
<section class="section">
  <div class="container">
    <div class="section-header celtic-border">
      <h2>Titre</h2>
      <p class="section-subtitle">Sous-titre</p>
    </div>
    <!-- Contenu -->
  </div>
</section>
```

## 🎭 Motifs Décoratifs

### Bordure Celtique
Ajoute des lignes dorées en haut et en bas :
```html
<div class="celtic-border">
  <!-- Contenu -->
</div>
```

### Motif Hermine
Ajoute un motif subtil en arrière-plan :
```html
<section class="hermine-pattern">
  <!-- Contenu -->
</section>
```

### Utilisation du composant BretonPattern
```astro
import BretonPattern from '../components/BretonPattern.astro';

<section class="my-section">
  <BretonPattern variant="hermine" opacity={0.05} size="medium" />
  <!-- Contenu -->
</section>
```

## 📏 Espacements

### Variables
```css
--spacing-xs: 0.5rem   /* 8px */
--spacing-sm: 1rem     /* 16px */
--spacing-md: 2rem     /* 32px */
--spacing-lg: 4rem     /* 64px */
--spacing-xl: 6rem     /* 96px */
```

### Usage
- **xs** : Espaces entre éléments très proches
- **sm** : Espaces standards entre éléments
- **md** : Padding de cartes, espaces entre sections petites
- **lg** : Padding de sections
- **xl** : Espaces entre grandes sections

## 🎬 Animations

### Transitions Standard
```css
transition: all 0.3s ease;
```

### Effets de Hover
```css
/* Élévation */
transform: translateY(-5px);
box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

/* Changement de couleur */
color: var(--color-secondary);
```

### Animation Flottante
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.element {
  animation: float 3s ease-in-out infinite;
}
```

## 📱 Points de Rupture (Breakpoints)

```css
/* Mobile first approach */

/* Tablettes */
@media (max-width: 768px) {
  /* Styles tablettes */
}

/* Grands écrans */
@media (min-width: 1200px) {
  /* Styles grands écrans */
}
```

## 🖼️ Images Recommandées

### Hero Section
- **Dimensions** : 1920x1080px minimum
- **Format** : WebP avec fallback JPG
- **Sujet** : Vue intérieure de la cidrothèque, ambiance chaleureuse

### Cartes de Features
- **Dimensions** : 800x600px
- **Format** : WebP ou PNG
- **Sujets** : 
  - Bouteilles de cidre alignées
  - Session de musique irlandaise
  - Galettes bretonnes sur assiette

### Optimisation
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

## ✨ Bonnes Pratiques

### Accessibilité
- Toujours utiliser `alt` sur les images
- Contraste minimum 4.5:1 pour le texte
- Navigation clavier complète
- ARIA labels sur les boutons d'action

### Performance
- Lazy loading des images : `loading="lazy"`
- Fonts en preconnect
- CSS critique inline
- Minification en production

### SEO
- Titres h1-h6 hiérarchisés
- Meta descriptions uniques
- Structured data (Schema.org)
- URLs sémantiques

## 🎨 Exemples de Combinaisons

### Section Claire
```css
background: white;
color: var(--color-text);
border-top: 4px solid var(--color-secondary);
```

### Section Foncée
```css
background: linear-gradient(135deg, var(--color-primary), #2c5f8d);
color: white;
```

### Carte avec Accent
```css
background: linear-gradient(135deg, white 0%, #fff8e7 100%);
border-top: 4px solid var(--color-accent);
```

## 📦 Structure des Classes

### Nomenclature BEM
```html
<!-- Bloc -->
<div class="event-card">
  <!-- Élément -->
  <div class="event-card__date">
    <!-- Modificateur -->
    <span class="event-card__date--large">1er</span>
  </div>
</div>
```

### Classes Utilitaires
- `.container` : Conteneur centré max-width
- `.section` : Padding vertical standard
- `.text-center` : Texte centré
- `.mb-lg` : Margin bottom large

---

**Maintenir la cohérence de ce guide pour une identité visuelle forte et reconnaissable** 🎨