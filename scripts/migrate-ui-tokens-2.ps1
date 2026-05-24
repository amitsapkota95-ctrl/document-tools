$replacements = @(
  @('border-moss/60', 'border-cream-300'),
  @('border-moss', 'border-cream-300'),
  @('bg-moss/60', 'bg-cream-300'),
  @('bg-moss/50', 'bg-cream-300/50'),
  @('bg-moss/70', 'bg-cream-300/70'),
  @('hover:bg-moss/50', 'hover:bg-cream-300/50'),
  @('active:bg-moss/70', 'active:bg-cream-300/70'),
  @('text-sage', 'text-forest-500'),
  @('bg-sage/40', 'bg-forest-500/40'),
  @('bg-sage', 'bg-forest-500'),
  @('bg-moss-dark', 'bg-forest-200'),
  @('text-sand', 'text-ink/60'),
  @('eco-card', 'paper-card'),
  @('shadow-eco', 'shadow-paper')
)
$files = @(
  'src/components/tools/DiffMinimap.tsx',
  'src/components/tools/ImageCompareSlider.tsx',
  'src/components/tools/OcrOverlayViewer.tsx',
  'src/app/teleprompter/components/TypographyControls.tsx',
  'src/app/teleprompter/components/ScriptEditor.tsx',
  'src/app/teleprompter/components/PrompterPreview.tsx',
  'src/app/teleprompter/components/EditorToolbar.tsx',
  'src/app/invoice-builder/components/InvoicePreview.tsx',
  'src/app/invoice-builder/components/InvoiceEditor.tsx',
  'src/app/invoice-builder/components/DocumentHistoryPanel.tsx',
  'src/app/compress-pdf/ToolComponent.tsx',
  'src/app/compare-text/ToolComponent.tsx',
  'src/app/stats/[code]/StatsClient.tsx'
)
foreach ($path in $files) {
  if (-not (Test-Path $path)) { continue }
  $content = Get-Content -Raw $path
  $original = $content
  foreach ($pair in $replacements) { $content = $content.Replace($pair[0], $pair[1]) }
  if ($content -ne $original) {
    Set-Content -NoNewline -Path $path -Value $content
    Write-Output $path
  }
}
