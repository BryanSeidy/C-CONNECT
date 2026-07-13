<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cconnect_webhooks' => [
        'secret' => env('CCONNECT_WEBHOOK_SECRET', 'local-cconnect-webhook-secret'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Orange Money Core API (OM-CORE 1.0.2)
    |--------------------------------------------------------------------------
    | Identifiants obtenus via le portail développeur Orange (apiis.orange.cm).
    | Flux Merchant Payment : /mp/init -> /mp/pay -> /mp/paymentstatus.
    | En sandbox : https://api-s1.orange.cm
    | En production : même host (à confirmer après activation).
    */
    'orange_money' => [
        'base_url' => env('ORANGE_MONEY_BASE_URL', 'https://api-s1.orange.cm'),
        'auth_token' => env('ORANGE_MONEY_AUTH_TOKEN', ''),
        'consumer_key' => env('ORANGE_MONEY_CONSUMER_KEY', ''),
        'consumer_secret' => env('ORANGE_MONEY_CONSUMER_SECRET', ''),
        'channel_msisdn' => env('ORANGE_MONEY_CHANNEL_MSISDN', ''),
        'pin' => env('ORANGE_MONEY_PIN', ''),
        'mode' => env('ORANGE_MONEY_MODE', 'sandbox'), // sandbox|production
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID',),
        'client_secret' => env('GOOGLE_CLIENT_SECRET',),
        'redirect' => env('GOOGLE_REDIRECT_URL',),
    ],

    /*
     * Anthropic (IA) — config partagée pour toute fonctionnalité IA de
     * C-Connect : recherche marketplace en langage naturel (AiClient +
     * SmartSearchController), assistant contextuel et amélioration de texte
     * (AssistantController). Sans ANTHROPIC_API_KEY en .env, chaque
     * fonctionnalité se désactive proprement (isConfigured() / message
     * explicatif) plutôt que de planter — jamais un prérequis.
     */
    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY', ''),
        'model' => env('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'),
    ],

];
