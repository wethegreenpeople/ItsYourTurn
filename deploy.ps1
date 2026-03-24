$vars = @{}
Get-Content .env.local | Where-Object { $_ -match '=' } | ForEach-Object {
    $k, $v = $_ -split '=', 2
    $vars[$k.Trim()] = $v.Trim()
}

fly deploy `
    --build-arg VITE_SUPABASE_URL="$($vars['VITE_SUPABASE_URL'])" `
    --build-arg VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY="$($vars['VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY'])"
