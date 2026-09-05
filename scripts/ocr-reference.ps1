param([string]$ImagePath, [string]$IndexPath)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 1 } | Select-Object -First 1
function Await-WinRT($Operation, [Type]$ResultType) {
  $task = $asTask.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  $task.Wait()
  $task.Result
}
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
function Read-ImageText([string]$SourcePath) {
  $file = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($SourcePath)) ([Windows.Storage.StorageFile])
  $stream = Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $result = Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  $output = @{ width=$bitmap.PixelWidth; height=$bitmap.PixelHeight; text=$result.Text; lines=@($result.Lines | ForEach-Object { @{ text=$_.Text; words=@($_.Words | ForEach-Object { @{text=$_.Text;x=$_.BoundingRect.X;y=$_.BoundingRect.Y;width=$_.BoundingRect.Width;height=$_.BoundingRect.Height} })} }) }
  $bitmap.Dispose(); $stream.Dispose()
  return $output
}
if ($ImagePath) { Read-ImageText $ImagePath | ConvertTo-Json -Depth 8 }
if ($IndexPath) {
  $catalog = Get-Content -LiteralPath $IndexPath -Raw | ConvertFrom-Json
  foreach($screen in $catalog) {
    if(Test-Path -LiteralPath $screen.ocr) { continue }
    try { Read-ImageText $screen.file | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $screen.ocr -Encoding UTF8 } catch { Write-Warning "$($screen.id): $($_.Exception.Message)" }
  }
}
