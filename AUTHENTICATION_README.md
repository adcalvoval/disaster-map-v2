# 🔐 Authentication System

Your disaster map web application now has password-protected authentication!

## ✅ What Was Added

1. **Login Page** (`login.html`) - Beautiful, professional login interface
2. **Password Authentication** - Secure bcrypt password hashing
3. **Session Management** - 24-hour login sessions
4. **Protected Routes** - All pages and API endpoints require authentication
5. **Password Generator** - Easy-to-use tool to create secure passwords

## 🚀 Quick Start

### Default Credentials (For Testing)
- **Password**: `testpass123`

**⚠️ IMPORTANT: Change this password before deploying to production!**

### To Change the Password

1. Run the password generator:
   ```bash
   node generate-password.js
   ```

2. Enter your new password when prompted

3. Copy the generated hash to `.env`:
   ```env
   APP_PASSWORD_HASH=<your_new_hash>
   ```

4. Restart the server:
   ```bash
   npm start
   ```

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt (industry-standard)
- ✅ Session cookies with httpOnly flag (prevents XSS attacks)
- ✅ All API endpoints protected
- ✅ All static files protected
- ✅ Automatic redirect to login for unauthenticated users
- ✅ Clean logout functionality

## 📝 How to Use

1. **Start the server**: `npm start` or `npm run dev`
2. **Navigate to**: `http://localhost:3007` (or your configured PORT)
3. **Login**: Enter password `testpass123` (or your custom password)
4. **Access the app**: You'll be logged in for 24 hours

## 🛠 Files Modified/Added

- ✅ `login.html` - New login page
- ✅ `server.js` - Added authentication middleware
- ✅ `generate-password.js` - Password hash generator
- ✅ `package.json` - Added bcryptjs & express-session
- ✅ `.env` - Added authentication config
- ✅ `AUTH_SETUP.md` - Detailed setup guide

## 🔧 Configuration

Edit these values in `.env`:

```env
# Change the password by generating a new hash
APP_PASSWORD_HASH=<bcrypt_hash>

# Change the session secret (recommended for production)
SESSION_SECRET=<random_string>

# Session duration is 24 hours (configured in server.js)
```

## 🚨 Important Notes

1. **Never commit `.env` to version control** - It contains sensitive data
2. **Use strong passwords** - At least 8 characters, mix of letters/numbers/symbols
3. **For production** - Set `NODE_ENV=production` to enable secure cookies (requires HTTPS)
4. **Password not working?** - Make sure the hash in `.env` matches your password

## 🔓 Logout

- Logout endpoint: `POST /api/logout`
- Or simply clear browser cookies

## 💡 Tips

- **Forgot password?** Generate a new hash and update `.env`
- **Multiple users?** Currently supports single password; for multi-user, consider adding a user database
- **Session length?** Change `maxAge` in server.js (currently 24 hours)

---

For detailed setup instructions, see `AUTH_SETUP.md`
