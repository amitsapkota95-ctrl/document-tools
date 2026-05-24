$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts -File
$replacements = @(
  @('text-forest-muted', 'text-forest-600'),
  @('shadow-eco-hover', 'shadow-paper-lg'),
  @('shadow-eco-lg', 'shadow-paper-lg'),
  @('shadow-eco', 'shadow-paper'),
  @('eco-card', 'paper-card'),
  @('border-moss-dark/80', 'border-cream-300'),
  @('border-moss-dark/60', 'border-cream-300'),
  @('border-moss-dark/40', 'border-cream-300'),
  @('border-moss-dark', 'border-cream-300'),
  @('border-moss/70', 'border-cream-300'),
  @('border-moss/50', 'border-cream-300'),
  @('border-moss/40', 'border-cream-300'),
  @('border-sage-dark', 'border-forest-500'),
  @('border-sage', 'border-forest-500'),
  @('bg-moss-light/80', 'bg-cream-200'),
  @('bg-moss-light/60', 'bg-cream-200'),
  @('bg-moss-light/50', 'bg-cream-200/80'),
  @('bg-moss-light/40', 'bg-cream-200/60'),
  @('bg-moss-light/30', 'bg-cream-200/50'),
  @('bg-moss-light', 'bg-cream-200'),
  @('bg-sage/25', 'bg-forest-50'),
  @('bg-sage/20', 'bg-forest-50'),
  @('bg-sage/15', 'bg-forest-50'),
  @('bg-sage/10', 'bg-forest-50/80'),
  @('text-sage-dark', 'text-forest-500'),
  @('text-sand-light', 'text-ink/50'),
  @('text-sand', 'text-ink/60'),
  @('hover:border-sage-dark', 'hover:border-forest-500'),
  @('hover:border-sage', 'hover:border-forest-500'),
  @('hover:bg-sage', 'hover:bg-forest-50'),
  @('accent-sage', 'accent-forest-600'),
  @('ring-sage', 'ring-forest-500'),
  @('ring-moss', 'ring-cream-300'),
  @('from-sage-dark', 'from-forest-600'),
  @('to-accent-light', 'to-forest-500'),
  @('hover:bg-forest hover:text-cream', 'hover:bg-forest-700 hover:text-cream-100'),
  @('bg-forest/50', 'bg-ink/40'),
  @('border-4 border-sage', 'border-4 border-forest-500'),
  @('ring-2 ring-sage/30', 'ring-4 ring-forest-500/10'),
  @('border-2 border-sage', 'border-2 border-forest-500')
)

foreach ($file in $files) {
  $content = Get-Content -Raw $file.FullName
  $original = $content
  foreach ($pair in $replacements) {
    $content = $content.Replace($pair[0], $pair[1])
  }
  $content = [regex]::Replace($content, '(?<![\w-])text-forest(?![\w-])', 'text-forest-700')
  if ($content -ne $original) {
    Set-Content -NoNewline -Path $file.FullName -Value $content
    Write-Output $file.FullName
  }
}
