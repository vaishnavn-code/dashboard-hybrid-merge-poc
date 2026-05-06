param(
    [ValidateSet("all", "frontend", "frontend-ops", "backend")]
    [string]$Target = "all",

    [string]$FrontendFolder,
    [string]$SwaDeploymentToken,
    [string]$BackendFolder = "backend"
)

$ErrorActionPreference = "Stop"

# =========================
# CONFIG
# =========================
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$FrontendApiBase = "https://sap-cloud-analytics-aah0gbcrf3ckgefc.centralindia-01.azurewebsites.net"

$BackendZipName = "backend_deploy.zip"
$BackendAppName = "sap-cloud-analytics"
$BackendResourceGroup = "fs-sap-cloud-analytics"

# =========================
# HELPERS
# =========================
function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

function Ensure-PathExists {
    param([string]$PathToCheck, [string]$Label)
    if (-not (Test-Path $PathToCheck)) {
        throw "$Label not found: $PathToCheck"
    }
}

function Ensure-FrontendInputs {
    param(
        [string]$Folder,
        [string]$Token
    )

    if ([string]::IsNullOrWhiteSpace($Folder)) {
        throw "You must provide -FrontendFolder when deploying frontend."
    }

    if ([string]::IsNullOrWhiteSpace($Token)) {
        throw "You must provide -SwaDeploymentToken when deploying frontend."
    }
}

# =========================
# FRONTEND DEPLOY
# =========================
function Deploy-Frontend {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FrontendFolder,

        [Parameter(Mandatory = $true)]
        [string]$DeploymentToken
    )

    $FrontendPath = Join-Path $ProjectRoot $FrontendFolder

    Write-Step "Deploying Frontend: $FrontendFolder"

    Ensure-PathExists -PathToCheck $FrontendPath -Label "Frontend folder"

    Push-Location $FrontendPath
    try {
        Write-Host "Cleaning dist folder..." -ForegroundColor Yellow
        if (Test-Path ".\dist") {
            Remove-Item -Recurse -Force ".\dist"
        }

        Write-Host "Cleaning Vite cache..." -ForegroundColor Yellow
        if (Test-Path ".\node_modules\.vite") {
            Remove-Item -Recurse -Force ".\node_modules\.vite"
        }

        Write-Host "Setting VITE_API_BASE..." -ForegroundColor Yellow
        $env:VITE_API_BASE = $FrontendApiBase

        Write-Host "Building frontend..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed."
        }
    
        if (Test-Path ".\staticwebapp.config.json") {
            Write-Host "Copying staticwebapp.config.json to dist..." -ForegroundColor Yellow
            Copy-Item ".\staticwebapp.config.json" ".\dist\staticwebapp.config.json" -Force
        }
        else {
            Write-Host "No staticwebapp.config.json found. Skipping copy." -ForegroundColor DarkYellow
        }

        Write-Host "Deploying to Azure Static Web Apps..." -ForegroundColor Yellow
        npx @azure/static-web-apps-cli deploy .\dist\ --deployment-token $DeploymentToken --env production
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend deployment failed."
        }

        Write-Host "Frontend '$FrontendFolder' deployed successfully." -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

# =========================
# BACKEND DEPLOY
# =========================
function Deploy-Backend {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BackendFolder
    )

    $BackendPath = Join-Path $ProjectRoot $BackendFolder

    Write-Step "Deploying Backend"

    Ensure-PathExists -PathToCheck $BackendPath -Label "Backend folder"

    Push-Location $BackendPath
    try {
        $ZipPath = Join-Path $BackendPath $BackendZipName

        Write-Host "Removing old deployment zip if present..." -ForegroundColor Yellow
        if (Test-Path $ZipPath) {
            Remove-Item -Force $ZipPath
        }

        Write-Host "Creating backend deployment zip..." -ForegroundColor Yellow

        $filesToZip = @("main.py", "requirements.txt")

        $itemsToZip = $filesToZip | ForEach-Object {
            $fullPath = Join-Path $BackendPath $_
            if (Test-Path $fullPath) {
                Get-Item $fullPath
            } else {
                throw "Required file '$_' not found in backend folder."
            }
        }

        $itemsToZip | Compress-Archive -DestinationPath $ZipPath -Force

        Write-Host "Deploying backend zip to Azure Web App..." -ForegroundColor Yellow
        az webapp deployment source config-zip `
            --name $BackendAppName `
            --resource-group $BackendResourceGroup `
            --src $ZipPath

        if ($LASTEXITCODE -ne 0) {
            throw "Backend deployment failed."
        }

        Write-Host "Backend deployed successfully." -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

# =========================
# MAIN
# =========================
Write-Step "Starting Deployment: $Target"

switch ($Target) {
    "frontend" {
        Ensure-FrontendInputs -Folder $FrontendFolder -Token $SwaDeploymentToken
        Deploy-Frontend -FrontendFolder $FrontendFolder -DeploymentToken $SwaDeploymentToken
    }
    "frontend-ops" {
        Ensure-FrontendInputs -Folder $FrontendFolder -Token $SwaDeploymentToken
        Deploy-Frontend -FrontendFolder $FrontendFolder -DeploymentToken $SwaDeploymentToken
    }
    "backend" {
        Deploy-Backend -BackendFolder $BackendFolder
    }
    "all" {
        Ensure-FrontendInputs -Folder $FrontendFolder -Token $SwaDeploymentToken
        Deploy-Frontend -FrontendFolder $FrontendFolder -DeploymentToken $SwaDeploymentToken
        Deploy-Backend -BackendFolder $BackendFolder
    }
}

Write-Host ""
Write-Host "Deployment completed." -ForegroundColor Green