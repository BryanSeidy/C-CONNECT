<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Critical schema fix.
 *
 * `App\Models\User` has always declared `name`, `fullName`, `companyName`,
 * `country`, `isVerified` as fillable, and `AuthController`, `RfqController`,
 * `DisputeController`, and `RecurringOrderController` all read/write them —
 * but no migration ever created these columns on `users`. Only the original
 * scaffold columns `nom`/`prenom` (never referenced anywhere else in the
 * app) exist.
 *
 * Effect before this fix: `User::create()` during registration throws
 * ("column \"name\" of relation \"users\" does not exist"), so **no account
 * can ever be created** against a real Postgres database. RFQ, Dispute, and
 * Recurring Order listings would also throw on their `fullName`/`companyName`
 * eager-load selects.
 *
 * `nom`/`prenom` are also NOT NULL with no default, and nothing populates
 * them anymore — left as-is they would also block every insert. Made
 * nullable rather than dropped, to avoid destroying any already-seeded data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (!Schema::hasColumn('users', 'name')) {
                $table->string('name')->nullable()->after('id');
            }
            if (!Schema::hasColumn('users', 'fullName')) {
                $table->string('fullName')->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'companyName')) {
                $table->string('companyName')->nullable()->after('fullName');
            }
            if (!Schema::hasColumn('users', 'country')) {
                $table->string('country')->nullable()->after('companyName');
            }
            if (!Schema::hasColumn('users', 'isVerified')) {
                $table->boolean('isVerified')->default(false)->after('country');
            }
        });

        // `nom`/`prenom` predate `fullName` and are no longer written by any
        // controller — relax the NOT NULL constraint left over from the
        // original scaffold so inserts stop failing.
        Schema::table('users', function (Blueprint $table): void {
            $table->string('nom')->nullable()->change();
            $table->string('prenom')->nullable()->change();
        });

        $table = 'users';
        if (Schema::hasColumn($table, 'name') && Schema::hasColumn($table, 'fullName')) {
            \Illuminate\Support\Facades\DB::table($table)
                ->whereNull('fullName')
                ->whereNotNull('name')
                ->update(['fullName' => \Illuminate\Support\Facades\DB::raw('"name"')]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            foreach (['name', 'fullName', 'companyName', 'country', 'isVerified'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('nom')->nullable(false)->change();
            $table->string('prenom')->nullable(false)->change();
        });
    }
};
