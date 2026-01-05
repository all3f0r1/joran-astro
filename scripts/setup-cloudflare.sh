#!/bin/bash

# Script de configuration initiale pour Cloudflare Pages + Workers
# Usage: ./scripts/setup-cloudflare.sh

set -e

echo "🚀 Configuration de Cloudflare pour JORAN Cidrothèque"
echo ""

# Vérifier que wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler n'est pas installé."
    echo "   Installer avec: npm install -g wrangler"
    exit 1
fi

echo "✓ Wrangler détecté"
echo ""

# Login Cloudflare
echo "1️⃣  Connexion à Cloudflare..."
wrangler login

echo ""
echo "2️⃣  Création de la base de données D1..."
read -p "Nom de la base de données (défaut: joran-production): " DB_NAME
DB_NAME=${DB_NAME:-joran-production}

echo "Création de $DB_NAME..."
wrangler d1 create "$DB_NAME"

echo ""
echo "⚠️  Copiez l'ID de la base et mettez-le dans wrangler.toml"
read -p "Appuyez sur Entrée pour continuer..."

echo ""
echo "3️⃣  Application du schéma de base de données..."
wrangler d1 execute "$DB_NAME" --file=schema.sql

echo ""
echo "4️⃣  Création des namespaces KV..."

echo "Création du namespace SESSIONS..."
wrangler kv:namespace create "SESSIONS"
echo "⚠️  Copiez l'ID et mettez-le dans wrangler.toml (binding = SESSIONS)"
read -p "Appuyez sur Entrée pour continuer..."

echo ""
echo "Création du namespace CACHE..."
wrangler kv:namespace create "CACHE"
echo "⚠️  Copiez l'ID et mettez-le dans wrangler.toml (binding = CACHE)"
read -p "Appuyez sur Entrée pour continuer..."

echo ""
echo "5️⃣  Création du bucket R2 pour les images..."
read -p "Nom du bucket R2 (défaut: joran-images): " BUCKET_NAME
BUCKET_NAME=${BUCKET_NAME:-joran-images}

wrangler r2 bucket create "$BUCKET_NAME"

echo ""
echo "6️⃣  Configuration des secrets..."
echo ""
echo "TURNSTILE_SECRET_KEY (obtenir sur cloudflare.com/turnstile):"
wrangler secret put TURNSTILE_SECRET_KEY

echo ""
echo "ADMIN_JWT_SECRET (générer un secret aléatoire):"
wrangler secret put ADMIN_JWT_SECRET

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Mettre à jour wrangler.toml avec les IDs des ressources créées"
echo "   2. Configurer les GitHub Secrets:"
echo "      - CLOUDFLARE_API_TOKEN"
echo "      - CLOUDFLARE_ACCOUNT_ID"
echo "   3. Configurer Cloudflare Zero Trust pour /admin/*"
echo "   4. Obtenir les clés Turnstile sur cloudflare.com/turnstile"
echo "   5. Pousser sur GitHub pour déclencher le déploiement"
echo ""
echo "📖 Voir CLOUDFLARE_WORKFLOW.md pour plus de détails"
