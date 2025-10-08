# BerthCare Monitoring Quick Reference

Quick commands and links for monitoring BerthCare in production.

## Dashboard Links

### AWS Console
```
CloudWatch Dashboards:
https://console.aws.amazon.com/cloudwatch/home?region=ca-central-1#dashboards:

- berthcare-staging-api-performance
- berthcare-staging-database
- berthcare-staging-errors
```

### Sentry
```
https://sentry.io/organizations/berthcare/projects/

- berthcare-backend
- berthcare-mobile
```

## Quick Commands

### Check API Health
```bash
curl https://api-staging.berthcare.ca/health
```

### View Recent Logs
```bash
# API logs
aws logs tail /berthcare/staging/backend/api --follow

# Error logs only
aws logs tail /berthcare/staging/backend/errors --follow
```

### Search Logs
```bash
# Find errors in last hour
aws logs filter-log-events \
  --log-group-name /berthcare/staging/backend/errors \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR"

# Find slow requests (>1s)
aws logs filter-log-events \
  --log-group-name /berthcare/staging/backend/api \
  --filter-pattern '[time, request_id, level, msg, duration > 1000]'
```

### Check Alarm Status
```bash
# List all alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix berthcare-staging

# Check specific alarm
aws cloudwatch describe-alarms \
  --alarm-names berthcare-staging-api-error-rate-high
```

### Publish Test Metric
```bash
aws cloudwatch put-metric-data \
  --namespace BerthCare/API \
  --metric-name TestMetric \
  --value 1 \
  --dimensions Environment=staging
```

## CloudWatch Insights Queries

### Find All Errors
```
fields @timestamp, level, message, error, stack
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
```

### Find Slow API Requests
```
fields @timestamp, method, path, duration, statusCode
| filter duration > 1000
| sort duration desc
| limit 50
```

### API Requests by User
```
fields @timestamp, method, path, statusCode, userId
| filter userId = "user-123"
| sort @timestamp desc
```

### Error Rate by Endpoint
```
fields @timestamp, path, statusCode
| filter statusCode >= 500
| stats count() by path
| sort count desc
```

### Sync Performance
```
fields @timestamp, batchSize, duration
| filter message like /sync/
| stats avg(duration), max(duration), count() by bin(5m)
```

## Common Issues

### High Error Rate
1. Check Sentry for error details
2. Review error logs in CloudWatch
3. Check database CPU and connections
4. Verify external service status (Twilio, S3)

### High Latency
1. Check database query performance
2. Review slow API endpoints
3. Check Redis cache hit rate
4. Verify network connectivity

### Database CPU High
1. Check slow queries in RDS Performance Insights
2. Review connection pool size
3. Check for missing indexes
4. Consider read replica for read-heavy workloads

### Unhealthy Hosts
1. Check ECS task logs
2. Verify health check endpoint
3. Check security group rules
4. Review recent deployments

## Metrics to Watch

### API Health
- Error rate < 1%
- P99 latency < 500ms
- Availability > 99.9%

### Database Health
- CPU < 70%
- Connections < 80% of max
- Query latency < 100ms

### Sync Performance
- Batch size: 10-50 operations
- Sync duration < 5 seconds
- Conflict rate < 1%

## Alert Response

### Critical (Immediate Response)
- Unhealthy hosts
- Database down
- API error rate > 10%

### High (15 min response)
- API error rate > 5%
- Database CPU > 80%
- High latency

### Medium (1 hour response)
- Database connections high
- Cache miss rate high
- Slow queries

## Support Contacts

- **DevOps Team:** devops@berthcare.ca
- **On-Call:** +1-XXX-XXX-XXXX
- **Sentry:** https://sentry.io/organizations/berthcare/
- **AWS Console:** https://console.aws.amazon.com/

## Useful Links

- [Full Monitoring Setup Guide](./monitoring-setup.md)
- [Architecture Blueprint](../project-documentation/architecture-output.md)
- [Deployment Guide](../terraform/DEPLOYMENT_GUIDE.md)
- [E6 Completion Summary](./E6-completion-summary.md)
