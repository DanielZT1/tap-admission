<?php

namespace App\Services;

use Illuminate\Support\Str;

class CodeGenerator
{
    public function make(string $prefix): string
    {
        return $prefix.'-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
    }
}
