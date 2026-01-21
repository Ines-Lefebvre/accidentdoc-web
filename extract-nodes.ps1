$content = Get-Content 'C:\Users\franck.ATEXYA.000\.claude\projects\C--Users-franck-ATEXYA-000-Documents-accidentdoc-v2\3ffbff67-bc5d-4a41-98dd-d70ee06264ff\tool-results\mcp-n8n-controller-get_workflow-1768987272353.txt' -Raw
$matches = [regex]::Matches($content, '"name":\s*"([^"]+)"')
foreach($m in $matches) {
    Write-Output $m.Groups[1].Value
}
