# Deployment Guide — icuprojects.icu

This guide walks you through deploying the system to your purchased server at icuprojects.icu. Complete this in Week 2 for the initial deploy, then repeat the relevant steps in Week 4 for the final submission.

**You will need:**
- cPanel login credentials for your icuprojects.icu account
- FTP client (FileZilla — free) OR use cPanel's built-in File Manager
- The built React frontend (`dist/` folder)
- The `backend/` folder
- The `database/schema.sql` file

---

## Step 1: Log in to cPanel

Go to `https://icuprojects.icu/cpanel` (or the URL provided in your purchase confirmation email). Enter your username and password.

---

## Step 2: Create the MySQL database

In cPanel, find **MySQL Databases** (under the Databases section).

1. Under "Create New Database", type: `council_db` → click **Create Database**
2. Under "MySQL Users" → "Create New User":
   - Username: `council_user`
   - Password: choose a strong password and save it — you will need it for `.env`
   - Click **Create User**
3. Under "Add User to Database":
   - Select `council_user` and `council_db`
   - Click **Add**
   - On the permissions page, click **All Privileges** → **Make Changes**

---

## Step 3: Import the database schema

In cPanel, find **phpMyAdmin** and open it.

1. In the left panel, click on your database (`council_db`)
2. Click the **Import** tab at the top
3. Click **Choose File** and select `database/schema.sql` from your computer
4. Click **Go** at the bottom
5. You should see a success message. Click on your database in the left panel and verify 6 tables appear

---

## Step 4: Upload the backend

In cPanel, open **File Manager**.

1. Navigate to your home directory (not `public_html` — one level above it)
2. Create a new folder called `backend`
3. Upload all files from your local `backend/` folder into this folder
   - You can use cPanel's Upload button for small numbers of files
   - For many files, use FileZilla (FTP) — it is much faster

> **Do not** put the backend inside `public_html` — backend files should not be directly accessible from the web.

---

## Step 5: Create the `.env` file on the server

In File Manager, navigate to your `backend/` folder on the server.

1. Click **New File**, name it `.env`
2. Right-click the file → **Edit**
3. Paste and fill in:

```
PORT=3000
CLIENT_URL=https://[your-subdomain].icuprojects.icu

DB_HOST=localhost
DB_USER=cpaneluser_council_user
DB_PASS=the_password_you_set_in_step_2
DB_NAME=cpaneluser_council_db

JWT_SECRET=paste_a_long_random_string_here

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your.email@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM="Local Council <noreply@council.gov.zm>"
```

> **Note on cPanel database names and users:** cPanel prefixes your database name and username with your cPanel account name. If your cPanel username is `jeh123`, then your database is `jeh123_council_db` and your user is `jeh123_council_user`. Check this in the MySQL Databases section.

> **Gmail App Password:** For Gmail to work with Nodemailer, you need to enable 2-factor authentication on your Gmail account and generate an App Password at myaccount.google.com/apppasswords. Use this 16-character password as `MAIL_PASS`.

---

## Step 6: Set up the Node.js application

In cPanel, find **Setup Node.js App** (under the Software section).

1. Click **Create Application**
2. Set:
   - **Node.js version:** 18 (or highest available)
   - **Application mode:** Production
   - **Application root:** `backend` (the folder you created in step 4)
   - **Application URL:** leave blank or set to your main domain
   - **Application startup file:** `server.js`
3. Click **Create**
4. On the next screen, click **Run NPM Install** — this installs the backend dependencies from `package.json`
5. Click **Start App**

Your API should now be running. Test it:

```
https://[your-subdomain].icuprojects.icu:3000/health
```

Or if port 3000 is not exposed publicly, the cPanel Node.js manager routes it through Apache automatically.

---

## Step 7: Build and upload the React frontend

On your local computer:

```bash
cd frontend
npm run build
```

This creates a `dist/` folder containing the compiled React app.

In cPanel File Manager:

1. Navigate to `public_html/`
2. Delete any existing placeholder files (`index.html`, `cgi-bin/`)
3. Upload all files from your local `dist/` folder into `public_html/`

---

## Step 8: Configure Apache for React Router and API proxy

React Router uses client-side navigation — Apache needs to be told to serve `index.html` for all routes. The API also needs to be proxied to the Node.js process.

In cPanel File Manager, create a file called `.htaccess` inside `public_html/`:

```apache
Options -MultiViews
RewriteEngine On

# Pass Authorization header to Node.js (required for JWT auth)
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# Proxy /api/* requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Proxy /uploads/* to backend uploads folder
RewriteCond %{REQUEST_URI} ^/uploads/
RewriteRule ^uploads/(.*)$ http://localhost:3000/uploads/$1 [P,L]

# React Router — serve index.html for all non-file routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Save the file.

---

## Step 9: Test the live system

Open `https://[your-subdomain].icuprojects.icu` in your browser.

Run through this checklist:

- [ ] Login page loads
- [ ] Register a new test account
- [ ] Log in with the new account
- [ ] Dashboard loads with empty applications
- [ ] Services page shows 6 service cards
- [ ] Submit a test application — reference number appears
- [ ] Log in as admin in a separate browser/incognito window
- [ ] Admin panel shows the test application
- [ ] Approve the application and upload a PDF
- [ ] Back in citizen browser — status shows Approved, Download button appears
- [ ] Download the PDF — correct file opens
- [ ] Submit feedback — 5 stars

If all items pass, your deployment is complete.

---

## Step 10: Note your live URL for submission

Your submission URL will be in the format:

```
https://[your-subdomain].icuprojects.icu
```

Submit this URL along with your user manual and technical report to the department email before 20 May 2026.

---

## Troubleshooting deployment issues

### API returns 502 Bad Gateway
The Node.js app is not running. Go to cPanel → Setup Node.js App → find your app → click **Start**.

### Static files (CSS, JS) return 404
Check that all files from `dist/` were uploaded into `public_html/` and not into a subfolder of it.

### Login works but all API calls return 401
The Apache proxy is stripping the Authorization header. Make sure the `.htaccess` file includes the `HTTP_AUTHORIZATION` rewrite rule from Step 8.

### Database connection error in logs
Double-check the database name, username, and password in `.env`. Remember cPanel prefixes these with your account name.

### Emails not sending
Test your Gmail credentials in Mailtrap first. If Gmail is blocked by the host, ask icuprojects.icu support which SMTP server to use, or use the host's own mail server.
