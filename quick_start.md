# 🚀 Guide de Démarrage Rapide - JORAN

## ⚡ En 5 minutes chrono

### 1️⃣ Préparez votre projet (30 sec)
```bash
cd joran-astro
mkdir -p src/components public/images
```

### 2️⃣ Copiez les 6 fichiers (2 min)

#### Dans `src/layouts/`
- ✅ **Layout.astro** (Artifact #1)

#### Dans `src/pages/`
- ✅ **index.astro** (Artifact #2 - version avec parallax)
- ✅ **shop.astro** (Artifact #4)

#### Dans `src/components/`
- ✅ **BretonPattern.astro** (Artifact #5 du premier message)
- ✅ **OptimizedImage.astro** (Artifact #6)

#### Dans `public/`
- ✅ **hermine.svg** (Artifact #3 du premier message)

### 3️⃣ Lancez ! (10 sec)
```bash
npm run dev
```

Ouvrez http://localhost:4321 dans votre navigateur.

---

## 🎯 Ce qui fonctionne immédiatement

### Page d'accueil (/)
- ✅ Hero section immersive
- ✅ Menu mobile qui s'ouvre/ferme
- ✅ 4 sections parallax animées
- ✅ Navigation qui se cache au scroll
- ✅ Animations smooth
- ✅ Sections : About, Events, Food, Contact
- ✅ Footer complet

### Page boutique (/shop)
- ✅ Grille de 6 produits d'exemple
- ✅ Filtres par catégorie et origine
- ✅ Tri par nom et prix
- ✅ Bouton "Ajouter au panier" avec feedback
- ✅ Responsive complet

---

## 📱 Tester le menu mobile

1. Réduisez la fenêtre du navigateur (< 768px)
2. Cliquez sur le hamburger (☰)
3. Le menu slide depuis la droite
4. Cliquez sur un lien → le menu se ferme
5. Cliquez en dehors → le menu se ferme

---

## 🖼️ Remplacer les images par les vôtres

### Images parallax (4 à remplacer)

Dans `src/pages/index.astro`, lignes ~500-520 :

```css
/* Remplacer ces URLs Unsplash par vos images */
.parallax-bottles {
  background-image: url('/images/bouteilles.jpg');
}

.parallax-ambiance {
  background-image: url('/images/ambiance.jpg');
}

.parallax-galettes {
  background-image: url('/images/galettes.jpg');
}

.parallax-terrasse {
  background-image: url('/images/terrasse.jpg');
}
```

### Dimensions recommandées
- **Parallax** : 1920x1080px (format paysage)
- **Produits boutique** : 800x800px (format carré)
- **Hero** : 1920x1080px (si vous ajoutez une vraie image)

### Où mettre vos images
```
public/
└── images/
    ├── bouteilles.jpg
    ├── ambiance.jpg
    ├── galettes.jpg
    ├── terrasse.jpg
    └── produits/
        ├── cidre-1.jpg
        ├── cidre-2.jpg
        └── ...
```

---

## 🛍️ Ajouter vos vrais produits

Dans `src/pages/shop.astro`, ligne ~7 :

```javascript
const products = [
  {
    id: 1,
    name: "Votre Cidre",
    producer: "Nom du Producteur",
    price: 12.50,
    category: "Cidre Brut", // Options: Cidre Brut, Cidre Demi-Sec, Poiré, etc.
    origin: "Belgique", // Options: Belgique, France, Bretagne, etc.
    image: "/images/produits/votre-cidre.jpg",
    description: "Description courte du cidre..."
  },
  // Ajoutez autant de produits que vous voulez !
];
```

**Astuce** : Dupliquez un produit existant et modifiez les valeurs.

---

## 🎨 Changer les couleurs

Dans `src/layouts/Layout.astro`, ligne ~15 :

```css
:root {
  --color-primary: #1a3a5c;    /* Votre bleu */
  --color-secondary: #d4af37;   /* Votre or */
  --color-accent: #8b0000;      /* Votre rouge */
}
```

Changez les valeurs hexadécimales, sauvegardez → changement instantané !

---

## ✅ Checklist avant déploiement

- [ ] Remplacer les 4 images parallax
- [ ] Ajouter vos produits dans shop.astro
- [ ] Ajouter photos des produits
- [ ] Vérifier email et téléphone dans Contact
- [ ] Vérifier horaires d'ouverture
- [ ] Tester sur mobile réel
- [ ] Vérifier toutes les animations
- [ ] Tester le menu mobile
- [ ] Compresser les images (TinyPNG)
- [ ] Build de production : `npm run build`

---

## 🚨 Problèmes fréquents

### ❌ "Cannot find module '@astrojs/...'"
```bash
npm install
```

### ❌ Images parallax ne s'affichent pas
- Vérifiez le chemin : `/images/nom.jpg` (slash au début)
- Vérifiez que l'image existe dans `public/images/`

### ❌ Menu mobile ne fonctionne pas
- Vérifiez que le `<script>` est bien à la fin de `index.astro`
- Ouvrez la console (F12) pour voir les erreurs

### ❌ Page blanche
- Regardez la console : F12 → Console
- Vérifiez qu'il n'y a pas d'erreur de syntaxe dans vos modifications

---

## 🎉 C'est tout !

Votre site JORAN est prêt avec :
- ✨ Design breton moderne
- 📱 Menu mobile complet
- 🎨 Parallax entre sections
- 🛍️ Boutique avec filtres
- 🚀 Optimisation des images
- 💯 100% responsive

**Temps total d'intégration : < 5 minutes**

---

## 📞 Besoin d'aide ?

Consultez le **README.md** complet pour plus de détails sur :
- Personnalisation avancée
- Optimisation des performances
- Ajout de fonctionnalités
- Déploiement en production

**Bon développement ! 🍎🍻**