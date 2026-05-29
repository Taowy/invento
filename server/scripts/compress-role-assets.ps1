# 压缩角色插图：1536px → 480px JPEG，供 OSS 引用
# 用法：powershell -File server/scripts/compress-role-assets.ps1

Add-Type -AssemblyName System.Drawing

$AssetsDir = Join-Path $PSScriptRoot "../../miniprogram/assets/roles"
$MaxWidth = 480
$Quality = 82

function Compress-RoleImage {
    param([string]$SrcPath, [string]$DstPath)

    $img = [System.Drawing.Image]::FromFile($SrcPath)
    try {
        $ratio = $MaxWidth / $img.Width
        $newW = $MaxWidth
        $newH = [int][Math]::Round($img.Height * $ratio)

        $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
        try {
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            try {
                $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $g.Clear([System.Drawing.Color]::White)
                $g.DrawImage($img, 0, 0, $newW, $newH)
            } finally {
                $g.Dispose()
            }

            $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
                Where-Object { $_.MimeType -eq 'image/jpeg' }
            $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
                [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality
            )
            $bmp.Save($DstPath, $encoder, $encParams)
        } finally {
            $bmp.Dispose()
        }
    } finally {
        $img.Dispose()
    }
}

$roles = @('service', 'recorder', 'manager')
foreach ($role in $roles) {
    $src = Join-Path $AssetsDir "role-$role.png"
    $dst = Join-Path $AssetsDir "role-$role.jpg"
    if (-not (Test-Path $src)) {
        Write-Error "缺少文件: $src"
        exit 1
    }
    Compress-RoleImage -SrcPath $src -DstPath $dst
    $kb = [math]::Round((Get-Item $dst).Length / 1KB, 1)
    Write-Host "role-$role.jpg  ${kb} KB"
}

Write-Host "`n完成。请运行: cd server && npm run upload-role-assets"
