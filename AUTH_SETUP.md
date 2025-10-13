# Authentication Setup Guide

This application now requires password authentication to access the web interface and API endpoints.

## Quick Setup

### 1. Generate a Password Hash

Run the password generator script:

```bash
node generate-password.js
```

Enter your desired password when prompted. The script will generate a bcrypt hash and a session secret.

### 2. Update .env File

Copy the generated values into your `.env` file:

```env
APP_PASSWORD_HASH=<your_generated_hash>
SESSION_SECRET=<your_generated_secret>
```

### 3. Start the Server

```bash
npm start
# or for development
npm run dev
```

### 4. Login

Navigate to `http://localhost:3007` (or your configured port).

You'll be redirected to the login page. Enter the password you created in step 1.

## How It Works

- **Session-based authentication**: Once logged in, your session is valid for 24 hours
- **All routes protected**: Both the web interface and API endpoints require authentication
- **Secure password storage**: Passwords are hashed using bcrypt (never stored in plain text)
- **Public routes**: Only `/login.html` and the IFRC logo are publicly accessible

## Changing the Password

1. Run `node generate-password.js` again with your new password
2. Update the `APP_PASSWORD_HASH` value in `.env`
3. Restart the server

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- Use a strong password (at least 8 characters)
- In production, set `NODE_ENV=production` to enable secure cookies (HTTPS required)
- Consider changing the `SESSION_SECRET` periodically

## Logout

To logout, send a POST request to `/api/logout` or clear your browser cookies.

## Troubleshooting

### "Authentication not configured" error
- Make sure `APP_PASSWORD_HASH` is set in your `.env` file
- Restart the server after updating `.env`

### "Invalid password" error
- Verify you're using the correct password
- Check that the hash in `.env` matches the password you're trying to use

### Session expires too quickly
- Sessions last 24 hours by default
- You can modify the `maxAge` in `server.js` if needed
