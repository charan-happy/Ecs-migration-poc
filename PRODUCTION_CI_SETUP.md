# Production CI/CD Pipeline with Migration Safety & Rollback

## Recent Updates

### Using Existing Task Definitions
The pipeline has been updated to work with your existing AWS task definitions instead of registering new ones on each deployment. This provides better control and consistency.

**Key Changes:**
- References existing task definition ARNs via GitHub secrets
- Uses DATABASE_URL from environment variables instead of AWS Secrets Manager
- Simplified rollback procedure using current service task definitions

**Benefits:**
- No risk of overwriting manually configured task definitions
- Easier integration with existing AWS infrastructure
- Reduced API calls and faster deployments
- Environment-based database configuration for flexibility

## Frontend Deployment (Optional)

The pipeline supports optional frontend deployment alongside backend and worker services.

### Enabling Frontend Deployment
1. Go to your GitHub repository settings
2. Navigate to **Settings → Actions → Variables**
3. Add a new repository variable:
   - **Name**: `DEPLOY_FRONTEND`
   - **Value**: `true`

### Required Frontend Resources
When frontend deployment is enabled, you'll need:
- Frontend Docker image (`frontend.Dockerfile`)
- ECR repository for frontend images
- ECS cluster and service for frontend
- Task definition for frontend service

### Frontend GitHub Secrets
```
DEV_ECR_FRONTEND_REPOSITORY=reneu-frontend
DEV_ECS_FRONTEND_CLUSTER=your-frontend-cluster
DEV_ECS_FRONTEND_SERVICE=your-frontend-service
DEV_ECS_FRONTEND_TASK_FAMILY=your-frontend-task-family
DEV_ECS_FRONTEND_TASK_DEFINITION_ARN=arn:aws:ecs:region:account:task-definition/frontend-task:version
```

## Pipeline Flow

```
Build → Migration → Deploy → Health Check
   ↓        ↓          ↓         ↓
  Success  Success    Success   Success → ✅ Services Live
   ↓        ↓          ↓         ↓
  Fail     Fail       Fail      Fail    → 🔄 Auto Rollback All Services
```

**Services Deployed:**
- ✅ **Always**: Backend + Worker
- 🔄 **Optional**: Frontend (when `DEPLOY_FRONTEND=true`)

## Required GitHub Secrets

Add these secrets to your GitHub repository:

### AWS Configuration
```
DEV_AWS_ACCESS_KEY_ID=AKIA...
DEV_AWS_SECRET_ACCESS_KEY=...
DEV_AWS_REGION=us-east-1
```

### ECR Repositories
```
DEV_ECR_BACKEND_REPOSITORY=reneu-backend
DEV_ECR_MIGRATION_REPOSITORY=reneu-migration
DEV_ECR_WORKER_REPOSITORY=reneu-worker
DEV_ECR_FRONTEND_REPOSITORY=reneu-frontend
```

### ECS Configuration
```
DEV_ECS_CLUSTER=your-dev-cluster
DEV_ECS_SERVICE=your-backend-service
DEV_ECS_MIGRATION_CLUSTER=your-migration-cluster
DEV_ECS_TASK_FAMILY=your-backend-task-family
DEV_ECS_WORKER_CLUSTER=your-worker-cluster
DEV_ECS_WORKER_SERVICE=your-worker-service
DEV_ECS_WORKER_TASK_FAMILY=your-worker-task-family
DEV_ECS_FRONTEND_CLUSTER=your-frontend-cluster
DEV_ECS_FRONTEND_SERVICE=your-frontend-service
DEV_ECS_FRONTEND_TASK_FAMILY=your-frontend-task-family
DEV_ECS_TASK_DEFINITION_ARN=arn:aws:ecs:region:account:task-definition/backend-task:version
DEV_ECS_WORKER_TASK_DEFINITION_ARN=arn:aws:ecs:region:account:task-definition/worker-task:version
DEV_ECS_FRONTEND_TASK_DEFINITION_ARN=arn:aws:ecs:region:account:task-definition/frontend-task:version
```

### Database Configuration
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Network Configuration
```
DEV_SUBNETS=subnet-12345678,subnet-87654321
DEV_SECURITY_GROUPS=sg-12345678
```

## Required AWS Resources

### 1. Migration Cluster & Service
```bash
# Create migration cluster
aws ecs create-cluster --cluster-name your-migration-cluster

# Create migration service (optional - can run tasks on-demand)
aws ecs create-service \
  --cluster your-migration-cluster \
  --service-name migration-service \
  --task-definition migration-task \
  --desired-count 0
```

### 2. Backend & Worker Clusters
```bash
# Create backend cluster
aws ecs create-cluster --cluster-name your-dev-cluster

# Create worker cluster
aws ecs create-cluster --cluster-name your-worker-cluster

# Create backend service
aws ecs create-service \
  --cluster your-dev-cluster \
  --service-name your-backend-service \
  --task-definition your-backend-task \
  --desired-count 1

# Create worker service
aws ecs create-service \
  --cluster your-worker-cluster \
  --service-name your-worker-service \
  --task-definition your-worker-task \
  --desired-count 1
```

### 2. Task Definitions
**Updated Approach**: The pipeline now references existing task definition ARNs instead of registering new ones.

Required task definitions (create these manually in AWS Console or via CLI):
- Migration task definition: `arn:aws:ecs:region:account:task-definition/migration-task:version`
- Backend task definition: `arn:aws:ecs:region:account:task-definition/backend-task:version`
- Worker task definition: `arn:aws:ecs:region:account:task-definition/worker-task:version`

**Note**: Set the `DEV_ECS_TASK_DEFINITION_ARN` and `DEV_ECS_WORKER_TASK_DEFINITION_ARN` secrets to your existing task definition ARNs.

### 3. IAM Permissions
Ensure your CI/CD user has permissions for:
- `ecs:RunTask`
- `ecs:DescribeTasks`
- `ecs:UpdateService`
- `ecs:DescribeServices`
- `ecs:ListTaskDefinitions`
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`
- `ecr:PutImage`

## Pipeline Jobs Explained

### 1. Build Job
- ✅ Installs dependencies
- ✅ Builds application
- ✅ Runs tests (if configured)

### 2. Migrate Job
- 🚀 Builds migration Docker image
- 🚀 Pushes to ECR
- 🚀 Runs migration task on ECS
- 🚀 **Waits for completion and validates success**
- ❌ **Fails fast if migration fails**

### 3. Deploy Job
- 🔒 **Only runs if migration succeeded**
- 🚀 Builds backend and worker Docker images
- 🚀 **Optionally builds frontend image** (if `DEPLOY_FRONTEND=true`)
- 🚀 Pushes all images to ECR
- 🚀 Updates ECS services with new images
- 🚀 Waits for deployment stability
- 🚀 Performs health checks on all services

### 4. Rollback Job
- 🔄 **Triggers automatically on any failure**
- 🔄 Finds previous stable task definition
- 🔄 Rolls back to last working version
- 📢 Sends notifications

## Error Scenarios & Recovery

### Scenario 1: Migration Fails
```
Build → ❌ Migration Fails → Rollback → Notify Team
```

### Scenario 2: Deployment Fails
```
Build → ✅ Migration OK → ❌ Deploy Fails → Rollback → Notify Team
```

### Scenario 3: Health Check Fails
```
Build → ✅ Migration OK → ✅ Deploy OK → ❌ Health Fails → Rollback → Notify Team
```

## Monitoring & Alerts

### CloudWatch Integration
- Migration task logs: `/ecs/migration-task`
- Backend service logs: `/ecs/backend-service`
- Deployment events: ECS service events

### Health Check Endpoints
Add health check endpoints to your application:
```typescript
// Health check endpoint
@Get('health')
async healthCheck() {
  // Check database connectivity
  // Check external services
  return { status: 'ok', timestamp: new Date() };
}
```

### Notification Setup
Add Slack/Teams notifications:
```yaml
- name: Notify Slack
  if: always()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"Dev Deployment: ${{ job.status }}\\nMigration: ${{ needs.migrate.result }}\\nDeploy: ${{ needs.deploy.result }}\"}" \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Rollback Strategy

### Automatic Rollback Logic
1. **Identify Failure Point**: Migration, Deployment, or Health Check
2. **Find Stable Version**: Query ECS task definition history
3. **Rollback Deployment**: Update service to previous task definition
4. **Verify Rollback**: Wait for service stability
5. **Notify Stakeholders**: Alert team about rollback

### Manual Rollback (Emergency)
```bash
# Find recent task definitions
aws ecs list-task-definitions --family your-task-family --sort DESC --max-items 5

# Rollback to specific version
aws ecs update-service \
  --cluster your-cluster \
  --service your-service \
  --task-definition arn:aws:ecs:region:account:task-definition/family:revision \
  --force-new-deployment
```

## Deployment Safety Features

### 1. Migration-First Approach
- Database changes applied before code deployment
- Prevents incompatible schema/code combinations
- Zero-downtime migration validation

### 2. Health Checks
- Service status validation
- Running task count verification
- Application health endpoint checks

### 3. Timeout Protection
- Migration tasks timeout after 5 minutes
- Deployment stabilization waits
- Health check delays for service readiness

### 4. Conditional Execution
- Deploy job only runs after migration success
- Rollback only triggers on failures
- Clear job dependencies and conditions

## Environment Variables

### Migration Container
```bash
DATABASE_URL=postgresql://user:pass@host:port/db  # From Secrets Manager
```

### Backend Container
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/db  # From Secrets Manager
```

## Troubleshooting

### Common Issues

1. **Migration Timeout**
   - Increase `--max-wait-time` in `aws ecs wait`
   - Check migration script efficiency
   - Verify database connectivity

2. **Health Check Failures**
   - Ensure health endpoint exists
   - Check load balancer configuration
   - Verify security group rules

3. **Rollback Failures**
   - Ensure previous task definitions exist
   - Check IAM permissions for rollback
   - Verify task definition history

### Debug Commands

```bash
# Check migration task status
aws ecs describe-tasks --cluster migration-cluster --tasks $TASK_ARN

# View migration logs
aws logs tail /ecs/migration-task --follow

# Check service deployment status
aws ecs describe-services --cluster backend-cluster --services backend-service

# List available task definitions for rollback
aws ecs list-task-definitions --family your-task-family --sort DESC
```

## Next Steps

1. **Configure Secrets**: Add all required GitHub secrets
2. **Test Pipeline**: Push to develop branch to test
3. **Add Notifications**: Configure Slack/Teams alerts
4. **Monitor Deployments**: Set up CloudWatch dashboards
5. **Document Procedures**: Create runbooks for manual interventions

This pipeline provides **enterprise-grade deployment safety** with automatic rollback capabilities, ensuring your production environment remains stable even when deployments fail.