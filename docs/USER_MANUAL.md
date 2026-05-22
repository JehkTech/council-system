# User Manual — Digital Local Council Service Management System

**Version:** 1.0
**System URL:** https://[your-subdomain].icuprojects.icu
**Support contact:** [your email]

---

## Introduction

The Digital Local Council Service Management System allows citizens of [your council name] to apply for permits, certificates, and registrations online — without needing to visit a council office. This manual explains how to use the system as a citizen and as a council officer.

---

# Part A — Citizen Guide

## A1. Creating your account

Before using the system you must register a citizen account.

**Steps:**

1. Open your web browser and go to `https://[your-site].icuprojects.icu`
2. You will see the login page. Click the **Register** tab
3. Fill in the registration form:
   - **Full Name** — your legal full name as it appears on your NRC
   - **Email Address** — a valid email you have access to (notifications will be sent here)
   - **Phone Number** — optional, but recommended for contact
   - **Password** — must be at least 8 characters long
   - **Confirm Password** — re-enter your password
4. Click **Create Account**
5. You will be automatically logged in and taken to your dashboard

> **Important:** Use an email address you check regularly. All application status updates will be sent to this address.

---

## A2. Logging in

1. Go to `https://[your-site].icuprojects.icu`
2. The **Sign In** tab will be shown by default
3. Enter your email address and password
4. Click **Sign In**
5. You will be taken to your personal dashboard

If you forget your password, see section A6.

---

## A3. Your dashboard

After logging in, you will see your personal dashboard. It shows:

- **Summary cards** at the top: total number of applications you have submitted, how many are pending, and how many have been approved
- **Recent Applications table** below: a list of all your applications with their current status

**Status meanings:**

| Status | What it means |
|--------|--------------|
| Submitted | Your application has been received and is waiting for a council officer to begin review |
| Under Review | A council officer is actively reviewing your application |
| Pending Information | The officer needs additional information from you — check your email |
| Approved | Your application has been approved. Your document is ready to download |
| Rejected | Your application was not approved. The reason is shown in the application details |

---

## A4. Applying for a service

1. From your dashboard, click **Apply for Service** in the left sidebar
2. You will see a grid of 6 available services. Select the one you need:
   - Business Operating Permit
   - Construction/Building Permit
   - Public Event Permit
   - Birth Registration Certificate
   - Residence Certificate
   - Community Organisation Registration
3. Click the **Select** button on your chosen service. The card will show a blue border confirming your choice
4. Click **Next** to proceed
5. On the next step, fill in:
   - **Additional Notes / Details** — describe your application. Include any relevant details such as your business address, the event date, or the purpose of the certificate
   - **Attach a file** (optional) — you can upload a supporting document such as a letter, ID copy, or form
6. Click **Next** to see a summary of your application
7. Review all details carefully
8. Click **Submit Application**
9. You will see a confirmation screen showing your **Reference Number** (e.g. LCS-2026-0001). Save this number — you will need it if you contact the council about your application
10. You will also receive a confirmation email at your registered address

---

## A5. Tracking your application status

After submitting an application, you can check its progress at any time.

1. Go to your dashboard
2. Find the application in the table
3. Click the **View** button on the right side of the row
4. The Application Detail page shows:
   - Current status (shown as a large badge at the top)
   - A **progress timeline** on the right side showing each stage with the date it was reached
   - The officer's notes if a decision has been made
   - A **Download Document** button if your application is Approved

---

## A6. Downloading your approved document

When your application is approved, the council officer will upload your approved permit or certificate.

1. Go to your dashboard — the application will show status **Approved** (green)
2. Click **View** to open the application detail
3. Click the green **Download Document** button
4. Your browser will download the PDF document
5. Print or save the document — it is your official approved permit or certificate

> Note: The Download button only appears for applications with Approved status that have a document attached by the officer.

---

## A7. Submitting feedback

After your application is approved, you are invited to rate the service you received.

1. Open the Application Detail page for your approved application
2. Scroll down to the **Rate this Service** section
3. Click the number of stars you want to give (1 = poor, 5 = excellent)
4. Optionally type a comment in the text box
5. Click **Submit Feedback**

Your feedback helps the council improve its services. You can only submit feedback once per application.

---

## A8. Forgot your password

1. On the login page, click **Forgot password?** below the password field
2. Enter your registered email address
3. Click **Send Reset Link**
4. Check your email inbox for a message from the council system
5. Click the link in the email — it will take you to a page where you can set a new password
6. The reset link is valid for 1 hour. If it expires, repeat the process

---

# Part B — Administrator / Officer Guide

## B1. Logging in as an officer

Officers use the same login page as citizens. Enter your officer email and password. After login, you will be taken directly to the **Admin Panel** instead of the citizen dashboard.

> If you see the citizen dashboard instead of the admin panel, your account may not have the correct role. Contact the system administrator.

---

## B2. The admin panel overview

The admin panel has the following sections:

- **Applications** — the main area for reviewing and processing all citizen applications
- **Dashboard** — summary statistics (total, pending, approved, rejected today)

The top of the Applications page shows four summary cards. Below is the applications table.

---

## B3. Viewing applications

The applications table shows every application submitted by all citizens. Each row displays:
- Reference number
- Citizen name and email
- Service type
- Current status (color-coded badge)
- Date submitted
- Actions

**Filtering:** Use the **Status** dropdown at the top right to filter by status (All / Submitted / Under Review / Approved / Rejected).

**Searching:** Type in the search box to find applications by citizen name, email, or reference number.

---

## B4. Reviewing an application

1. Find the application in the table
2. Click the navy **Review** button on the right of the row
3. A panel will slide in from the right showing:
   - Citizen's full details
   - The service they applied for
   - Their notes and any attached files
   - An **Officer Notes** text box for your internal remarks
   - A file upload zone for the approved document

---

## B5. Approving an application

1. Open the Review panel for the application (see B4)
2. Read the citizen's application details and any supporting files
3. In the **Officer Notes** box, write the approval reason or conditions (e.g. "Permit approved for 12 months. Valid until 31 May 2027")
4. Click **Choose File** in the document upload zone and select the approved PDF document (permit or certificate) from your computer. The file must be a PDF and must not exceed 5MB
5. Click the green **Approve Application** button
6. Confirm the action when prompted
7. The application status will change to **Approved**
8. The citizen will automatically receive an email notification and will be able to download the document from their dashboard

---

## B6. Rejecting an application

1. Open the Review panel for the application
2. In the **Officer Notes** box, clearly explain why the application is being rejected. This note will be visible to the citizen — be professional and specific (e.g. "Application rejected — business address provided is outside council jurisdiction. Reapply with a valid address within the city boundaries")
3. Click the red **Reject Application** button
4. Confirm the action when prompted
5. The application status will change to **Rejected**
6. The citizen will receive an email notification with the rejection reason

---

## B7. Requesting more information

If an application is incomplete:

1. Open the Review panel
2. In the Officer Notes box, describe exactly what additional information is needed
3. Click **Request More Information** (this sets status to Pending Information)
4. The citizen will receive an email explaining what is needed
5. When the citizen resubmits or contacts the office, you can return to the application and update the status to Under Review again

---

## B8. Viewing submitted feedback

Citizen feedback ratings are visible in each application's detail. To see overall service performance, use the **Reports** section (when available) for average ratings per service type.

---

# Appendix — Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid credentials" on login | Check you are using the correct email and password. Passwords are case-sensitive |
| Did not receive confirmation email | Check your spam folder. If not there, contact support |
| Download button not showing | The officer has not yet uploaded the approved document. Wait for an email notification |
| Upload fails in admin panel | Ensure the file is a PDF and is smaller than 5MB |
| Session expired / logged out | Sessions last 7 days. Simply log in again |
| Page does not load | Check your internet connection. Try clearing your browser cache |

---

*This manual was prepared for the ICU E-Governance & Digital Marketing project, 2026.*
