# IAM Module - Roles and Policies
# Philosophy: "Uncompromising security" - Least privilege access

# Backend Service Role (for EC2/ECS)
resource "aws_iam_role" "backend_service" {
  name = "${var.environment}-backend-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "ecs-tasks.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = var.tags
}

# Backend Service Policy - S3 Access
resource "aws_iam_role_policy" "backend_s3" {
  name = "${var.environment}-backend-s3-policy"
  role = aws_iam_role.backend_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.photos_bucket_arn,
          "${var.photos_bucket_arn}/*",
          var.documents_bucket_arn,
          "${var.documents_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      }
    ]
  })
}

# Backend Service Policy - RDS Access
resource "aws_iam_role_policy" "backend_rds" {
  name = "${var.environment}-backend-rds-policy"
  role = aws_iam_role.backend_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters"
        ]
        Resource = "*"
      }
    ]
  })
}

# Backend Service Policy - Secrets Manager Access
resource "aws_iam_role_policy" "backend_secrets" {
  name = "${var.environment}-backend-secrets-policy"
  role = aws_iam_role.backend_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:${var.environment}-*"
        ]
      }
    ]
  })
}

# Backend Service Policy - CloudWatch Logs
resource "aws_iam_role_policy" "backend_logs" {
  name = "${var.environment}-backend-logs-policy"
  role = aws_iam_role.backend_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/${var.environment}/*"
      }
    ]
  })
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "backend_service" {
  name = "${var.environment}-backend-instance-profile"
  role = aws_iam_role.backend_service.name

  tags = var.tags
}

# Lambda Execution Role (for future serverless functions)
resource "aws_iam_role" "lambda_execution" {
  name = "${var.environment}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Lambda Basic Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda VPC Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda Policy - S3 Access
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.environment}-lambda-s3-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${var.photos_bucket_arn}/*",
          "${var.documents_bucket_arn}/*"
        ]
      }
    ]
  })
}

# Lambda Policy - Secrets Manager Access
resource "aws_iam_role_policy" "lambda_secrets" {
  name = "${var.environment}-lambda-secrets-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:${var.environment}-*"
        ]
      }
    ]
  })
}
