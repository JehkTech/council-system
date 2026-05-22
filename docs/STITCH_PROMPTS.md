# Stitch Wireframe Prompts — UI/UX Screens

Use these prompts at [Stitch by Google](https://stitch.withgoogle.com). Paste each prompt exactly as written — do not shorten them. After generation, import each screen into Figma Make and use "Recreate as components" to extract reusable JSX stubs.

---

## Screen 1 — Login / Register page

```
Design a clean government web portal authentication page for a system called "Local Council Services". 
Use a light background with a professional navy blue and white color scheme.

Layout: two-column. Left side is a full-height panel with a subtle civic illustration — government 
buildings, a city skyline silhouette, or a document/seal pattern — in navy blue and white. 
Right side has a centered white card with rounded corners and a subtle shadow.

Card contents from top to bottom:
- Council logo placeholder (circular seal icon) and the text "Local Council Services" in navy
- A tab switcher with two tabs: "Sign In" and "Register"

Sign In tab shows:
- Email address input field with label and email icon
- Password input field with label, lock icon, and show/hide toggle button
- A "Forgot password?" link aligned right, in a muted color
- A full-width navy blue "Sign In" button with white text
- A divider with "or" and a note "New here? Switch to Register"

Register tab shows:
- Full Name input field
- Email address input field
- Phone number input field (optional label)
- Password input field with strength indicator
- Confirm password input field
- Full-width "Create Account" navy button

Footer of the card: small padlock icon and "Secure Government Portal" text in muted gray.

The page must be mobile responsive. On mobile, the left illustration panel is hidden and only 
the card is shown full-width.
```

---

## Screen 2 — Citizen dashboard

```
Design a citizen-facing dashboard page for a local council digital services web application. 
Professional government portal aesthetic — white and light gray background, navy blue sidebar and accents.

Top navigation bar:
- Left: council logo and "Local Council Services" text
- Right: notification bell icon with a badge, user full name, avatar circle with initials, dropdown arrow

Left sidebar (fixed, navy blue background, white text):
- Navigation links with icons: Dashboard, My Applications, Apply for Service, Notifications, Help
- Current page (Dashboard) highlighted with a lighter navy or white left-border indicator
- Bottom of sidebar: user role "Citizen" label and a Logout link

Main content area (white/light gray):
- Page title "My Dashboard" with today's date
- Three summary stat cards in a row: "Total Applications" (blue), "Pending Review" (amber/orange), 
  "Approved" (green). Each card has a large number, label, and a small icon.
- Section heading "Recent Applications" with a "View All" link
- A clean table with columns: Reference No, Service Name, Status, Date Submitted, Action
  - Status column uses colored badges: yellow pill for Pending, blue for Under Review, 
    green for Approved, red for Rejected
  - Action column has a small "View" button and — only for Approved rows — a "Download" button
- An empty state illustration and message if no applications exist yet

The layout must be responsive. On tablet and mobile, the sidebar collapses to a hamburger menu.
```

---

## Screen 3 — Apply for service (multi-step form)

```
Design a multi-step service application form page for a government services portal. 
Clean white layout, navy blue and teal accents, spacious padding.

Step progress indicator at the top of the content area — horizontal stepper with 3 steps:
  Step 1: "Select Service" (active/highlighted)
  Step 2: "Application Details"
  Step 3: "Review & Submit"
Each step has a circle with number, label below, connected by a horizontal line. 
Completed steps show a green checkmark.

Step 1 — Select Service:
  A grid of 6 service cards (3 columns on desktop, 2 on tablet, 1 on mobile).
  Each card has:
  - A simple icon (document, building, calendar, certificate, home, people)
  - Service name in bold (Business Permit, Construction Permit, Event Permit, 
    Birth Certificate, Residence Certificate, Community Registration)
  - Short description in muted text
  - Category badge (permit / certificate / registration) in a small pill
  - A "Select" button
  When a card is selected, it gets a navy blue border and the button changes to "Selected ✓"

Step 2 — Application Details (show as a wireframe below Step 1 flow):
  - A textarea labeled "Additional Notes / Details" with placeholder text
  - A file upload zone with dashed border, upload icon, "Drag & drop files here or Browse" 
  - Accepted file types note: "PDF, JPG, PNG — Max 10MB"
  
Navigation buttons at the bottom:
  - "Back" button (outlined, left-aligned)
  - "Next" button or "Submit Application" button (filled navy, right-aligned)
```

---

## Screen 4 — Application tracking / detail view

```
Design an application detail and tracking page for a government services portal.

Page header section (white card):
- Back arrow link "← My Applications"
- Application reference number "LCS-2026-0001" as a heading
- Service name subtitle: "Business Operating Permit"
- Large status badge on the right: e.g. "Under Review" in blue, or "Approved" in green
- Submitted date in muted text

Two-column layout below the header:

Left column — Application information card:
- Section heading "Application Details"
- Labeled rows: Applicant Name, Email, Phone, Service Type, Category, Submitted On
- "Your Notes" section showing the applicant's original notes
- If status is "Approved": a green success banner "Your application has been approved" 
  with a large navy "Download Document" button
- If status is "Rejected": a red banner showing the officer's rejection reason

Right column — Progress tracking card:
- Section heading "Application Progress"
- Vertical timeline with 4 stages from top to bottom:
    1. "Submitted" — green filled circle with checkmark + timestamp date
    2. "Under Review" — blue pulsing/animated circle (current stage) + "In progress" label
    3. "Decision" — gray empty circle (future)
    4. "Completed" — gray empty circle (future)
  Stages are connected by a vertical line, filled/green for completed sections, gray for pending.

Below the left column — Feedback card (only visible when status = Approved):
- Section heading "Rate this Service"
- 5 star icons, clickable
- Comment textarea with placeholder "Share your experience..."
- "Submit Feedback" button in navy
```

---

## Screen 5 — Admin panel

```
Design a council officer admin dashboard for managing citizen service applications.

Layout: fixed left sidebar + main content area.

Sidebar (dark navy, width ~220px):
- Council logo and "Admin Panel" label at top
- Navigation links with icons, white text:
  Dashboard, Applications, Officers (greyed out), Reports (greyed out), Settings
- Active page (Applications) highlighted
- Bottom: officer name, role badge "Officer", logout link

Top navigation bar (white, with subtle bottom border):
- Page title "Service Applications"
- Right side: search input, a status filter dropdown ("All Statuses / Submitted / Under Review / 
  Approved / Rejected"), and a refresh icon button

Main content:
- Four mini stat cards in a row: Total, Pending Review (amber), Approved Today (green), Rejected (red)
- Applications data table:
  - Columns: Reference No, Citizen Name, Email, Service Type, Status (badge), Submitted, Actions
  - Status badges: yellow=Submitted, blue=Under Review, green=Approved, red=Rejected
  - Actions column: a navy "Review" button per row
  - Alternating row backgrounds for readability
  - Pagination controls at the bottom

Review slide-over panel (shown overlapping from the right when Review is clicked):
- Dark overlay on the rest of the page
- White panel, ~480px wide, sliding in from the right
- Panel header: application reference number + close X button
- Citizen details: name, email, phone, service type
- Their submitted notes in a read-only box
- Officer Notes textarea with label "Internal Notes / Decision Reason"
- File upload zone: "Upload Approved Document (PDF only)"
- Two large action buttons at the bottom: 
  green "Approve Application" and red "Reject Application"
  Each button asks for confirmation before acting.
```

---

## After generating in Stitch

1. Download each screen as a PNG or import the Stitch URL into Figma Make
2. In Figma Make, use "Recreate as Figma components" on each imported screen
3. Extract the following reusable components for your React project:
   - `StatusBadge` — colored pill with status text
   - `ServiceCard` — card with icon, title, description, select button
   - `TimelineStep` — one stage in the tracking timeline
   - `StatCard` — summary number card for dashboard/admin
   - `ApplicationRow` — table row with all application columns
   - `ReviewDrawer` — admin side panel layout
4. Export each component as a JSX stub and use GitHub Copilot to add the logic layer

## Submission note

Attach screenshots of all 5 generated screens to your Task 1 email submission to `icudepartmentofict@gmail.com` as a single PDF labeled "UI/UX Wireframes — Digital Council System".
