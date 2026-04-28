#!/usr/bin/env bash
# =============================================================
# Digital HRM — VPS Deploy Script
# Usage:
#   ./deploy.sh              # Full deploy (build + up)
#   ./deploy.sh --rebuild    # Force image rebuild
#   ./deploy.sh --push-db    # Run prisma db push after deploy
#   ./deploy.sh --seed       # Run db seed after deploy
#   ./deploy.sh --logs       # Tail logs
#   ./deploy.sh --down       # Stop all services
#   ./deploy.sh --status     # Show service status
# =============================================================

set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="digital_hrm"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓ $*${NC}"; }
warn()   { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠ $*${NC}"; }
error()  { echo -e "${RED}[$(date '+%H:%M:%S')] ✗ $*${NC}"; exit 1; }
info()   { echo -e "${BLUE}[$(date '+%H:%M:%S')] → $*${NC}"; }

# ── Validate environment ─────────────────────────────────────
check_env() {
    if [ ! -f "${SCRIPT_DIR}/.env" ]; then
        error ".env file not found! Copy .env.example → .env and fill in your values."
    fi

    source "${SCRIPT_DIR}/.env"

    local required_vars=(
        "POSTGRES_PASSWORD"
        "BETTER_AUTH_SECRET"
        "AI_INTERNAL_API_KEY"
        "SESSION_SECRET"
    )

    local missing=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ] || [[ "${!var}" == *"CHANGE_THIS"* ]]; then
            missing+=("$var")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        error "Required env vars not set or still have placeholder values:\n  ${missing[*]}\n  Please update your .env file."
    fi

    log "Environment variables validated"
}

# ── Generate self-signed SSL if not present ──────────────────
generate_ssl() {
    local ssl_dir="${SCRIPT_DIR}/docker/nginx/ssl"
    mkdir -p "$ssl_dir"

    if [ ! -f "${ssl_dir}/cert.pem" ] || [ ! -f "${ssl_dir}/key.pem" ]; then
        warn "SSL certificates not found. Generating self-signed certificate..."
        warn "For production, replace with real certificates (Let's Encrypt recommended)."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${ssl_dir}/key.pem" \
            -out "${ssl_dir}/cert.pem" \
            -subj "/C=VN/ST=HoChiMinh/L=HoChiMinh/O=DigitalHRM/CN=digitalhrm.vn" \
            2>/dev/null
        log "Self-signed SSL certificate generated"
    else
        log "SSL certificates found"
    fi
}

# ── Pull latest images ───────────────────────────────────────
pull_base_images() {
    info "Pulling latest base images..."
    docker pull postgres:16-alpine &
    docker pull redis:7-alpine &
    docker pull nginx:1.27-alpine &
    wait
    log "Base images updated"
}

# ── Build images ─────────────────────────────────────────────
build_images() {
    local rebuild_flag="${1:-}"
    info "Building application images..."

    if [ "$rebuild_flag" == "--no-cache" ]; then
        docker compose -f "$COMPOSE_FILE" build --no-cache --parallel
    else
        docker compose -f "$COMPOSE_FILE" build --parallel
    fi
    log "Images built successfully"
}

# ── Deploy services ──────────────────────────────────────────
deploy() {
    info "Starting all services..."
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
    log "Services started"
}

# ── Wait for services to be healthy ──────────────────────────
wait_healthy() {
    info "Waiting for services to be healthy..."
    local services=("digital_hrm_db" "digital_hrm_redis" "digital_hrm_ai" "digital_hrm_app")
    local timeout=120
    local elapsed=0

    for svc in "${services[@]}"; do
        while [ $elapsed -lt $timeout ]; do
            local status
            status=$(docker inspect --format='{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "not_found")
            if [ "$status" == "healthy" ]; then
                log "$svc is healthy"
                break
            elif [ "$status" == "unhealthy" ]; then
                error "$svc is unhealthy! Check logs: docker logs $svc"
            fi
            sleep 3
            elapsed=$((elapsed + 3))
            echo -n "."
        done
        echo ""
    done

    if [ $elapsed -ge $timeout ]; then
        warn "Timeout waiting for services. Check: docker compose ps"
    fi
}

# ── Run Prisma migrations ─────────────────────────────────────
run_prisma_push() {
    info "Running prisma db push..."
    docker compose -f "$COMPOSE_FILE" --profile tools run --rm prisma-push
    log "Prisma db push completed"
}

# ── Run seed ─────────────────────────────────────────────────
run_seed() {
    info "Running database seed..."
    docker compose -f "$COMPOSE_FILE" --profile tools run --rm prisma-seed
    log "Database seeding completed"
}

# ── Main ─────────────────────────────────────────────────────
main() {
    cd "$SCRIPT_DIR"

    local rebuild=false
    local push_db=false
    local seed=false

    # Parse flags
    for arg in "$@"; do
        case $arg in
            --rebuild)    rebuild=true ;;
            --push-db)    push_db=true ;;
            --seed)       seed=true ;;
            --logs)       docker compose -f "$COMPOSE_FILE" logs -f; exit 0 ;;
            --down)       docker compose -f "$COMPOSE_FILE" down; log "Services stopped"; exit 0 ;;
            --status)     docker compose -f "$COMPOSE_FILE" ps; exit 0 ;;
            --restart)    docker compose -f "$COMPOSE_FILE" restart; log "Services restarted"; exit 0 ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo "  --rebuild   Force rebuild Docker images (--no-cache)"
                echo "  --push-db   Run prisma db push after deploy"
                echo "  --seed      Run database seed after deploy"
                echo "  --logs      Tail service logs"
                echo "  --down      Stop all services"
                echo "  --status    Show service status"
                echo "  --restart   Restart all services"
                exit 0
                ;;
        esac
    done

    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║       Digital HRM — VPS Deployment       ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""

    check_env
    generate_ssl
    pull_base_images

    if [ "$rebuild" == true ]; then
        build_images "--no-cache"
    else
        build_images
    fi

    deploy

    if [ "$push_db" == true ]; then
        sleep 5  # Give DB a moment
        run_prisma_push
    fi

    if [ "$seed" == true ]; then
        sleep 5
        run_seed
    fi

    wait_healthy

    echo ""
    log "🚀 Digital HRM deployed successfully!"
    echo ""
    info "Service URLs:"
    echo "  App:      http://localhost:3000 (or https://YOUR_DOMAIN)"
    echo "  Nginx:    http://localhost:80 / https://localhost:443"
    echo "  DB:       localhost:5432 (local bind)"
    echo "  Redis:    localhost:6379 (local bind)"
    echo ""
    info "Useful commands:"
    echo "  Status:   docker compose ps"
    echo "  Logs:     docker compose logs -f [service]"
    echo "  DB push:  ./deploy.sh --push-db"
    echo "  Stop:     ./deploy.sh --down"
    echo ""
}

main "$@"
