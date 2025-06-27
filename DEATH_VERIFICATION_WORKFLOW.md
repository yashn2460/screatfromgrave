# Death Verification Workflow

This document describes the updated death verification system that includes a "waiting for release" status to provide better control over video message releases.

## Overview

The death verification system now follows a two-step process:
1. **Death Verification**: Trustees verify the death of a user
2. **Video Release**: Video messages are released only after explicit approval

## Workflow States

### 1. Pending
- Initial state when death verification is created
- Waiting for trustee verification(s)

### 2. Waiting for Release
- Death has been verified by required number of trustees
- Video messages are ready but not yet released
- Requires manual action to release videos

### 3. Verified
- Death verification is complete
- Video messages have been released to recipients
- Final state

### 4. Rejected
- Death verification was rejected
- No video messages will be released

### 5. Expired
- Death verification has expired
- No video messages will be released

## API Endpoints

### Trustee Endpoints

#### 1. Verify Death
```http
POST /api/death-verification/verify
```

**Request Body:**
```json
{
  "userId": "user_id",
  "verificationMethod": "death_certificate",
  "dateOfDeath": "2024-01-15",
  "placeOfDeath": "Hospital",
  "additionalNotes": "Death verified by medical certificate",
  "confirmVerification": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Death verification completed. Video messages are waiting for release.",
  "deathVerification": {
    "id": "verification_id",
    "status": "waiting_for_release",
    "verifiedTrustees": 1,
    "requiredTrustees": 1,
    "verificationMethod": "death_certificate",
    "dateOfDeath": "2024-01-15",
    "placeOfDeath": "Hospital"
  }
}
```

#### 2. Check Status
```http
GET /api/death-verification/status/{userId}
```

**Response:**
```json
{
  "success": true,
  "deathVerification": {
    "id": "verification_id",
    "status": "waiting_for_release",
    "deathDate": "2024-01-15T00:00:00.000Z",
    "verifiedTrustees": [...],
    "requiredTrustees": 1,
    "verificationDate": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 3. Get Pending Verifications
```http
GET /api/death-verification/pending
```

**Response:**
```json
{
  "success": true,
  "pendingVerifications": [
    {
      "id": "verification_id",
      "status": "waiting_for_release",
      "user_id": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "verified_trustees": [...]
    }
  ]
}
```

#### 4. Release Video Messages (Trustee)
```http
POST /api/death-verification/release/{userId}
```

**Response:**
```json
{
  "success": true,
  "message": "Video messages released successfully",
  "deathVerification": {
    "id": "verification_id",
    "status": "verified",
    "verificationDate": "2024-01-15T10:30:00.000Z"
  }
}
```

### Admin Endpoints

#### 1. Release Video Messages (Admin)
```http
POST /api/admin/release-videos/{userId}
```

**Response:**
```json
{
  "success": true,
  "message": "Video messages released successfully",
  "deathVerification": {
    "id": "verification_id",
    "status": "verified",
    "verificationDate": "2024-01-15T10:30:00.000Z"
  },
  "releasedVideos": 5
}
```

## Workflow Examples

### Example 1: Trustee Completes Full Workflow

1. **Trustee verifies death**
   ```bash
   POST /api/death-verification/verify
   # Status becomes "waiting_for_release"
   ```

2. **Trustee releases videos**
   ```bash
   POST /api/death-verification/release/{userId}
   # Status becomes "verified", videos released
   ```

### Example 2: Admin Intervenes

1. **Trustee verifies death**
   ```bash
   POST /api/death-verification/verify
   # Status becomes "waiting_for_release"
   ```

2. **Admin releases videos**
   ```bash
   POST /api/admin/release-videos/{userId}
   # Status becomes "verified", videos released
   ```

## Benefits of New Workflow

### 1. Better Control
- Video messages are not automatically released
- Trustees or admins can review before release
- Prevents accidental releases

### 2. Audit Trail
- Clear separation between verification and release
- Better tracking of who released videos and when
- Enhanced security and compliance

### 3. Flexibility
- Multiple release options (trustee or admin)
- Can implement additional approval workflows
- Supports different organizational policies

### 4. Error Prevention
- Reduces risk of premature video releases
- Allows for verification review
- Supports additional validation steps

## Testing

Use the provided test script to verify the workflow:

```bash
node test-death-verification-workflow.js
```

The test script demonstrates:
- Complete trustee workflow
- Admin intervention workflow
- Status checking at each step
- Error handling

## Configuration

### Required Trustees
Set the number of trustees required for verification in the `TrustedContact` model:

```javascript
trusted_contacts_required: {
  type: Number,
  default: 1
}
```

### Auto-verification
Scheduled verifications still work as before, automatically moving from "pending" to "verified" after the configured time period.

## Security Considerations

1. **Permission Checks**: Only trustees with `can_verify_death` permission can verify death
2. **Release Authorization**: Only trustees or admins can release videos
3. **Audit Logging**: All actions are logged for compliance
4. **Status Validation**: System validates status transitions

## Error Handling

Common error scenarios:
- **403 Forbidden**: User doesn't have permission to verify death or release videos
- **400 Bad Request**: No death verification in "waiting_for_release" status
- **404 Not Found**: User not found
- **500 Server Error**: Internal server error

## Migration Notes

Existing death verifications will continue to work as before. The new workflow only applies to new verifications created after this update. 