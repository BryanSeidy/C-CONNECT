<?php

declare(strict_types=1);

namespace App\Services;

final class RccmValidationResult
{
    public function __construct(
        public readonly bool $valide,
        public readonly string $message,
        public readonly ?string $normalized = null,
        public readonly ?string $codeVille = null,
        public readonly ?int $annee = null,
        public readonly ?string $type = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'valide' => $this->valide,
            'message' => $this->message,
            'normalized' => $this->normalized,
            'code_ville' => $this->codeVille,
            'annee' => $this->annee,
            'type' => $this->type,
        ];
    }
}
