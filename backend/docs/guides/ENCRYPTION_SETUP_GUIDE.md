# Encryption Setup Guide

Quick guide to enable encryption for file uploads and database metadata.

## Development Setup (5 minutes)

### 1. Update Environment Variables

Add to your `backend/.env` file:

```bash
# S3 Server-Side Encryption (MinIO compatible)
S3_SSE_ENABLED=true
S3_SSE_ALGORITHM_DEV=AES256

# Database Field-Level Encryption
DB_ENCRYPTION_ENABLED=true
DB_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 2. Apply Database Migration

```bash
cd backend
npm run migrate up
```

### 3. Restart Your Server

```bash
npm run dev
```

### 4. Test Encryption

Upload a photo with a caption:

```bash
curl -X POST http://localhost:3000/api/visits/{visitId}/photos \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg" \
  -F "caption=This caption will be encrypted"
```

Verify in database:

```bash
psql $DATABASE_URL -c "SELECT caption, metadata_encrypted, encryption_algorithm FROM photos ORDER BY created_at DESC LIMIT 1;"
```

You should see:
- `caption`: Encrypted base64 string (not readable)
- `metadata_encrypted`: `true`
- `encryption_algorithm`: `AES256`

## Production Setup (AWS)

### 1. Create KMS Key

```bash
# Create the key
aws kms create-key \
  --description "BerthCare S3 Encryption Key" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS

# Create an alias
aws kms create-alias \
  --alias-name alias/berthcare-s3 \
  --target-key-id <key-id-from-above>
```

### 2. Update KMS Key Policy

Add S3 service principal to key policy:

```json
{
  "Sid": "Allow S3 to use the key",
  "Effect": "Allow",
  "Principal": {
    "Service": "s3.amazonaws.com"
  },
  "Action": [
    "kms:Decrypt",
    "kms:GenerateDataKey"
  ],
  "Resource": "*"
}
```

### 3. Generate Database Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Store Keys in Secrets Manager

```bash
# Store database encryption key
aws secretsmanager create-secret \
  --name berthcare/db-encryption-key \
  --secret-string "<generated-key-from-step-3>"

# Store KMS key ID
aws secretsmanager create-secret \
  --name berthcare/s3-kms-key-id \
  --secret-string "<kms-key-arn>"
```

### 5. Update Production Environment

```bash
# S3 Encryption
S3_SSE_ENABLED=true
S3_SSE_ALGORITHM=aws:kms
S3_KMS_KEY_ID=arn:aws:kms:ca-central-1:123456789012:key/12345678-1234-1234-1234-123456789012

# Database Encryption (load from Secrets Manager)
DB_ENCRYPTION_ENABLED=true
DB_ENCRYPTION_KEY=<from-secrets-manager>
```

### 6. Update IAM Roles

Ensure your application's IAM role has:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:ca-central-1:123456789012:key/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::berthcare-photos/*"
    }
  ]
}
```

## Verification

### Check S3 Encryption

```bash
# Upload a file
aws s3 cp test.jpg s3://berthcare-photos/test.jpg

# Check encryption
aws s3api head-object \
  --bucket berthcare-photos \
  --key test.jpg \
  --query 'ServerSideEncryption'
```

Should return: `"aws:kms"` or `"AES256"`

### Check Database Encryption

```sql
-- Check if encryption is working
SELECT 
  id,
  LENGTH(caption) as encrypted_length,
  metadata_encrypted,
  encryption_algorithm
FROM photos
WHERE caption IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

Encrypted captions will be longer than original text (due to IV and auth tag).

## Troubleshooting

### S3 Upload Fails with KMS Error

**Error**: `AccessDenied: User is not authorized to perform: kms:GenerateDataKey`

**Solution**: Update IAM role to include KMS permissions (see step 6 above)

### Database Encryption Not Working

**Error**: Caption is stored as plaintext

**Solution**: 
1. Check `DB_ENCRYPTION_ENABLED=true`
2. Verify `DB_ENCRYPTION_KEY` is 64 hex characters
3. Restart application server

### Decryption Fails

**Error**: `Failed to decrypt data`

**Solution**:
1. Ensure you're using the same encryption key
2. Check that data was encrypted with current key
3. Verify key hasn't been rotated without data migration

## Key Rotation

### Database Encryption Key Rotation

```bash
# 1. Generate new key
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Create migration script to re-encrypt data
# (See backend/docs/ENCRYPTION.md for details)

# 3. Update environment variable
DB_ENCRYPTION_KEY=$NEW_KEY

# 4. Restart application
```

### KMS Key Rotation

AWS KMS supports automatic key rotation:

```bash
aws kms enable-key-rotation --key-id <key-id>
```

This rotates the key material annually while keeping the same key ID.

## Monitoring

### CloudWatch Metrics (Production)

Monitor KMS usage:
- `kms:GenerateDataKey` calls
- `kms:Decrypt` calls
- Failed authentication attempts

### Application Logs

Check logs for encryption operations:

```bash
# Search for encryption logs
grep "encryption" /var/log/berthcare/app.log

# Check for errors
grep "Failed to encrypt\|Failed to decrypt" /var/log/berthcare/app.log
```

## Compliance Checklist

- [ ] KMS key created with appropriate permissions
- [ ] Database encryption key stored in secrets manager
- [ ] IAM roles configured with least privilege
- [ ] CloudTrail logging enabled for KMS
- [ ] Automatic key rotation enabled
- [ ] Backup encryption verified
- [ ] Access logs reviewed
- [ ] Encryption documented in security policy

## Support

For issues or questions:
1. Check `backend/docs/ENCRYPTION.md` for detailed documentation
2. Review application logs for error messages
3. Verify environment variables are set correctly
4. Test with encryption disabled to isolate issues

## References

- Full Documentation: `backend/docs/ENCRYPTION.md`
- Implementation Summary: `backend/docs/B19_ENCRYPTION_IMPLEMENTATION.md`
- AWS KMS: https://docs.aws.amazon.com/kms/
- S3 SSE: https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html
