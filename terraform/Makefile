# BerthCare Terraform Makefile
# Simplifies common Terraform operations

.PHONY: help init-backend plan apply destroy validate fmt clean staging-init staging-plan staging-apply staging-destroy

# Default target
help:
	@echo "BerthCare Terraform Commands"
	@echo "============================"
	@echo ""
	@echo "Backend Setup:"
	@echo "  make init-backend    - Initialize S3 backend and DynamoDB table"
	@echo ""
	@echo "Staging Environment:"
	@echo "  make staging-init    - Initialize Terraform for staging"
	@echo "  make staging-plan    - Plan staging infrastructure changes"
	@echo "  make staging-apply   - Apply staging infrastructure changes"
	@echo "  make staging-destroy - Destroy staging infrastructure"
	@echo "  make staging-output  - Show staging outputs"
	@echo ""
	@echo "Development:"
	@echo "  make validate        - Validate Terraform configuration"
	@echo "  make fmt            - Format Terraform files"
	@echo "  make clean          - Clean Terraform cache and plans"
	@echo ""

# Initialize backend (S3 + DynamoDB)
init-backend:
	@echo "🚀 Initializing Terraform backend..."
	@cd scripts && ./init-backend.sh

# Staging environment commands
staging-init:
	@echo "📦 Initializing Terraform for staging..."
	@cd environments/staging && terraform init

staging-plan:
	@echo "📋 Planning staging infrastructure..."
	@cd environments/staging && terraform plan -out=tfplan

staging-apply:
	@echo "🚀 Applying staging infrastructure..."
	@cd environments/staging && terraform apply tfplan
	@rm -f environments/staging/tfplan

staging-destroy:
	@echo "⚠️  WARNING: This will destroy all staging resources!"
	@read -p "Type 'destroy-staging' to confirm: " confirm && [ "$$confirm" = "destroy-staging" ]
	@cd environments/staging && terraform destroy

staging-output:
	@echo "📊 Staging infrastructure outputs:"
	@cd environments/staging && terraform output

# Development commands
validate:
	@echo "🔍 Validating Terraform configuration..."
	@cd environments/staging && terraform validate

fmt:
	@echo "📝 Formatting Terraform files..."
	@terraform fmt -recursive .

clean:
	@echo "🧹 Cleaning Terraform cache and plans..."
	@find . -type d -name ".terraform" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "tfplan*" -delete 2>/dev/null || true
	@find . -type f -name ".terraform.lock.hcl" -delete 2>/dev/null || true
	@echo "✅ Clean complete"

# Quick deploy (init + plan + apply)
staging-deploy: staging-init staging-plan staging-apply
	@echo "✅ Staging deployment complete!"

# Show connection info
staging-connect:
	@echo "📡 Staging connection information:"
	@cd environments/staging && terraform output connection_info
