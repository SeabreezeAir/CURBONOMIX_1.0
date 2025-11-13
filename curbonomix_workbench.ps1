<#
.SYNOPSIS
    Curbonomix Workbench - Carbon Footprint Analysis and Management Tool

.DESCRIPTION
    A comprehensive PowerShell tool for analyzing, tracking, and managing carbon emissions data.
    Includes data collection, analysis, reporting, and visualization capabilities.

.NOTES
    File Name      : Curbonomix-Workbench.ps1
    Author         : Carbon Analysis Team
    Prerequisite   : PowerShell 5.1 or higher
    Version        : 1.0.0
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('Analyze','Report','Import','Export','Dashboard','Configure')]
    [string]$Mode = 'Dashboard',

    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = ".\curbonomix-config.json",

    [Parameter(Mandatory=$false)]
    [string]$DataPath = ".\data",

    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

#region Configuration and Classes

class CarbonEmissionRecord {
    [datetime]$Date
    [string]$Source
    [string]$Category
    [double]$EmissionKgCO2
    [string]$Unit
    [double]$Quantity
    [string]$Location
    [hashtable]$Metadata
}

class EmissionCategory {
    [string]$Name
    [string]$Type
    [double]$ConversionFactor
    [string]$Unit
}

class CurbonomixConfig {
    [string]$OrganizationName
    [string]$ReportingPeriod
    [hashtable]$EmissionFactors
    [array]$DataSources
    [string]$OutputFormat
    [bool]$EnableAutoReporting
}

#endregion

#region Core Functions

function Initialize-Curbonomix {
    <#
    .SYNOPSIS
        Initializes the Curbonomix workbench environment
    #>
    [CmdletBinding()]
    param()

    Write-Host "🌍 Initializing Curbonomix Workbench..." -ForegroundColor Green

    # Create directory structure
    $directories = @(
        $DataPath,
        "$DataPath\raw",
        "$DataPath\processed",
        "$DataPath\reports",
        "$DataPath\exports"
    )

    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Verbose "Created directory: $dir"
        }
    }

    # Load or create configuration
    if (Test-Path $ConfigPath) {
        $script:config = Get-Content $ConfigPath | ConvertFrom-Json
        Write-Host "✓ Configuration loaded from $ConfigPath" -ForegroundColor Cyan
    } else {
        $script:config = New-DefaultConfig
        $script:config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath
        Write-Host "✓ Default configuration created at $ConfigPath" -ForegroundColor Yellow
    }

    Write-Host "✓ Curbonomix Workbench initialized successfully!" -ForegroundColor Green
    Write-Host ""
}

function New-DefaultConfig {
    <#
    .SYNOPSIS
        Creates a default configuration object
    #>
    return [PSCustomObject]@{
        OrganizationName = "Sample Organization"
        ReportingPeriod = "Monthly"
        EmissionFactors = @{
            Electricity_kWh = 0.385  # kg CO2 per kWh
            NaturalGas_m3 = 1.931    # kg CO2 per cubic meter
            Gasoline_Liter = 2.31    # kg CO2 per liter
            Diesel_Liter = 2.68      # kg CO2 per liter
            Flight_Short_km = 0.255  # kg CO2 per km (short haul)
            Flight_Long_km = 0.195   # kg CO2 per km (long haul)
            Car_km = 0.192           # kg CO2 per km
            Train_km = 0.041         # kg CO2 per km
        }
        DataSources = @(
            "Energy",
            "Transportation",
            "Facilities",
            "Travel",
            "Waste"
        )
        OutputFormat = "JSON"
        EnableAutoReporting = $true
        ReductionTarget = 25  # Percentage reduction target
        BaselineYear = 2020
    }
}

function Import-EmissionData {
    <#
    .SYNOPSIS
        Imports emission data from various sources
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath,

        [Parameter(Mandatory=$false)]
        [ValidateSet('CSV','JSON','XML','Excel')]
        [string]$Format = 'CSV'
    )

    Write-Host "📥 Importing emission data from: $FilePath" -ForegroundColor Cyan

    try {
        switch ($Format) {
            'CSV' {
                $data = Import-Csv -Path $FilePath
            }
            'JSON' {
                $data = Get-Content -Path $FilePath | ConvertFrom-Json
            }
            'XML' {
                $data = Import-Clixml -Path $FilePath
            }
            default {
                throw "Unsupported format: $Format"
            }
        }

        Write-Host "✓ Successfully imported $($data.Count) records" -ForegroundColor Green
        return $data

    } catch {
        Write-Error "Failed to import data: $_"
        return $null
    }
}

function Calculate-CarbonFootprint {
    <#
    .SYNOPSIS
        Calculates carbon footprint from activity data
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [array]$ActivityData,

        [Parameter(Mandatory=$false)]
        [hashtable]$EmissionFactors = $script:config.EmissionFactors
    )

    Write-Host "🔬 Calculating carbon footprint..." -ForegroundColor Cyan

    $results = @()

    foreach ($activity in $ActivityData) {
        $emission = [PSCustomObject]@{
            Date = $activity.Date
            Source = $activity.Source
            Category = $activity.Category
            Quantity = $activity.Quantity
            Unit = $activity.Unit
            EmissionKgCO2 = 0
            EmissionTonnesCO2 = 0
        }

        # Find matching emission factor
        $factorKey = "$($activity.Category)_$($activity.Unit)"

        if ($EmissionFactors.ContainsKey($factorKey)) {
            $factor = $EmissionFactors[$factorKey]
            $emission.EmissionKgCO2 = $activity.Quantity * $factor
            $emission.EmissionTonnesCO2 = $emission.EmissionKgCO2 / 1000
        } else {
            Write-Warning "No emission factor found for: $factorKey"
        }

        $results += $emission
    }

    Write-Host "✓ Calculated emissions for $($results.Count) activities" -ForegroundColor Green
    return $results
}

function Get-EmissionSummary {
    <#
    .SYNOPSIS
        Generates a summary of emissions data
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [array]$EmissionData,

        [Parameter(Mandatory=$false)]
        [ValidateSet('Daily','Weekly','Monthly','Quarterly','Yearly')]
        [string]$GroupBy = 'Monthly'
    )

    Write-Host "📊 Generating emission summary..." -ForegroundColor Cyan

    $summary = @{
        TotalEmissions = ($EmissionData | Measure-Object -Property EmissionKgCO2 -Sum).Sum
        TotalEmissionsTonnes = (($EmissionData | Measure-Object -Property EmissionKgCO2 -Sum).Sum) / 1000
        RecordCount = $EmissionData.Count
        DateRange = @{
            Start = ($EmissionData.Date | Measure-Object -Minimum).Minimum
            End = ($EmissionData.Date | Measure-Object -Maximum).Maximum
        }
        ByCategory = @{}
        BySource = @{}
    }

    # Group by category
    $categories = $EmissionData | Group-Object -Property Category
    foreach ($cat in $categories) {
        $summary.ByCategory[$cat.Name] = @{
            Count = $cat.Count
            TotalKgCO2 = ($cat.Group | Measure-Object -Property EmissionKgCO2 -Sum).Sum
            Percentage = [math]::Round((($cat.Group | Measure-Object -Property EmissionKgCO2 -Sum).Sum / $summary.TotalEmissions) * 100, 2)
        }
    }

    # Group by source
    $sources = $EmissionData | Group-Object -Property Source
    foreach ($src in $sources) {
        $summary.BySource[$src.Name] = @{
            Count = $src.Count
            TotalKgCO2 = ($src.Group | Measure-Object -Property EmissionKgCO2 -Sum).Sum
            Percentage = [math]::Round((($src.Group | Measure-Object -Property EmissionKgCO2 -Sum).Sum / $summary.TotalEmissions) * 100, 2)
        }
    }

    return $summary
}

function New-EmissionReport {
    <#
    .SYNOPSIS
        Creates a detailed emission report
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [hashtable]$Summary,

        [Parameter(Mandatory=$false)]
        [string]$OutputPath = "$DataPath\reports",

        [Parameter(Mandatory=$false)]
        [ValidateSet('HTML','PDF','JSON','CSV')]
        [string]$Format = 'HTML'
    )

    Write-Host "📄 Generating emission report..." -ForegroundColor Cyan

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportName = "CarbonReport_$timestamp"

    if ($Format -eq 'HTML') {
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Curbonomix Carbon Emission Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .header { background-color: #2c5f2d; color: white; padding: 20px; border-radius: 5px; }
        .metric { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric h3 { color: #2c5f2d; margin-top: 0; }
        .chart { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; background-color: white; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #2c5f2d; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .footer { margin-top: 30px; text-align: center; color: #666; }
        .high-emission { color: #d32f2f; font-weight: bold; }
        .low-emission { color: #388e3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌍 Curbonomix Carbon Emission Report</h1>
        <p>Organization: $($script:config.OrganizationName)</p>
        <p>Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
    </div>

    <div class="metric">
        <h3>📊 Total Emissions</h3>
        <p><strong>Total CO2:</strong> $([math]::Round($Summary.TotalEmissions, 2)) kg ($([math]::Round($Summary.TotalEmissionsTonnes, 2)) tonnes)</p>
        <p><strong>Period:</strong> $($Summary.DateRange.Start) to $($Summary.DateRange.End)</p>
        <p><strong>Records Analyzed:</strong> $($Summary.RecordCount)</p>
    </div>

    <div class="metric">
        <h3>📈 Emissions by Category</h3>
        <table>
            <tr>
                <th>Category</th>
                <th>Total (kg CO2)</th>
                <th>Percentage</th>
                <th>Count</th>
            </tr>
"@

        foreach ($cat in $Summary.ByCategory.Keys) {
            $data = $Summary.ByCategory[$cat]
            $html += @"
            <tr>
                <td>$cat</td>
                <td>$([math]::Round($data.TotalKgCO2, 2))</td>
                <td>$($data.Percentage)%</td>
                <td>$($data.Count)</td>
            </tr>
"@
        }

        $html += @"
        </table>
    </div>

    <div class="metric">
        <h3>🔌 Emissions by Source</h3>
        <table>
            <tr>
                <th>Source</th>
                <th>Total (kg CO2)</th>
                <th>Percentage</th>
                <th>Count</th>
            </tr>
"@

        foreach ($src in $Summary.BySource.Keys) {
            $data = $Summary.BySource[$src]
            $html += @"
            <tr>
                <td>$src</td>
                <td>$([math]::Round($data.TotalKgCO2, 2))</td>
                <td>$($data.Percentage)%</td>
                <td>$($data.Count)</td>
            </tr>
"@
        }

        $html += @"
        </table>
    </div>

    <div class="footer">
        <p>Generated by Curbonomix Workbench | Powered by PowerShell</p>
    </div>
</body>
</html>
"@

        $reportPath = Join-Path $OutputPath "$reportName.html"
        $html | Out-File -FilePath $reportPath -Encoding UTF8
        Write-Host "✓ Report saved to: $reportPath" -ForegroundColor Green

        # Open report in default browser
        Start-Process $reportPath

    } elseif ($Format -eq 'JSON') {
        $reportPath = Join-Path $OutputPath "$reportName.json"
        $Summary | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath
        Write-Host "✓ Report saved to: $reportPath" -ForegroundColor Green
    }

    return $reportPath
}

function Show-Dashboard {
    <#
    .SYNOPSIS
        Displays an interactive console dashboard
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$false)]
        [array]$EmissionData
    )

    Clear-Host

    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║         🌍 CURBONOMIX WORKBENCH DASHBOARD 🌍                 ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Organization: $($script:config.OrganizationName)" -ForegroundColor Cyan
    Write-Host "Reporting Period: $($script:config.ReportingPeriod)" -ForegroundColor Cyan
    Write-Host ""

    if ($EmissionData) {
        $summary = Get-EmissionSummary -EmissionData $EmissionData

        Write-Host "📊 EMISSION SUMMARY" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
        Write-Host "Total Emissions: " -NoNewline
        Write-Host "$([math]::Round($summary.TotalEmissions, 2)) kg CO2 " -ForegroundColor Red -NoNewline
        Write-Host "($([math]::Round($summary.TotalEmissionsTonnes, 3)) tonnes)" -ForegroundColor Red
        Write-Host "Records: $($summary.RecordCount)" -ForegroundColor White
        Write-Host ""

        Write-Host "📈 TOP CATEGORIES" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
        $topCategories = $summary.ByCategory.GetEnumerator() | Sort-Object {$_.Value.TotalKgCO2} -Descending | Select-Object -First 5
        foreach ($cat in $topCategories) {
            $bar = "█" * [math]::Floor($cat.Value.Percentage / 2)
            Write-Host "$($cat.Key): " -NoNewline -ForegroundColor Cyan
            Write-Host "$bar " -NoNewline -ForegroundColor Green
            Write-Host "$($cat.Value.Percentage)%" -ForegroundColor White
        }
        Write-Host ""
    }

    Write-Host "⚙️  AVAILABLE ACTIONS" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "[1] Import Data" -ForegroundColor White
    Write-Host "[2] Analyze Emissions" -ForegroundColor White
    Write-Host "[3] Generate Report" -ForegroundColor White
    Write-Host "[4] Export Data" -ForegroundColor White
    Write-Host "[5] Configure Settings" -ForegroundColor White
    Write-Host "[6] View Trends" -ForegroundColor White
    Write-Host "[Q] Quit" -ForegroundColor White
    Write-Host ""
}

function Export-EmissionData {
    <#
    .SYNOPSIS
        Exports emission data to various formats
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [array]$Data,

        [Parameter(Mandatory=$false)]
        [string]$OutputPath = "$DataPath\exports",

        [Parameter(Mandatory=$false)]
        [ValidateSet('CSV','JSON','XML','Excel')]
        [string]$Format = 'CSV'
    )

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $fileName = "EmissionData_$timestamp"

    try {
        switch ($Format) {
            'CSV' {
                $filePath = Join-Path $OutputPath "$fileName.csv"
                $Data | Export-Csv -Path $filePath -NoTypeInformation
            }
            'JSON' {
                $filePath = Join-Path $OutputPath "$fileName.json"
                $Data | ConvertTo-Json -Depth 10 | Out-File -FilePath $filePath
            }
            'XML' {
                $filePath = Join-Path $OutputPath "$fileName.xml"
                $Data | Export-Clixml -Path $filePath
            }
        }

        Write-Host "✓ Data exported to: $filePath" -ForegroundColor Green
        return $filePath

    } catch {
        Write-Error "Failed to export data: $_"
        return $null
    }
}

function Get-EmissionTrend {
    <#
    .SYNOPSIS
        Analyzes emission trends over time
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [array]$EmissionData,

        [Parameter(Mandatory=$false)]
        [ValidateSet('Daily','Weekly','Monthly')]
        [string]$Interval = 'Monthly'
    )

    Write-Host "📈 Analyzing emission trends..." -ForegroundColor Cyan

    $groupedData = switch ($Interval) {
        'Daily' { $EmissionData | Group-Object {([datetime]$_.Date).ToString("yyyy-MM-dd")} }
        'Weekly' { $EmissionData | Group-Object {Get-Date $_.Date -UFormat "%Y-W%V"} }
        'Monthly' { $EmissionData | Group-Object {([datetime]$_.Date).ToString("yyyy-MM")} }
    }

    $trends = @()
    foreach ($group in $groupedData | Sort-Object Name) {
        $trends += [PSCustomObject]@{
            Period = $group.Name
            TotalEmissions = ($group.Group | Measure-Object -Property EmissionKgCO2 -Sum).Sum
            RecordCount = $group.Count
            AverageEmission = ($group.Group | Measure-Object -Property EmissionKgCO2 -Average).Average
        }
    }

    return $trends
}

function Test-EmissionData {
    <#
    .SYNOPSIS
        Validates emission data for completeness and accuracy
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [array]$Data
    )

    Write-Host "🔍 Validating emission data..." -ForegroundColor Cyan

    $validationResults = @{
        TotalRecords = $Data.Count
        ValidRecords = 0
        InvalidRecords = 0
        Warnings = @()
        Errors = @()
    }

    foreach ($record in $Data) {
        $isValid = $true

        # Check required fields
        if ([string]::IsNullOrEmpty($record.Category)) {
            $validationResults.Errors += "Missing category in record"
            $isValid = $false
        }

        if ($record.Quantity -le 0) {
            $validationResults.Warnings += "Zero or negative quantity detected"
        }

        if ($isValid) {
            $validationResults.ValidRecords++
        } else {
            $validationResults.InvalidRecords++
        }
    }

    Write-Host "✓ Validation complete:" -ForegroundColor Green
    Write-Host "  Valid: $($validationResults.ValidRecords)" -ForegroundColor Green
    Write-Host "  Invalid: $($validationResults.InvalidRecords)" -ForegroundColor Red
    Write-Host "  Warnings: $($validationResults.Warnings.Count)" -ForegroundColor Yellow

    return $validationResults
}

function New-SampleData {
    <#
    .SYNOPSIS
        Generates sample emission data for testing
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$false)]
        [int]$RecordCount = 100
    )

    Write-Host "🔬 Generating sample emission data..." -ForegroundColor Cyan

    $categories = @('Electricity', 'NaturalGas', 'Gasoline', 'Diesel', 'Flight_Short', 'Flight_Long', 'Car', 'Train')
    $units = @('kWh', 'm3', 'Liter', 'Liter', 'km', 'km', 'km', 'km')
    $sources = @('Office', 'Warehouse', 'Fleet', 'Travel', 'Production')
    $locations = @('HQ', 'Branch A', 'Branch B', 'Remote')

    $sampleData = @()
    $startDate = (Get-Date).AddDays(-365)

    for ($i = 0; $i -lt $RecordCount; $i++) {
        $catIndex = Get-Random -Minimum 0 -Maximum $categories.Count
        $sampleData += [PSCustomObject]@{
            Date = $startDate.AddDays((Get-Random -Minimum 0 -Maximum 365))
            Source = $sources | Get-Random
            Category = $categories[$catIndex]
            Quantity = [math]::Round((Get-Random -Minimum 1 -Maximum 1000), 2)
            Unit = $units[$catIndex]
            Location = $locations | Get-Random
        }
    }

    Write-Host "✓ Generated $RecordCount sample records" -ForegroundColor Green
    return $sampleData
}

#endregion

#region Main Execution

function Start-Curbonomix {
    <#
    .SYNOPSIS
        Main entry point for Curbonomix Workbench
    #>

    Initialize-Curbonomix

    switch ($Mode) {
        'Dashboard' {
            $running = $true
            $emissionData = $null

            while ($running) {
                Show-Dashboard -EmissionData $emissionData

                $choice = Read-Host "Select an option"

                switch ($choice) {
                    '1' {
                        # Import Data
                        Write-Host "`n Would you like to use sample data? (Y/N): " -NoNewline
                        $useSample = Read-Host

                        if ($useSample -eq 'Y') {
                            $activityData = New-SampleData -RecordCount 50
                            $emissionData = Calculate-CarbonFootprint -ActivityData $activityData
                            Write-Host "`n✓ Sample data loaded and calculated!" -ForegroundColor Green
                        } else {
                            $filePath = Read-Host "`nEnter file path"
                            if (Test-Path $filePath) {
                                $activityData = Import-EmissionData -FilePath $filePath
                                if ($activityData) {
                                    $emissionData = Calculate-CarbonFootprint -ActivityData $activityData
                                }
                            } else {
                                Write-Host "File not found!" -ForegroundColor Red
                            }
                        }
                        Read-Host "`nPress Enter to continue"
                    }
                    '2' {
                        # Analyze Emissions
                        if ($emissionData) {
                            $summary = Get-EmissionSummary -EmissionData $emissionData
                            $summary | Format-List
                        } else {
                            Write-Host "`nNo data loaded. Please import data first." -ForegroundColor Yellow
                        }
                        Read-Host "`nPress Enter to continue"
                    }
                    '3' {
                        # Generate Report
                        if ($emissionData) {
                            $summary = Get-EmissionSummary -EmissionData $emissionData
                            New-EmissionReport -Summary $summary -Format HTML
                        } else {
                            Write-Host "`nNo data loaded. Please import data first." -ForegroundColor Yellow
                        }
                        Read-Host "`nPress Enter to continue"
                    }
                    '4' {
                        # Export Data
                        if ($emissionData) {
                            Export-EmissionData -Data $emissionData -Format CSV
                        } else {
                            Write-Host "`nNo data loaded. Please import data first." -ForegroundColor Yellow
                        }
                        Read-Host "`nPress Enter to continue"
                    }
                    '5' {
                        # Configure Settings
                        Write-Host "`nCurrent Configuration:" -ForegroundColor Cyan
                        $script:config | Format-List
                        Read-Host "`nPress Enter to continue"
                    }
                    '6' {
                        # View Trends
                        if ($emissionData) {
                            $trends = Get-EmissionTrend -EmissionData $emissionData -Interval Monthly
                            Write-Host "`n📈 EMISSION TRENDS" -ForegroundColor Yellow
                            $trends | Format-Table -AutoSize
                        } else {
                            Write-Host "`nNo data loaded. Please import data first." -ForegroundColor Yellow
                        }
                        Read-Host "`nPress Enter to continue"
                    }
                    'Q' {
                        $running = $false
                        Write-Host "`n👋 Thank you for using Curbonomix Workbench!" -ForegroundColor Green
                    }
                    default {
                        Write-Host "`nInvalid option. Please try again." -ForegroundColor Red
                        Start-Sleep -Seconds 1
                    }
                }
            }
        }

        'Analyze' {
            Write-Host "Analyze mode not yet implemented" -ForegroundColor Yellow
        }

        'Report' {
            Write-Host "Report mode not yet implemented" -ForegroundColor Yellow
        }

        'Import' {
            Write-Host "Import mode not yet implemented" -ForegroundColor Yellow
        }

        'Export' {
            Write-Host "Export mode not yet implemented" -ForegroundColor Yellow
        }

        'Configure' {
            Write-Host "Configure mode not yet implemented" -ForegroundColor Yellow
        }
    }
}

# Execute main function
Start-Curbonomix

#endregion