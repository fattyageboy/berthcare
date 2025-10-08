# BerthCare Monitoring & Observability

**Status:** ✅ Deployed  
**Philosophy:** "Obsess over every detail" - Monitor everything that matters

## Quick Start

### View Dashboards
```bash
# Open AWS Console
open "https://console.aws.amazon.com/cloudwatch/home?region=ca-central-1#dashboards:"

# View Sentry
open "https://sentry.io/organizations/berthcare/"
```

### Check Health
```bash
curl https://api-staging.berthcare.ca/health
```

### View Logs
```bash
aws logs tail /berthcare/staging/backend/api --follow
```

## Architecture

```
Backend API
    ↓
Monitoring Middleware
    ↓
┌─────────────┬─────────────┬─────────────┐
│  CloudWatch │   Sentry    │  CloudWatch │
│   Metrics   │   Errors    │    Logs     │
└─────────────┴─────────────┴─────────────┘
    ↓               ↓               ↓
Dashboards      Error UI      Log Insights
    ↓
  Alarms
    ↓
SNS → Email
```

## What We Monitor

### API Performance
- ✅ Request latency (avg, P99)
- ✅ Throughput (requests/min)
- ✅ Error rate by endpoint
- ✅ Status code distribution

### Database Health
- ✅ CPU utilization
- ✅ Active connections
- ✅ Query latency
- ✅ Memory and storage

### Sync Operations
- ✅ Batch size
- ✅ Sync duration
- ✅ Conflict rate

### Error Tracking
- ✅ All exceptions with stack traces
- ✅ Performance bottlenecks
- ✅ User context
- ✅ Request breadcrumbs

## Dashboards

### 1. API Performance
**Name:** `berthcare-staging-api-performance`

Shows:
- API latency trends
- Request volume
- Error rates
- Sync performance

### 2. Database Performance
**Name:** `berthcare-staging-database`

Shows:
- CPU and memory usage
- Connection pool status
- Query latency
- Storage capacity

### 3. Error Tracking
**Name:** `berthcare-staging-errors`

Shows:
- Recent errors
- Error rate trends
- Error distribution

## Alerts

| Alert | Threshold | Priority | Response Time |
|-------|-----------|----------|---------------|
| Unhealthy Hosts | > 0 | Critical | Immediate |
| API Error Rate | > 5% | High | 15 minutes |
| Database CPU | > 80% | High | 15 minutes |
| DB Connections | > 80% | Medium | 1 hour |
| API Latency | > 1s | Medium | 1 hour |

## Logs

### Log Groups
- `/berthcare/staging/backend/api` - All API requests (30 days)
- `/berthcare/staging/backend/errors` - Errors only (90 days)
- `/berthcare/staging/database` - Database logs (30 days)

### Log Format
```json
{
  "timestamp": "2025-10-07T12:34:56.789Z",
  "level": "INFO",
  "service": "berthcare-api",
  "environment": "staging",
  "message": "API Request: GET /api/v1/clients",
  "requestId": "uuid",
  "userId": "user-123",
  "duration": 45
}
```

## Sentry Projects

### Backend
- **Project:** berthcare-backend
- **Features:** Error tracking, performance monitoring, profiling
- **Sampling:** 10% of transactions

### Mobile
- **Project:** berthcare-mobile
- **Features:** Error tracking, native crash reporting
- **Sampling:** 10% of transactions

## Cost

**~$10/month for staging:**
- CloudWatch: $6/month
- Custom metrics: $3/month
- Alarms: $1/month
- Sentry: Free tier

## Documentation

- [Complete Setup Guide](docs/monitoring-setup.md)
- [Quick Reference](docs/monitoring-quick-reference.md)
- [E6 Completion Summary](docs/E6-completion-summary.md)
- [Terraform Module](terraform/modules/monitoring/README.md)

## Support

- **DevOps:** devops@berthcare.ca
- **Sentry:** https://sentry.io/organizations/berthcare/
- **AWS Console:** https://console.aws.amazon.com/

---

**Remember:** Good monitoring is invisible until you need it.
