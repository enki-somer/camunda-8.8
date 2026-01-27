# Clear all tags locally and on remote (origin)
# Run from repo root: .\scripts\clear-tags.ps1

$Remote = if ($args[0]) { $args[0] } else { "origin" }

Write-Host "Fetching all tags from $Remote..."
git fetch --tags

$Tags = git tag -l
if (-not $Tags) {
    Write-Host "No tags found."
    exit 0
}

Write-Host "Deleting tags locally..."
foreach ($tag in $Tags) {
    git tag -d $tag 2>$null
}

Write-Host "Deleting tags on $Remote..."
foreach ($tag in $Tags) {
    git push $Remote ":refs/tags/$tag" 2>$null
}

Write-Host "Done. All tags cleared."
