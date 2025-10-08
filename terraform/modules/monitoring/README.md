# BerthCare Monitoring Module

Terraform module for CloudWatch dashboards, alarms, and log aggregation.

## Features

- **CloudWatch Dashboards:** API performance, database metrics, error tracking
- **CloudWatch Alarms:** Error rate, CPU, connections, latency, health checks
- **Log Groups:** Structured logging with retention policies
- **SNS Notifications:** Email alerts for critical issues
- **Custom Metrics:** API latency, sync performance, error rates

## Usage

```hcl
module "monitoring" {
  source = "../../modules/monitoring"

  environment             = "staging"
  aws_region              = "ca-central-1"
  log_retention_days      = 30
  error_log_retention_days = 90
  db_instance_id          = module.database.db_instance_id
  db_max_connections      = 100
  create_sns_topic        = true
  alarm_email             = "devops@berthcare.ca"

  tags = {
    Project     = "BerthCare"
    Environment = "staging"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name | string | - | yes |
| aws_region | AWS region | string | ca-central-1 | no |
| log_retention_days | Log retention in days | number | 30 | no |
| error_log_retention_days | Error log retention | number | 90 | no |
| db_instance_id | RDS instance ID | string | - | yes |
| db_max_connections | Max DB connections | number | 100 | no |
| alarm_sns_topic_arn | Existing SNS topic ARN | string | "" | no |
| create_sns_topic | Create SNS topic | bool | true | no |
| alarm_email | Email for alerts | string | "" | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| api_log_group_name | API log group name |
| error_log_group_name | Error log group name |
| api_performance_dashboard_arn | API dashboard ARN |
| database_performance_dashboard_arn | Database dashboard ARN |
| error_tracking_dashboard_arn | Error dashboard ARN |
| sns_topic_arn | SNS topic ARN |
| alarm_arns | Map of alarm ARNs |

## Dashboards

### API Performance
- API latency (average and P99)
- Request count by status code
- Connection errors
- Sync performance

### Database Performance
- CPU utilization
- Active connections
- Read/write latency
- Memory and storage

### Error Tracking
- Recent errors from logs
- Error rate trends

## Alarms

| Alarm | Threshold | Severity |
|-------|-----------|----------|
| API Error Rate | > 5% | High |
| Database CPU | > 80% | High |
| Database Connections | > 80% of max | Medium |
| API Latency | > 1 second | Medium |
| Unhealthy Hosts | > 0 | Critical |

## Cost Estimate

- Log ingestion: ~$5/month (1 GB)
- Log storage: ~$1/month
- Custom metrics: ~$3/month
- Alarms: ~$1/month
- **Total: ~$10/month**

## Philosophy

"Obsess over every detail" - Monitor everything that matters for operational excellence.
