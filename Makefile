# BerthCare Development Makefile
# Simplifies common Docker Compose operations

.PHONY: help up down restart logs status clean reset db-backup db-restore db-shell redis-shell test-db test-redis test-minio

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)BerthCare Development Environment$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker Environment

up: ## Start all services
	@echo "$(BLUE)Starting BerthCare development environment...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Services started successfully!$(NC)"
	@echo ""
	@echo "Access services at:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"
	@echo "  - MinIO API: http://localhost:9000"
	@echo "  - MinIO Console: http://localhost:9001"
	@echo "  - Adminer (DB UI): http://localhost:8080"
	@echo "  - Redis Commander: http://localhost:8081"

down: ## Stop all services
	@echo "$(YELLOW)Stopping BerthCare services...$(NC)"
	@docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)Services stopped successfully!$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting BerthCare services...$(NC)"
	@docker-compose -f docker-compose.dev.yml restart
	@echo "$(GREEN)Services restarted successfully!$(NC)"

logs: ## Show logs for all services
	@docker-compose -f docker-compose.dev.yml logs -f

status: ## Show status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	@docker-compose -f docker-compose.dev.yml ps

clean: ## Stop services and remove containers (keeps volumes)
	@echo "$(YELLOW)Cleaning up containers...$(NC)"
	@docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)Cleanup complete!$(NC)"

reset: ## DANGER: Stop services and remove all data (including volumes)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@docker-compose -f docker-compose.dev.yml down -v
	@echo "$(YELLOW)Starting fresh environment...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Environment reset complete!$(NC)"

##@ Database Operations

db-shell: ## Access PostgreSQL shell
	@docker exec -it berthcare-postgres psql -U postgres -d berthcare_dev

db-backup: ## Backup database to backup.sql
	@echo "$(BLUE)Backing up database...$(NC)"
	@docker exec berthcare-postgres pg_dump -U postgres berthcare_dev > backup.sql
	@echo "$(GREEN)Database backed up to backup.sql$(NC)"

db-restore: ## Restore database from backup.sql
	@echo "$(YELLOW)Restoring database from backup.sql...$(NC)"
	@docker exec -i berthcare-postgres psql -U postgres berthcare_dev < backup.sql
	@echo "$(GREEN)Database restored successfully!$(NC)"

db-logs: ## Show PostgreSQL logs
	@docker-compose -f docker-compose.dev.yml logs -f db

test-db: ## Test database connection
	@echo "$(BLUE)Testing database connection...$(NC)"
	@docker exec berthcare-postgres pg_isready -U postgres -d berthcare_dev && \
		echo "$(GREEN)Database connection successful!$(NC)" || \
		echo "$(RED)Database connection failed!$(NC)"

##@ Redis Operations

redis-shell: ## Access Redis CLI
	@docker exec -it berthcare-redis redis-cli -a dev_redis_password

redis-logs: ## Show Redis logs
	@docker-compose -f docker-compose.dev.yml logs -f redis

test-redis: ## Test Redis connection
	@echo "$(BLUE)Testing Redis connection...$(NC)"
	@docker exec berthcare-redis redis-cli -a dev_redis_password ping && \
		echo "$(GREEN)Redis connection successful!$(NC)" || \
		echo "$(RED)Redis connection failed!$(NC)"

##@ MinIO Operations

minio-logs: ## Show MinIO logs
	@docker-compose -f docker-compose.dev.yml logs -f minio

test-minio: ## Test MinIO health
	@echo "$(BLUE)Testing MinIO connection...$(NC)"
	@curl -s http://localhost:9000/minio/health/live > /dev/null && \
		echo "$(GREEN)MinIO connection successful!$(NC)" || \
		echo "$(RED)MinIO connection failed!$(NC)"

##@ Testing

test-all: test-db test-redis test-minio ## Test all service connections
	@echo ""
	@echo "$(GREEN)All service tests complete!$(NC)"

##@ Quick Commands

dev: up status ## Start environment and show status

rebuild: ## Rebuild and restart all services
	@echo "$(YELLOW)Rebuilding services...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d --build
	@echo "$(GREEN)Services rebuilt successfully!$(NC)"
