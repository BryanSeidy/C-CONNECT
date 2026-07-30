#!/bin/sh
# ==============================================================================
# C-Connect API — Entrypoint Script (Production Container)
# ==============================================================================
# Exécuté avant le démarrage de Supervisor (PHP-FPM + Nginx).
# Gère : permissions, migrations, caches Laravel, et vérification de santé DB.
# ==============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  C-Connect API — Container Entrypoint                   ║"
echo "╚══════════════════════════════════════════════════════════╝"

# ---------------------------------------------------------------------------
# 1. Vérifier que les répertoires de stockage existent et ont les bonnes perms
# ---------------------------------------------------------------------------
echo "[1/6] Vérification des permissions storage & cache..."

mkdir -p \
    storage/logs \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "      ✓ Permissions configurées"

# ---------------------------------------------------------------------------
# 2. Vérifier la connexion à la base de données PostgreSQL (Neon.tech)
# ---------------------------------------------------------------------------
echo "[2/6] Vérification de la connexion PostgreSQL..."

DB_READY=0
MAX_RETRIES=10
RETRY_COUNT=0

while [ $DB_READY -eq 0 ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if php artisan db:monitor --databases=pgsql 2>/dev/null; then
        DB_READY=1
        echo "      ✓ Base de données PostgreSQL accessible"
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "      ⏳ Tentative $RETRY_COUNT/$MAX_RETRIES — attente de la BDD..."
        sleep 3
    fi
done

if [ $DB_READY -eq 0 ]; then
    echo "      ⚠ Impossible de se connecter à PostgreSQL après $MAX_RETRIES tentatives"
    echo "      → L'application démarrera quand même (le failover SQLite peut prendre le relais)"
fi

# ---------------------------------------------------------------------------
# 3. Exécuter les migrations (mode --force pour la production)
# ---------------------------------------------------------------------------
echo "[3/6] Exécution des migrations..."

if [ "$APP_ENV" = "production" ] || [ "$APP_ENV" = "staging" ]; then
    php artisan migrate --force --no-interaction 2>/dev/null || {
        echo "      ⚠ Les migrations ont échoué (la BDD est peut-être déjà à jour)"
    }
else
    php artisan migrate --no-interaction 2>/dev/null || {
        echo "      ⚠ Les migrations ont échoué"
    }
fi

echo "      ✓ Migrations terminées"

# ---------------------------------------------------------------------------
# 4. Générer les caches Laravel (config, routes, views, events)
# ---------------------------------------------------------------------------
echo "[4/6] Génération des caches Laravel..."

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "      ✓ Caches générés (config, routes, views, events)"

# ---------------------------------------------------------------------------
# 5. Créer le lien symbolique storage → public/storage (si absent)
# ---------------------------------------------------------------------------
echo "[5/6] Lien symbolique storage..."

php artisan storage:link --force 2>/dev/null || true

echo "      ✓ Storage link vérifié"

# ---------------------------------------------------------------------------
# 6. Démarrer le processus principal (Supervisor → PHP-FPM + Nginx)
# ---------------------------------------------------------------------------
echo "[6/6] Démarrage de l'application..."
echo "══════════════════════════════════════════════════════════════"

exec "$@"
