#!/bin/bash

# ============================================
# Digital HRM - Docker Helper Script
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    log_info "Docker and Docker Compose are installed."
}

# Development commands
dev_up() {
    log_info "Starting Digital HRM in development mode..."
    docker compose -f docker-compose.dev.yml --env-file .env.docker up -d db
    log_info "Waiting for database to be ready..."
    sleep 5
    docker compose -f docker-compose.dev.yml --env-file .env.docker up -d app
    log_info "Development server is running at http://localhost:3000"
}

dev_down() {
    log_info "Stopping Digital HRM development environment..."
    docker compose -f docker-compose.dev.yml down
}

dev_restart() {
    dev_down
    dev_up
}

dev_logs() {
    docker compose -f docker-compose.dev.yml logs -f
}

dev_rebuild() {
    log_info "Rebuilding Docker images..."
    docker compose -f docker-compose.dev.yml build --no-cache
}

# Production commands
prod_up() {
    log_info "Starting Digital HRM in production mode..."
    docker compose --env-file .env.docker up -d db redis
    log_info "Waiting for database to be ready..."
    sleep 10
    docker compose --env-file .env.docker up -d app
    log_info "Production server is running at http://localhost:3000"
}

prod_down() {
    log_info "Stopping Digital HRM production environment..."
    docker compose --env-file .env.docker down
}

prod_restart() {
    prod_down
    prod_up
}

prod_logs() {
    docker compose --env-file .env.docker logs -f
}

prod_rebuild() {
    log_info "Rebuilding Docker images..."
    docker compose build --no-cache
}

# Database commands
db_shell() {
    docker exec -it digital_hrm_db psql -U postgres -d digital_hrm
}

db_backup() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    log_info "Creating backup..."
    docker exec -it digital_hrm_db pg_dump -U postgres digital_hrm > ./backups/digital_hrm_${TIMESTAMP}.sql
    log_info "Backup created: ./backups/digital_hrm_${TIMESTAMP}.sql"
}

db_restore() {
    if [ -z "$1" ]; then
        log_error "Please provide backup file path"
        echo "Usage: ./docker.sh db:restore ./backups/backup.sql"
        exit 1
    fi
    log_info "Restoring database from $1..."
    cat "$1" | docker exec -i digital_hrm_db psql -U postgres digital_hrm
    log_info "Database restored successfully!"
}

# Prisma commands
prisma_generate() {
    docker compose -f docker-compose.dev.yml exec app pnpm prisma generate
}

prisma_push() {
    docker compose -f docker-compose.dev.yml exec app pnpm prisma db push
}

prisma_studio() {
    docker compose -f docker-compose.dev.yml exec app pnpm prisma studio
}

prisma_seed() {
    docker compose -f docker-compose.dev.yml exec app pnpm prisma db seed
}

# Cleanup
cleanup() {
    log_info "Cleaning up Docker resources..."
    docker compose -f docker-compose.dev.yml down -v --remove-orphans
    docker compose down -v --remove-orphans
    docker system prune -f
    log_info "Cleanup complete!"
}

# Show help
show_help() {
    echo "Digital HRM Docker Helper Script"
    echo ""
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Development Commands:"
    echo "  dev:up       - Start development environment"
    echo "  dev:down     - Stop development environment"
    echo "  dev:restart  - Restart development environment"
    echo "  dev:logs     - View development logs"
    echo "  dev:rebuild  - Rebuild development images"
    echo ""
    echo "Production Commands:"
    echo "  prod:up       - Start production environment"
    echo "  prod:down     - Stop production environment"
    echo "  prod:restart  - Restart production environment"
    echo "  prod:logs     - View production logs"
    echo "  prod:rebuild  - Rebuild production images"
    echo ""
    echo "Database Commands:"
    echo "  db:shell     - Open PostgreSQL shell"
    echo "  db:backup    - Create database backup"
    echo "  db:restore   - Restore database from backup"
    echo ""
    echo "Prisma Commands:"
    echo "  prisma:generate - Generate Prisma client"
    echo "  prisma:push    - Push Prisma schema to database"
    echo "  prisma:studio  - Open Prisma Studio"
    echo "  prisma:seed    - Seed database with demo data"
    echo ""
    echo "Other Commands:"
    echo "  cleanup - Clean up Docker resources"
    echo "  help    - Show this help message"
}

# Main script
check_docker

case "$1" in
    dev:up)
        dev_up
        ;;
    dev:down)
        dev_down
        ;;
    dev:restart)
        dev_restart
        ;;
    dev:logs)
        dev_logs
        ;;
    dev:rebuild)
        dev_rebuild
        ;;
    prod:up)
        prod_up
        ;;
    prod:down)
        prod_down
        ;;
    prod:restart)
        prod_restart
        ;;
    prod:logs)
        prod_logs
        ;;
    prod:rebuild)
        prod_rebuild
        ;;
    db:shell)
        db_shell
        ;;
    db:backup)
        mkdir -p ./backups
        db_backup
        ;;
    db:restore)
        db_restore "$2"
        ;;
    prisma:generate)
        prisma_generate
        ;;
    prisma:push)
        prisma_push
        ;;
    prisma:studio)
        prisma_studio
        ;;
    prisma:seed)
        prisma_seed
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
