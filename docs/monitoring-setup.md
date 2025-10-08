# BerthCare Monitoring & Observability Setup

**Philosophy:** "Obsess over every detail" - Monitor everything that matters

## Overview

Comprehensive monitoring and observability setup for BerthCare, including:
- CloudWatch dashboards for API and database metrics
- Sentry for error tracking and performance monitoring
- Structured logging with CloudWatch Logs
- Automated alerts for critical issues

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BerthCare Backend API                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Monitoring Middleware                               │   │
│  │  - Request ID tracking                               │   │
│  │  - Request/response logging                          │   │
│  │  - Performance timing                                │   │
│  │  - Error capturing                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓           ↓           ↓
              ┌───────────┴───────────┴───────────┴──────────┐
              ↓                       ↓                       ↓
    ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐
    │  CloudWatch     │   │  Sentry         │   │  CloudWatch      │
    │  Metrics        │   │  Error Tracking │   │  Logs            │
    │  - API latency  │   │  - Exceptions   │   │  - Structured    │
    │  - Error rate   │   │  - Performance  │   │  - Searchable    │
    │  - Throughput   │   │  - Breadcrumbs  │   │  - Retention     │
    └─────────────────┘   └─────────────────┘   └──────────────────┘
              ↓                                           ↓
    ┌─────────────────┐                       ┌──────────────────┐
    │  CloudWatch     │                       │  CloudWatch      │
    │  Dashboards     │                       │  Alarms          │
    │  - API perf     │                       │  - Error rate    │
    │  - Database     │                       │  - DB CPU        │
    │  - Errors       │                       │  - Latency       │
    └─────────────────┘                       └──────────────────┘
                                                      ↓
                                              ┌──────────────────┐
                                              │  SNS Topic       │
                                              │  - Email alerts  │
                                              │  - Escalation    │
                                              └──────────────────┘
```

## CloudWatch Dashboards

### 1. API Performance Dashboard
**Name:** `berthcare-staging-api-performance`

**Metrics:**
- API Latency (Average and P99)
- Request Count by Status Code (2xx, 4xx, 5xx)
- Connection Errors
- Unhealthy Hosts
- Sync Performance (batch size, duration)

**Access:** AWS Console → CloudWatch → Dashboards

### 2. Database Performance Dashboard
**Name:** `berthcare-staging-database`

**Metrics:**
- CPU Utilization
- Active Connections
- Read/Write Latency
- Free Memory and Storage

**Access:** AWS Console → CloudWatch → Dashboards

### 3. Error Tracking Dashboard
**Name:** `berthcare-staging-errors`

**Widgets:**
- Recent Errors (Last 100 from logs)
- Error Rate Trend

**Access:** AWS Console → CloudWatch → Dashboards

## CloudWatch Alarms

### Critical Alarms

#### 1. Unhealthy Hosts
- **Threshold:** > 0 unhealthy hosts
- **Evaluation:** 1 period of 1 minute
- **Action:** Immediate SNS notification
- **Severity:** Critical

#### 2. API Error Rate High
- **Threshold:** > 5% error rate
- **Evaluation:** 2 consecutive periods of 5 minutes
- **Action:** SNS notification
- **Severity:** High

#### 3. Database CPU High
- **Threshold:** > 80% CPU utilization
- **Evaluation:** 2 consecutive periods of 5 minutes
- **Action:** SNS notification
- **Severity:** High

### Medium Priority Alarms

#### 4. Database Connections High
- **Threshold:** > 80% of max connections
- **Evaluation:** 2 consecutive periods of 5 minutes
- **Action:** SNS notification
- **Severity:** Medium

#### 5. API Latency High
- **Threshold:** > 1 second average latency
- **Evaluation:** 3 consecutive periods of 5 minutes
- **Action:** SNS notification
- **Severity:** Medium

## Sentry Error Tracking

### Setup

1. **Create Sentry Project:**
   ```bash
   # Go to https://sentry.io
   # Create new project: "berthcare-backend"
   # Copy DSN
   ```

2. **Configure Backend:**
   ```bash
   # Add to .env
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_TRACES_SAMPLE_RATE=0.1
   SENTRY_PROFILES_SAMPLE_RATE=0.1
   ```

3. **Mobile App Setup:**
   ```bash
   # Create separate project: "berthcare-mobile"
   # Install Sentry React Native SDK
   npm install @sentry/react-native
   ```

### Features Enabled

- **Error Tracking:** All exceptions captured with stack traces
- **Performance Monitoring:** 10% of transactions sampled
- **Profiling:** 10% of transactions profiled
- **Breadcrumbs:** Request/response tracking for debugging
- **User Context:** User ID and role attached to errors
- **Sensitive Data Filtering:** Passwords, tokens, and secrets removed

### Testing Sentry

```bash
# Test error appears in Sentry
curl -X POST http://localhost:3000/api/v1/test-error
```

## CloudWatch Logs

### Log Groups

1. **API Logs:** `/berthcare/staging/backend/api`
   - All API requests and responses
   - Retention: 30 days

2. **Error Logs:** `/berthcare/staging/backend/errors`
   - All errors and exceptions
   - Retention: 90 days (compliance)

3. **Database Logs:** `/berthcare/staging/database`
   - Database queries and performance
   - Retention: 30 days

### Log Format

Structured JSON logs for easy searching:

```json
{
  "timestamp": "2025-10-07T12:34:56.789Z",
  "level": "INFO",
  "service": "berthcare-api",
  "environment": "staging",
  "message": "API Request: GET /api/v1/clients",
  "requestId": "uuid-here",
  "userId": "user-123",
  "method": "GET",
  "path": "/api/v1/clients",
  "duration": 45
}
```

### Searching Logs

```bash
# CloudWatch Insights queries

# Find all errors in last hour
fields @timestamp, level, message, error, stack
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

# Find slow API requests (>1s)
fields @timestamp, method, path, duration
| filter duration > 1000
| sort duration desc
| limit 50

# Find requests by user
fields @timestamp, method, path, statusCode
| filter userId = "user-123"
| sort @timestamp desc
```

## Deployment

### 1. Deploy Monitoring Infrastructure

```bash
cd terraform/environments/staging

# Update terraform.tfvars with alarm email
echo 'alarm_email = "devops@berthcare.ca"' >> terraform.tfvars

# Deploy
terraform init
terraform apply

# Confirm SNS subscription email
# Check your inbox and click confirmation link
```

### 2. Configure Backend

```bash
# Update .env with monitoring configuration
cat >> .env << EOF

# Monitoring Configuration
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
CLOUDWATCH_ENABLED=true
AWS_REGION=ca-central-1

# Log Configuration
LOG_LEVEL=info
NODE_ENV=staging
EOF
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Backend

```bash
npm run serve backend
```

### 5. Verify Monitoring

```bash
# Check health endpoint
curl http://localhost:3000/health

# Check metrics endpoint
curl http://localhost:3000/metrics

# Generate test traffic
for i in {1..100}; do
  curl http://localhost:3000/api/v1/status
done

# Check CloudWatch dashboards
# AWS Console → CloudWatch → Dashboards
# Should see metrics appearing

# Check Sentry
# https://sentry.io → Your Project
# Should see requests appearing
```

## Monitoring Best Practices

### 1. Alert Fatigue Prevention
- Set appropriate thresholds (not too sensitive)
- Use evaluation periods to avoid false positives
- Prioritize alerts (critical vs medium)
- Review and adjust thresholds regularly

### 2. Log Management
- Use structured logging (JSON format)
- Include request IDs for tracing
- Filter sensitive data (passwords, tokens)
- Set appropriate retention periods

### 3. Error Tracking
- Capture all exceptions in Sentry
- Add context (user, request, environment)
- Use breadcrumbs for debugging
- Set up error grouping and notifications

### 4. Performance Monitoring
- Track API latency (average and P99)
- Monitor database query performance
- Track sync operation duration
- Set SLOs (Service Level Objectives)

### 5. Cost Optimization
- Use log retention policies
- Sample performance traces (10%)
- Archive old logs to S3
- Review CloudWatch costs monthly

## Troubleshooting

### Metrics Not Appearing

```bash
# Check CloudWatch permissions
aws cloudwatch list-metrics --namespace BerthCare/API

# Check backend logs
docker-compose logs backend | grep -i metric

# Verify environment variables
echo $CLOUDWATCH_ENABLED
```

### Sentry Not Receiving Errors

```bash
# Check Sentry DSN
echo $SENTRY_DSN

# Test Sentry connection
curl -X POST https://sentry.io/api/0/projects/your-org/your-project/store/ \
  -H "X-Sentry-Auth: Sentry sentry_key=YOUR_KEY" \
  -d '{"message": "test"}'

# Check backend logs
docker-compose logs backend | grep -i sentry
```

### Alarms Not Triggering

```bash
# Check SNS subscription
aws sns list-subscriptions

# Confirm subscription
# Check email for confirmation link

# Test alarm manually
aws cloudwatch set-alarm-state \
  --alarm-name berthcare-staging-api-error-rate-high \
  --state-value ALARM \
  --state-reason "Testing alarm"
```

## Maintenance

### Weekly Tasks
- Review error trends in Sentry
- Check alarm history
- Review slow API endpoints
- Verify log retention

### Monthly Tasks
- Review and adjust alarm thresholds
- Analyze cost trends
- Archive old logs
- Update documentation

### Quarterly Tasks
- Review SLOs and SLIs
- Capacity planning
- Security audit
- Disaster recovery testing

## Support

For monitoring issues:
1. Check CloudWatch dashboards first
2. Review Sentry for errors
3. Search CloudWatch Logs
4. Contact DevOps team

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

---

**Remember:** "Obsess over every detail" - Good monitoring is invisible until you need it.
