# S3 Storage Module
# Creates S3 buckets for photos, documents, and signatures with encryption and lifecycle policies

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# S3 Bucket for Photos
resource "aws_s3_bucket" "photos" {
  bucket = "${var.project_name}-photos-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-photos-${var.environment}"
      ContentType = "photos"
    }
  ) 
}

# S3 Bucket for Documents
resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-documents-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-documents-${var.environment}"
      ContentType = "documents"
    }
  )
}

# S3 Bucket for Signatures
resource "aws_s3_bucket" "signatures" {
  bucket = "${var.project_name}-signatures-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-signatures-${var.environment}"
      ContentType = "signatures"
    }
  )
}

# Enable versioning for all buckets
resource "aws_s3_bucket_versioning" "photos" {
  bucket = aws_s3_bucket.photos.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "signatures" {
  bucket = aws_s3_bucket.signatures.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption for all buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_id != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_id
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_id != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_id
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "signatures" {
  bucket = aws_s3_bucket.signatures.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_id != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_id
    }
    bucket_key_enabled = true
  }
}

# Block public access for all buckets
resource "aws_s3_bucket_public_access_block" "photos" {
  bucket = aws_s3_bucket.photos.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "signatures" {
  bucket = aws_s3_bucket.signatures.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policies for photos (archive old photos to Glacier)
resource "aws_s3_bucket_lifecycle_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  rule {
    id     = "archive-old-photos"
    status = "Enabled"

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    transition {
      days          = 2555 # 7 years
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# Lifecycle policies for documents (retain for 7 years for compliance)
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "archive-old-documents"
    status = "Enabled"

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    transition {
      days          = 2555 # 7 years
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# Lifecycle policies for signatures (retain for 7 years for compliance)
resource "aws_s3_bucket_lifecycle_configuration" "signatures" {
  bucket = aws_s3_bucket.signatures.id

  rule {
    id     = "archive-old-signatures"
    status = "Enabled"

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    transition {
      days          = 2555 # 7 years
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# Enable access logging for all buckets
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-logs-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-logs-${var.environment}"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "photos" {
  bucket = aws_s3_bucket.photos.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "photos/"
}

resource "aws_s3_bucket_logging" "documents" {
  bucket = aws_s3_bucket.documents.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "documents/"
}

resource "aws_s3_bucket_logging" "signatures" {
  bucket = aws_s3_bucket.signatures.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "signatures/"
}

# CORS configuration for photos bucket (for direct uploads from mobile app)
resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_cors_configuration" "signatures" {
  bucket = aws_s3_bucket.signatures.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Bucket policies for CloudFront access
resource "aws_s3_bucket_policy" "photos" {
  bucket = aws_s3_bucket.photos.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.photos.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.cloudfront_distribution_arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.photos]
}
