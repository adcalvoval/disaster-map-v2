# ACLED Token Management

This system automatically manages ACLED API tokens with automatic refresh functionality.

## Setup Instructions

### 1. Initial Token Configuration

Update the `ACLED_tokens.json` file with your valid tokens:

```json
{
  "access_token": "YOUR_CURRENT_ACCESS_TOKEN_HERE",
  "refresh_token": "YOUR_REFRESH_TOKEN_HERE",
  "expires_at": "2025-09-16T12:00:00Z",
  "last_updated": "2025-09-16T09:00:00Z"
}
```

### 2. Token Lifecycle

- **Access Token**: Valid for 24 hours
- **Refresh Token**: Valid for 14 days
- **Auto Refresh**: Tokens are automatically refreshed 1 hour before expiration
- **Manual Refresh**: Available via API endpoints

## API Endpoints

### Check Token Status
```bash
curl -X GET "http://localhost:3007/api/acled-tokens/status"
```

Response:
```json
{
  "success": true,
  "hasToken": true,
  "hasRefreshToken": true,
  "isExpired": false,
  "expiresAt": "2025-09-16T12:00:00Z",
  "lastUpdated": "2025-09-16T09:00:00Z",
  "message": "Token is valid"
}
```

### Manual Token Refresh
```bash
curl -X POST "http://localhost:3007/api/acled-tokens/refresh"
```

### Update Tokens Manually
```bash
curl -X POST "http://localhost:3007/api/acled-tokens/update" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "NEW_ACCESS_TOKEN",
    "refresh_token": "NEW_REFRESH_TOKEN"
  }'
```

## Manual Token Refresh Command

To refresh your token manually using cURL (when refresh token is valid):

```bash
curl -H 'Content-Type: multipart/form-data' \
  -F refresh_token='YOUR_REFRESH_TOKEN_HERE' \
  -F grant_type='refresh_token' \
  -F client_id='acled' \
  -X POST \
  'https://acleddata.com/oauth/token'
```

## How It Works

1. **Automatic Refresh**: Server checks token expiration every hour
2. **On-Demand Refresh**: Token is refreshed automatically when ACLED API is called and token is expired
3. **Token Persistence**: All tokens are saved to `ACLED_tokens.json` file
4. **Error Handling**: Comprehensive logging and fallback mechanisms

## Monitoring

The server logs will show:
- ✅ Token loading and saving operations
- ⏰ Scheduled refresh attempts
- 🔄 Token refresh operations
- ❌ Error conditions
- 📊 Token status on startup

## Troubleshooting

### Token Expired Error
If you see "ACLED token refresh failed", update the `refresh_token` in `ACLED_tokens.json` with a new valid refresh token.

### No Token Configured
Update the `ACLED_tokens.json` file with valid `access_token` and `refresh_token`.

### API Access Denied
Check that your ACLED account has proper API access permissions.

## Security Notes

- Keep `ACLED_tokens.json` secure and do not commit to version control
- The refresh token is valid for 14 days - update before expiration
- Access tokens are automatically managed and refreshed every 24 hours