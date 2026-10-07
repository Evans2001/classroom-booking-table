$ErrorActionPreference = 'Stop'
$mobileRoot = Join-Path $PSScriptRoot '../../room-booking-lecturer-flutter'
$firebaseConfig = Get-Content (Join-Path $mobileRoot 'android/app/google-services.json') -Raw | ConvertFrom-Json
$matchingClient = @($firebaseConfig.client | Where-Object {
    $_.client_info.android_client_info.package_name -eq 'lk.ac.ruh.eng.roombooking.lecturer'
})
if ($matchingClient.Count -eq 0) {
    throw 'Download Firebase configuration for lk.ac.ruh.eng.roombooking.lecturer before building.'
}
if (-not (Test-Path (Join-Path $mobileRoot 'android/key.properties'))) {
    throw 'Release signing configuration is missing.'
}
Push-Location $mobileRoot
try {
    & flutter build apk --release --split-per-abi --dart-define=API_BASE_URL=https://booking.161.118.220.77.sslip.io
    if ($LASTEXITCODE -ne 0) { throw 'Release build failed.' }
} finally {
    Pop-Location
}
