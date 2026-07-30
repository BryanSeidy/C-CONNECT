# ==============================================================================
# C-Connect API — Dockerfile Multi-Stage (Laravel 12 / PHP 8.3 Alpine)
# ==============================================================================
#
# Stage 1 : "dev"  — Environnement de développement local avec Composer & Xdebug
# Stage 2 : "prod" — Image production-ready avec PHP-FPM + Nginx + Supervisor
#
# Usage Dev   : docker compose up api
# Usage Prod  : docker build --target prod -t cconnect-api:latest ./backend
# ==============================================================================

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║  STAGE 1 — DEVELOPMENT                                                    ║
# ╚════════════════════════════════════════════════════════════════════════════╝
FROM php:8.3-fpm-alpine AS dev

LABEL maintainer="C-Connect Team"
LABEL description="C-Connect Laravel 12 API — Development Stage"

# ---------------------------------------------------------------------------
# Dépendances système & extensions PHP requises par Laravel + PostgreSQL
# ---------------------------------------------------------------------------
RUN apk add --no-cache \
        # PostgreSQL client libs
        postgresql-dev \
        postgresql-client \
        # Pour les extensions GD (avatars, thumbnails)
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        # Pour les extensions ZIP (Composer)
        libzip-dev \
        zip \
        unzip \
        # ICU pour intl (Laravel localization)
        icu-dev \
        # Outils de dev
        git \
        curl \
        bash \
        linux-headers \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        intl \
        opcache \
        bcmath \
        pcntl \
    && rm -rf /var/cache/apk/*

# ---------------------------------------------------------------------------
# Configuration PHP pour le développement
# ---------------------------------------------------------------------------
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

COPY docker/php-dev.ini $PHP_INI_DIR/conf.d/99-cconnect-dev.ini

# ---------------------------------------------------------------------------
# Installer Composer depuis l'image officielle
# ---------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ---------------------------------------------------------------------------
# Répertoire de travail
# ---------------------------------------------------------------------------
WORKDIR /var/www/html

# ---------------------------------------------------------------------------
# Copier les dépendances Composer d'abord (cache Docker layers)
# ---------------------------------------------------------------------------
COPY composer.json composer.lock ./

RUN composer install \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction

# ---------------------------------------------------------------------------
# Copier le reste du code source
# ---------------------------------------------------------------------------
COPY . .

# ---------------------------------------------------------------------------
# Finaliser l'autoloader Composer
# ---------------------------------------------------------------------------
RUN composer dump-autoload --optimize

# ---------------------------------------------------------------------------
# Permissions strictes sur les répertoires d'écriture Laravel
# ---------------------------------------------------------------------------
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 9000

USER www-data

CMD ["php-fpm"]


# ╔════════════════════════════════════════════════════════════════════════════╗
# ║  STAGE 2 — PRODUCTION (PHP-FPM + Nginx + Supervisor)                      ║
# ╚════════════════════════════════════════════════════════════════════════════╝
FROM php:8.3-fpm-alpine AS prod

LABEL maintainer="C-Connect Team"
LABEL description="C-Connect Laravel 12 API — Production Stage (Autonomous)"

# ---------------------------------------------------------------------------
# Dépendances système : runtime uniquement (pas de dev tools)
# ---------------------------------------------------------------------------
RUN apk add --no-cache \
        postgresql-dev \
        postgresql-client \
        libpng \
        libjpeg-turbo \
        freetype \
        libzip \
        icu-libs \
        nginx \
        supervisor \
        curl \
        bash \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        intl \
        opcache \
        bcmath \
        pcntl \
    && rm -rf /var/cache/apk/*

# ---------------------------------------------------------------------------
# Configuration PHP pour la production (sécurité & performance)
# ---------------------------------------------------------------------------
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php-prod.ini $PHP_INI_DIR/conf.d/99-cconnect-prod.ini

# ---------------------------------------------------------------------------
# Configuration Nginx
# ---------------------------------------------------------------------------
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
RUN rm -f /etc/nginx/http.d/default.conf.bak

# ---------------------------------------------------------------------------
# Configuration Supervisor (PHP-FPM + Nginx)
# ---------------------------------------------------------------------------
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ---------------------------------------------------------------------------
# Entrypoint script (migrations, cache, permissions)
# ---------------------------------------------------------------------------
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# ---------------------------------------------------------------------------
# Répertoire de travail
# ---------------------------------------------------------------------------
WORKDIR /var/www/html

# ---------------------------------------------------------------------------
# Copier les dépendances Composer depuis le stage dev (sans dev deps)
# ---------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./

RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction \
    && rm -f /usr/bin/composer

# ---------------------------------------------------------------------------
# Copier le code source (sans fichiers inutiles — voir .dockerignore)
# ---------------------------------------------------------------------------
COPY . .

# ---------------------------------------------------------------------------
# Finaliser l'autoloader pour la production
# ---------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer dump-autoload --optimize --classmap-authoritative \
    && rm -f /usr/bin/composer

# ---------------------------------------------------------------------------
# Préparer les répertoires de stockage Laravel
# ---------------------------------------------------------------------------
RUN mkdir -p \
        storage/logs \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/testing \
        storage/framework/views \
        bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# ---------------------------------------------------------------------------
# Créer les répertoires nécessaires pour Nginx & Supervisor
# ---------------------------------------------------------------------------
RUN mkdir -p /run/nginx /var/log/supervisor

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
