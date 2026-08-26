$ErrorActionPreference = 'Stop'

$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'browser'))
$rootPrefix = $root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$port = 8780
$listener = $null

while ($true) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    $listener.Start()
    break
  } catch {
    if ($listener) { $listener.Stop() }
    $port += 1
    if ($port -gt 8790) {
      Write-Host 'No se pudo encontrar un puerto local disponible.' -ForegroundColor Red
      Read-Host 'Presioná Enter para cerrar'
      exit 1
    }
  }
}

$url = "http://127.0.0.1:$port/"

function Get-ContentType([string] $extension) {
  switch ($extension.ToLowerInvariant()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.js' { return 'text/javascript; charset=utf-8' }
    '.css' { return 'text/css; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.webmanifest' { return 'application/manifest+json; charset=utf-8' }
    '.png' { return 'image/png' }
    '.jpg' { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.svg' { return 'image/svg+xml' }
    '.ico' { return 'image/x-icon' }
    '.ogg' { return 'audio/ogg' }
    '.mp3' { return 'audio/mpeg' }
    '.woff' { return 'font/woff' }
    '.woff2' { return 'font/woff2' }
    default { return 'application/octet-stream' }
  }
}

function Send-Response($stream, [string] $status, [string] $contentType, [byte[]] $body) {
  $header = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
}

function Send-Text($stream, [string] $status, [string] $message) {
  $body = [Text.Encoding]::UTF8.GetBytes($message)
  Send-Response $stream $status 'text/plain; charset=utf-8' $body
}

Write-Host "SEMANTIAR Juegos está listo en $url" -ForegroundColor Cyan
Write-Host 'Dejá esta ventana abierta mientras usás el juego.' -ForegroundColor Yellow
try {
  Start-Process $url
} catch {
  Write-Host "Abrí manualmente esta dirección: $url" -ForegroundColor Yellow
}

try {
  while ($true) {
    $client = $null
    $stream = $null
    try {
      $client = $listener.AcceptTcpClient()
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      while (($headerLine = $reader.ReadLine()) -ne $null -and $headerLine -ne '') { }

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        Send-Text $stream '400 Bad Request' 'Solicitud inválida.'
        continue
      }

      $requestParts = $requestLine.Split(' ')
      if ($requestParts.Length -lt 2 -or $requestParts[0] -ne 'GET') {
        Send-Text $stream '405 Method Not Allowed' 'Método no permitido.'
        continue
      }

      $requestPath = $requestParts[1].Split('?')[0]
      $relativePath = [Uri]::UnescapeDataString($requestPath.TrimStart('/')).Replace('/', [IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }

      $filePath = [IO.Path]::GetFullPath((Join-Path $root $relativePath))
      $insideRoot = $filePath.Equals($root, [StringComparison]::OrdinalIgnoreCase) -or
        $filePath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)
      if (-not $insideRoot) {
        Send-Text $stream '403 Forbidden' 'Acceso no permitido.'
        continue
      }

      if (-not (Test-Path $filePath -PathType Leaf)) {
        if ([IO.Path]::GetExtension($filePath) -eq '') {
          $filePath = Join-Path $root 'index.html'
        } else {
          Send-Text $stream '404 Not Found' 'Archivo no encontrado.'
          continue
        }
      }

      $bytes = [IO.File]::ReadAllBytes($filePath)
      Send-Response $stream '200 OK' (Get-ContentType ([IO.Path]::GetExtension($filePath))) $bytes
    } catch {
      if ($stream) {
        try { Send-Text $stream '500 Internal Server Error' 'Error interno del servidor.' } catch { }
      }
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      if ($client) { $client.Dispose() }
      $reader = $null
    }
  }
} finally {
  $listener.Stop()
}
