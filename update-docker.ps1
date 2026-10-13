$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

docker compose -f docker-compose.registry.yml pull
docker compose -f docker-compose.registry.yml up -d
docker compose -f docker-compose.registry.yml ps
