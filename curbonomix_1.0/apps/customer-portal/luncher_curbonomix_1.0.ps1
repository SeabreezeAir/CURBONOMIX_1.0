# Set working directory
Set-Location "C:\Curbonomix_1.0"

# Step 1: Activate Python environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install OCP ezdxf

# Step 2: Install Node packages
npm install --workspaces

# Step 3: Start API (in background)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'apps/api'; npm run dev"

# Step 4: Start frontend (in background)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'apps/customer-portal'; npm run dev"

# Step 5: Confirm launch
Write-Host "`nCurbonomix is launching..."
Write-Host "→ Frontend: http://localhost:3000"
Write-Host "→ API: http://localhost:3001"
Write-Host "`nUse /calculate, /policy, and /audit endpoints to test AI governance."