param(
  [switch]$Stripe = $false,
  [string]$EnvBaseUrl = "https://curbonomix.com"
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
function W($m){ Write-Host "==> $m" -ForegroundColor Cyan }
function PM() {
  if (Test-Path ".\pnpm-lock.yaml") { "pnpm" }
  elseif (Test-Path ".\yarn.lock") { "yarn" }
  else { "npm" }
}
function Run($c){ Write-Host "  $c" -ForegroundColor DarkGray; iex $c }
function Backup-Once($f){ if (Test-Path $f -and -not (Test-Path "$f.bak")){ Copy-Item $f "$f.bak" } }
function Replace-Or-Insert([string]$file,[string]$find,[string]$repl,[string]$after=""){
  $t = Get-Content $file -Raw
  if ($t -match $find){ $n = [regex]::Replace($t,$find,$repl,"Singleline") }
  elseif ($after -and $t -match $after){ $m=[regex]::Match($t,$after,"Singleline"); $n=$t.Insert($m.Index+$m.Length,"`n$repl`n") }
  else { $n = $t + "`n`n$repl`n" }
  if ($n -ne $t){ Backup-Once $file; Set-Content -Path $file -Value $n -NoNewline; $true } else { $false }
}
function Ensure-Lines([string]$file,[string[]]$lines){
  if (!(Test-Path $file)) { New-Item -ItemType File -Path $file | Out-Null }
  $cur = Get-Content $file -Raw
  $changed = $false
  foreach($ln in $lines){ if ($cur -notmatch [regex]::Escape($ln)){ Add-Content -Path $file -Value $ln; $changed=$true } }
  $changed
}
$pm = PM
W "Install deps via $pm"
switch ($pm) {
  "pnpm" { Run "pnpm add @react-three/fiber @react-three/drei"; if ($Stripe){ Run "pnpm add stripe" } }
  "yarn" { Run "yarn add @react-three/fiber @react-three/drei"; if ($Stripe){ Run "yarn add stripe" } }
  default { Run "npm i @react-three/fiber @react-three/drei"; if ($Stripe){ Run "npm i stripe" } }
}
W "Find UI file"
$ui = Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js | ? { (Get-Content $_.FullName -Raw) -match "Curb Adapter Calculator|Curbonomix|CONFIG\.shipping" } | Sort-Object { $_.FullName.Length } | Select-Object -First 1
if (-not $ui){ throw "Curbonomix UI file not found." }
Write-Host "Using: $($ui.FullName)" -ForegroundColor Yellow
$shipBlock = @"
const SHIPPING_ALIAS_MAP: Record<string, keyof typeof CONFIG.shipping> = {
  standard: 'standard', std: 'standard', normal: 'standard',
  rush: 'rush', express: 'rush', fast: 'rush', '12days': 'rush', '1to2days': 'rush', '1-2days': 'rush',
  sameday: 'sameDay', 'same-day': 'sameDay', same_day: 'sameDay', emergency: 'sameDay', emergencysameday: 'sameDay',
};
function normalizeShipKey(x: any): string { const s=String(x??'').toLowerCase().trim(); return s.replace(/[\\s_\\-–—]/g,''); }
const VALID_SHIPPING_KEYS = Object.keys(CONFIG.shipping) as (keyof typeof CONFIG.shipping)[];
function safeShippingKey(k: any): keyof typeof CONFIG.shipping {
  if ((VALID_SHIPPING_KEYS as any).includes(k)) return k as keyof typeof CONFIG.shipping;
  const norm = normalizeShipKey(k); if ((SHIPPING_ALIAS_MAP as any)[norm]) return (SHIPPING_ALIAS_MAP as any)[norm];
  return 'standard';
}
function getShipMult(key: any) { const k = safeShippingKey(key); return CONFIG.shipping?.[k]?.multiplier ?? 1.0; }
"@
[void](Replace-Or-Insert $ui.FullName "const\s+VALID_SHIPPING_KEYS[\s\S]*?function\s+getShipMult[\s\S]*?\}" $shipBlock "const\s+CONFIG\s*=\s*\{[\s\S]*?\}\s*as\s+const;")
[void](Replace-Or-Insert $ui.FullName "CONFIG\.shipping\[[^\]]+\]\.multiplier" "getShipMult(form.shipping)")
[void](Replace-Or-Insert $ui.FullName "CONFIG\.shipping\[(form\.shipping|[^\]]+)\]\.label" "CONFIG.shipping[safeShippingKey($1)].label")
$faq = @"
function FAQ({ q, a }: { q: string; a: string }) {
  return (<details className=\"bg-white border rounded-2xl p-4 hover:shadow-sm\">
    <summary className=\"cursor-pointer font-medium list-none focus:outline-none\">{q}</summary>
    <p className=\"text-neutral-600 mt-2\">{a}</p>
  </details>);
}
"@
[void](Replace-Or-Insert $ui.FullName "function\s+FAQ\s*\(" $faq "export\s+default\s+function|function\s+\w+\s*\(")
$txt = Get-Content $ui.FullName -Raw
if ($txt -match "function\s+Visualizer3D\([\s\S]*?\)\s*\{"){
  $m=[regex]::Match($txt,"function\s+Visualizer3D\([\s\S]*?\)\s*\{","Singleline")
  $guard = "`n  if (!libs || !libs.Fiber || !libs.Drei) { return (<div className=""w-full h-full grid place-items-center bg-black text-white""><p>Loading 3D visualizer…</p></div>); }`n"
  $has = $txt.Substring($m.Index+$m.Length,[Math]::Min(300,$txt.Length-$m.Index-$m.Length)) -match "Loading 3D visualizer"
  if (-not $has){ Backup-Once $ui.FullName; $txt = $txt.Insert($m.Index+$m.Length,$guard); Set-Content -Path $ui.FullName -Value $txt -NoNewline }
}
$addedEnv = Ensure-Lines ".env" @("NEXT_PUBLIC_BASE_URL=$EnvBaseUrl")
if ($Stripe){ $null = Ensure-Lines ".env" @("STRIPE_SECRET_KEY=sk_test_xxx") }
Write-Host "Patched UI and .env. Done." -ForegroundColor Green