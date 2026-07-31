# ==============================================================================
# C-Connect API — Dockerfile Multi-Stage (Laravel 12 / PHP 8.4 Alpine)
# ==============================================================================
#
# Stage 1 : "dev"  — Environnement de développement local avec Composer
# Stage 2 : "prod" — Image production-ready avec PHP-FPM + Nginx + Supervisor
#
# Usage Dev   : docker compose up api
# Usage Prod  : docker build --target prod -t cconnect-api:latest ./backend
#
# Exige PHP >= 8.4.1 (Symfony 8.x / Laravel framework 13.x)
# ==============================================================================

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║  STAGE 1 — DEVELOPMENT                                                    ║
# ╚════════════════════════════════════════════════════════════════════════════╝
FROM php:8.4-fpm-alpine AS dev
LABEL maintainer="C-Connect Team"
LABEL description="C-Connect Laravel 12 API — Development Stage (PHP 8.4)"

# ---------------------------------------------------------------------------
# Dépendances système & extensions PHP requises par Laravel + PostgreSQL
# ---------------------------------------------------------------------------
# Note : Sur Alpine 3.21+ (base de php:8.4-fpm-alpine), icu-dev peut être
# remplacé par icu-libs + icu-dev pour la compilation.
# linux-headers est nécessaire pour pcntl sur Alpine.
# ---------------------------------------------------------------------------
RUN apk add --no-cache \
        # PostgreSQL client libs (compilation + runtime)
        postgresql-dev \
        postgresql-client \
        # Extensions GD (avatars, thumbnails marketplace)
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        # Extensions ZIP (Composer, exports)
        libzip-dev \
        zip \
        unzip \
        # ICU pour intl (Laravel localization fr/en)
        icu-dev \
        # Outils de développement
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
# Installer Composer 2.x depuis l'image officielle
# ---------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ---------------------------------------------------------------------------
# Répertoire de travail
# ---------------------------------------------------------------------------
WORKDIR /var/www/html

# ---------------------------------------------------------------------------
# Copier les fichiers de dépendances d'abord (cache Docker layers)
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
RUN mkdir -p \
        storage/logs \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/testing \
        storage/framework/views \
        bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 9000

USER www-data

CMD ["php-fpm"]


# ╔════════════════════════════════════════════════════════════════════════════╗
# ║  STAGE 2 — PRODUCTION (PHP-FPM + Nginx + Supervisor)                      ║
# ╚════════════════════════════════════════════════════════════════════════════╝
FROM php:8.4-fpm-alpine AS prod

LABEL maintainer="C-Connect Team"
LABEL description="C-Connect Laravel 12 API — Production Stage (PHP 8.4, Autonomous)"

# ---------------------------------------------------------------------------
# Dépendances système : runtime uniquement (pas de dev tools)
# On installe les *-dev packages uniquement pour compiler les extensions,
# puis on les supprime pour réduire la taille de l'image.
# ---------------------------------------------------------------------------
RUN apk add --no-cache --virtual .build-deps \
        postgresql-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        icu-dev \
        linux-headers \
    && apk add --no-cache \
        # Runtime libs (pas les -dev)
        postgresql-libs \
        postgresql-client \
        libpng \
        libjpeg-turbo \
        freetype \
        libzip \
        icu-libs \
        # Services
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
    && apk del .build-deps \
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
# Installer les dépendances Composer (sans packages dev)
# ---------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./

RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction

# ---------------------------------------------------------------------------
# Copier le code source (filtré par .dockerignore)
# ---------------------------------------------------------------------------
COPY . .

# ---------------------------------------------------------------------------
# Finaliser l'autoloader pour la production (classmap authoritative)
# ---------------------------------------------------------------------------
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
# Répertoires pour Nginx & Supervisor
# ---------------------------------------------------------------------------
RUN mkdir -p /run/nginx /var/log/supervisor /var/log/php

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
