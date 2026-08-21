$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$ffmpeg = Join-Path $repoRoot 'node_modules\ffmpeg-static\ffmpeg.exe'
if (-not (Test-Path -LiteralPath $ffmpeg)) {
  throw "FFmpeg binary not found: $ffmpeg"
}

$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("longdd-xfade-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot | Out-Null

try {
  $a = Join-Path $testRoot 'a.mp4'
  $b = Join-Path $testRoot 'b.mp4'
  $c = Join-Path $testRoot 'c.mp4'
  $voice = Join-Path $testRoot 'voice.wav'
  $output = Join-Path $testRoot 'output.mp4'
  $insert = Join-Path $testRoot 'insert.png'
  $overlayOutput = Join-Path $testRoot 'overlay-output.mp4'

  & $ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=red:s=640x360:r=30:d=2.4' -an -c:v libx264 -pix_fmt yuv420p $a
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create transition fixture A' }
  & $ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=green:s=640x360:r=30:d=2.4' -an -c:v libx264 -pix_fmt yuv420p $b
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create transition fixture B' }
  & $ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=blue:s=640x360:r=30:d=2.0' -an -c:v libx264 -pix_fmt yuv420p $c
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create transition fixture C' }
  & $ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'sine=frequency=440:duration=6' $voice
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create transition audio fixture' }
  & $ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=yellow:s=900x600' -frames:v 1 $insert
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create researched-image overlay fixture' }

  $graph = '[0:v]settb=AVTB,setpts=PTS-STARTPTS[v0];[1:v]settb=AVTB,setpts=PTS-STARTPTS[v1];[2:v]settb=AVTB,setpts=PTS-STARTPTS[v2];[v0][v1]xfade=transition=dissolve:duration=0.400000:offset=2.000000[vx1];[vx1][v2]xfade=transition=wipeleft:duration=0.400000:offset=4.000000[vx2];[vx2]format=yuv420p[vout]'
  & $ffmpeg -hide_banner -loglevel error -y -i $a -i $b -i $c -i $voice -filter_complex $graph -map '[vout]' -map '3:a' -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 192k -t 6.000 -shortest $output
  if ($LASTEXITCODE -ne 0) { throw 'FFmpeg xfade render failed' }

  $ErrorActionPreference = 'Continue'
  $probe = (& $ffmpeg -hide_banner -i $output 2>&1 | Out-String)
  $ErrorActionPreference = 'Stop'
  if ($probe -notmatch 'Duration:\s+00:00:06\.00') {
    throw "Unexpected xfade output duration.`n$probe"
  }
  if ($probe -notmatch 'Video:.*yuv420p') {
    throw "Unexpected xfade output pixel format.`n$probe"
  }

  $overlayGraph = "[0:v]scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:color=black,fps=30,format=yuv420p[base];[1:v]scale=230:144:force_original_aspect_ratio=increase,crop=230:144,setsar=1,pad=242:156:6:6:color=white,format=rgba,fade=t=in:st=0:d=0.25:alpha=1,fade=t=out:st=1.7:d=0.25:alpha=1[insert];[base][insert]overlay=x='W-w-29':y='22':format=auto,format=yuv420p[vout]"
  & $ffmpeg -hide_banner -loglevel error -y -i $a -loop 1 -framerate 30 -i $insert -filter_complex $overlayGraph -map '[vout]' -frames:v 60 -c:v libx264 -crf 23 -pix_fmt yuv420p -an $overlayOutput
  if ($LASTEXITCODE -ne 0) { throw 'FFmpeg researched-image overlay render failed' }

  $ErrorActionPreference = 'Continue'
  $overlayProbe = (& $ffmpeg -hide_banner -i $overlayOutput 2>&1 | Out-String)
  $ErrorActionPreference = 'Stop'
  if ($overlayProbe -notmatch 'Duration:\s+00:00:02\.00') {
    throw "Unexpected overlay output duration.`n$overlayProbe"
  }

  Write-Output 'Render test passed: transitions plus cropped researched-image overlay, fade in/out, yuv420p.'
}
finally {
  if (Test-Path -LiteralPath $testRoot) {
    Remove-Item -LiteralPath $testRoot -Recurse -Force
  }
}
