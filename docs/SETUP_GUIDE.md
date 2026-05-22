# Setup Guide — Local Development Environment

After completing this guide you will have the full council system running on your machine: backend API on port 3000 and React frontend on port 5173.

**Prerequisites:**
- [ ] Node.js 18 or higher — check with `node --version`
- [ ] MySQL 8.0 installed and running — check with `mysql --version`
- [ ] npm 9 or higher — check with `npm --version`
- [ ] Git installed — check with `git --version`

---

## Step 1: Get the project files

```bash
git clone <your-repo-url> council-system
cd council-system
```

If you are not using Git yet, create the folder structure manually as shown in `README.md`.

---

## Step 2: Set up the database

Open a MySQL shell as `root` and run. Replace `choose_a_password` with the real password you want to use, then enter that same password when `mysql -u council_user -p ...` prompts you later.

```sql
CREATE DATABASE IF NOT EXISTS council_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'council_user'@'localhost' IDENTIFIED BY 'choose_a_password';
ALTER USER 'council_user'@'localhost' IDENTIFIED BY 'choose_a_password';
GRANT ALL PRIVILEGES ON council_db.* TO 'council_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then import the schema:

```bash
mysql -u council_user -p council_db < database/schema.sql
```

Verify the tables were created:

```bash
mysql -u council_user -p council_db -e "SHOW TABLES;"
```

You should see:

```
+----------------------+
| Tables_in_council_db |
+----------------------+
| app_status_logs      |
| applications         |
| feedback             |
| password_reset_tokens|
| services             |
| users                |
+----------------------+
```

Verify the seed services were inserted:

```bash
mysql -u council_user -p council_db -e "SELECT code, name FROM services;"
```

---

## Step 3: Configure backend environment

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your values:

```bash
PORT=3000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=council_user
DB_PASS=choose_a_password
DB_NAME=council_db

# Generate this with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste_your_generated_secret_here

# Use Mailtrap (https://mailtrap.io) for local email testing
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
MAIL_FROM="Local Council <noreply@council.local>"
```

> **Tip for JWT_SECRET:** Run this in your terminal to generate a strong secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Step 4: Install backend dependencies

```bash
cd backend
npm install
```

You should see packages installed for: express, bcryptjs, jsonwebtoken, mysql2, multer, nodemailer, helmet, express-validator, and others.

---

## Step 5: Start the backend

```bash
npm run dev
```

You should see:

```
Council API running on port 3000
```

Test it is working:

```bash
curl http://localhost:3000/health
# {"status":"ok","ts":"2026-03-25T..."}
```

If you see an error about MySQL connection, double-check your `.env` DB credentials.

---

## Step 6: Install frontend dependencies

Open a new terminal window:

```bash
cd frontend
npm install
```

---

## Step 7: Configure frontend environment

```bash
cp .env.example .env
```

The default `.env` already points to localhost:

```bash
VITE_API_URL=http://localhost:3000/api
```

---

## Step 8: Start the frontend

```bash
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser. You should see the login page.

---

## Step 9: Create your first admin user

Because the registration form creates `citizen` accounts only, you need to manually create an admin account in the database:

```sql
INSERT INTO users (id, full_name, email, password_hash, role) VALUES (
  UUID(),
  'Admin User',
  'admin@council.local',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NjU8ezTqm', -- password: adminpass123
  'admin'
);
```

> The hash above is for the password `adminpass123`. Change it immediately after first login by implementing the change-password flow, or generate your own hash:
>
> ```javascript
> node -e "const b=require('bcryptjs'); b.hash('your_password', 12).then(console.log)"
> ```

---

## Step 10: Verify the full flow

1. Open `http://localhost:5173`
2. Register a new citizen account
3. Log in
4. Navigate to Apply for Service — you should see 6 service cards
5. Submit an application — you should receive a reference number
6. Open a new incognito window, log in as `admin@council.local` / `adminpass123`
7. In the admin panel, find the application and approve it
8. Back in the citizen session, refresh the dashboard — status should show Approved
9. The Download button should now appear

If all 9 steps work, your local environment is fully operational.

---

## Common errors and fixes

### `ECONNREFUSED 3306` — MySQL not running
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows
net start MySQL80
```

### `ER_ACCESS_DENIED_ERROR` — wrong DB credentials
Double-check `DB_USER` and `DB_PASS` in `.env`. Make sure the user was granted privileges on `council_db`.

### `Error: Cannot find module './db'`
You are running `server.js` from the wrong directory. Always run from inside the `backend/` folder.

### Vite proxy error / CORS error in browser
Make sure `CLIENT_URL` in backend `.env` matches exactly what Vite is running on (including port). Default is `http://localhost:5173`.

### `JWT_SECRET` missing warning
The backend will not start if `JWT_SECRET` is empty. Generate one and paste it into `.env`.

---

## Useful development commands

```bash
# Generate a bcrypt hash for any password
node -e "require('bcryptjs').hash('yourpassword', 12).then(console.log)"

# Decode a JWT token (for debugging)
node -e "console.log(JSON.parse(Buffer.from('PASTE_TOKEN_MIDDLE_PART'.split('.')[1], 'base64').toString()))"

# Reset the database (careful — deletes all data)
mysql -u council_user -p council_db -e "DROP DATABASE council_db; CREATE DATABASE council_db;"
mysql -u council_user -p council_db < database/schema.sql

# Check which port a process is using
lsof -i :3000
```
