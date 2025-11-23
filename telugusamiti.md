I want to build a web application for a Non-Profit Organization (NPO) using React, TypeScript, Tailwind CSS, and Supabase (PostgreSQL). Please use the HOA management system code and architectural approach as a reference. The NPO system should support the following requirements:

**Core Features:**

1. **Authentication & Roles:**
   - Secure login system.
   - Two roles: 'admin' and 'user' (users are members or guests).

2. **Event Management:**
   - Admins can create, edit, and delete events.
   - Each event has a name, description, date, location, entry fee, and capacity.
   - Users can view a list of upcoming and past events.
   - Users can register (RSVP) for events and pay the entry fee online (use PayPal integration as in the HOA code).
   - Event registration tracks user attendance and payment status.

3. **Donations:**
   - Users can make donations at any time, choosing amount and optionally dedicating their donation to a cause or event.
   - Donations are processed online (PayPal integration).
   - Donation history is tracked per user.

4. **Financial Management:**
   - All payments (event entry fees and donations) are recorded as 'income' transactions.
   - Admins can record 'spending' transactions (expenses for events, operations, etc.).
   - Each transaction includes category, amount, description, date, and related event (if applicable).
   - CRUD operations for transactions by admin.

5. **Dashboard & Analytics:**
   - Dashboard visible to all users, showing:
     - Total income (entry fees + donations)
     - Total spending (expenses)
     - Current balance (income - spending)
     - Number of events, attendees, and donors
   - Interactive charts for income, spending, donation breakdowns, and event statistics.
   - Ability to select date ranges for reporting.
   - Export financial and event data to CSV and JSON.

6. **User Profile & History:**
   - Users can view their registration history for events.
   - Users can see their donation history.
   - Admins can view all users and their activities.

7. **Announcements & Notifications:**
   - Admins can post announcements (event reminders, fundraising campaigns, news).
   - All users receive notifications about upcoming events and donation opportunities.

8. **Modern UI/UX:**
   - Responsive sidebar navigation with role-based menu items.
   - Mobile-friendly, clean, and intuitive design using Tailwind CSS.

**Technical Stack:**
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Payments:** PayPal integration for entry fees and donations
- **Exports:** Data export (CSV, JSON)
- **State Management:** React Context

**Supabase Tables (suggested):**
- `users` (id, name, email, role, ...)
- `events` (id, name, description, date, location, fee, capacity, ...)
- `event_registrations` (id, user_id, event_id, payment_status, ...)
- `donations` (id, user_id, amount, message, date, ...)
- `transactions` (id, type ['income'|'spending'], category, amount, description, date, related_event_id, ...)
- `announcements` (id, title, body, created_at, ...)

**Request:**
Please provide:
- A clean, modular implementation plan and project file structure
- Sample code for event CRUD, event registration and payment, donation workflow, dashboard analytics, and PayPal integration
- Supabase table schema definitions for all entities
- UI component templates with role-based access and navigation
- Suggestions for UX, security, and performance improvements

You may use and adapt patterns and components from the HOA repository for this project.
