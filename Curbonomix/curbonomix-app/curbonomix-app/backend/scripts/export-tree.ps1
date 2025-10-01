param([string]$OutFile = "tree.txt", [int]$Depth = 3)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
try {
  npx --yes tree-cli -l $Depth -I "node_modules|.next|.git|dist|build|.vercel" | Out-File -FilePath $OutFile -Encoding utf8
} catch {
  Get-ChildItem -Recurse -Depth $Depth -File -Exclude node_modules,.next,.git,dist,build,.vercel `
    | ForEach-Object { $_.FullName.Replace((Get-Location).Path + "\","") } `
    | Out-File -FilePath $OutFile -Encoding utf8
}
Write-Host "Exported project tree to $OutFile"