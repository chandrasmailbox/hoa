# HOA Management System - Setup Guide

## Overview
This is a comprehensive HOA (Homeowners Association) management application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Core Functionality
- **Role-Based Access Control**: Admin and Resident roles with appropriate permissions
- **Authentication**: Secure email/password authentication using Supabase
- **Dashboard**: Real-time financial overview and activity tracking
- **Maintenance Management**: Create, track, and manage maintenance requests
- **Financial Management**: Track income and expenses with detailed categorization
- **Payment Portal**: Manage HOA dues and payments
- **Announcements**: Post and view community announcements
- **Notifications**: Real-time notification system for important updates

### User Roles

#### Admin
- Full access to all features
- Can create and manage maintenance requests
- Can add transactions (income/expenses)
- Can manage payments
- Can post announcements
- View all financial reports and dashboards

#### Resident
- View dashboard with personal information
- Submit maintenance requests
- View and pay HOA dues
- View payment history
- Read announcements
- Receive notifications

## Getting Started

### 1. Environment Setup
The `.env` file should already contain your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
The database schema has been automatically created with the following tables:
- `profiles` - User profiles with role information
- `properties` - Property information
- `maintenance_requests` - Maintenance tracking
- `maintenance_documents` - Document attachments
- `transactions` - Financial transactions
- `payments` - HOA payment tracking
- `announcements` - Community announcements
- `notifications` - User notifications

### 3. Create Demo Accounts

You'll need to create user accounts through the Supabase dashboard or using the application's sign-up functionality.

**Admin Account Example:**
- Email: admin@hoa.com
- Password: demo123
- Role: admin

**Resident Account Example:**
- Email: resident@hoa.com
- Password: demo123
- Role: resident

To create these accounts:
1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add User" and create accounts
4. After creation, the user profile will be automatically created when they first log in

### 4. Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Application Structure

```
src/
├── components/
│   ├── Auth/              # Authentication components
│   ├── Dashboard/         # Dashboard and statistics
│   ├── Maintenance/       # Maintenance request management
│   ├── Financial/         # Transaction management
│   ├── Payments/          # Payment portal
│   ├── Announcements/     # Community announcements
│   ├── Notifications/     # Notification center
│   └── Layout/            # App layout and navigation
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── lib/
│   └── supabase.ts        # Supabase client and types
└── App.tsx                # Main application component
```

## Key Features Explained

### Financial Dashboard
- **Total Income**: Sum of all income transactions
- **Total Expenses**: Sum of all expense transactions
- **Current Balance**: Income minus expenses
- **Pending Payments**: Outstanding HOA dues
- **Recent Transactions**: Latest financial activity
- **Maintenance Overview**: Active and pending maintenance requests

### Maintenance Management
- Create maintenance requests with categories (landscaping, pool, security, repairs, etc.)
- Set priority levels (low, medium, high, urgent)
- Assign vendors
- Track status (pending, in progress, completed, cancelled)
- Schedule maintenance dates
- Record estimated and actual costs
- Support for recurring maintenance tasks

### Financial Tracking
- Record income (HOA fees, fines, facility rentals)
- Record expenses (repairs, utilities, insurance, maintenance contracts)
- Automatic categorization
- Payment method tracking
- Reference number support
- Date-based filtering

### Payment Portal
- View all payments (pending, paid, overdue)
- Mark payments as paid
- Track payment history
- Automatic overdue detection
- Payment method recording

### Announcements
- Post community-wide announcements
- Priority levels (normal, important, urgent)
- Visual differentiation based on priority
- Timestamp tracking

### Notifications
- Real-time notifications for important events
- Mark notifications as read
- Delete unwanted notifications
- Filter by read/unread status
- Categorized by type (payment reminders, maintenance updates, announcements, system)

## Security Features

### Row Level Security (RLS)
All database tables have RLS policies enabled:
- Admins can view and modify all records
- Residents can only view their own data
- Proper authentication checks on all operations

### Authentication
- Secure password-based authentication
- Session management
- Automatic token refresh
- Role-based access control

## Best Practices

1. **Data Safety**: All database operations use RLS policies
2. **Error Handling**: Comprehensive error handling throughout the application
3. **Loading States**: User-friendly loading indicators
4. **Responsive Design**: Works on all device sizes
5. **Type Safety**: Full TypeScript support

## Common Tasks

### Adding a New Admin
1. Create user account in Supabase Auth
2. Insert profile record with role='admin'
3. User can now access all admin features

### Creating Properties
1. Log in as admin
2. Use Supabase dashboard to insert property records
3. Assign owner_id to link properties to residents

### Recording Transactions
1. Navigate to Transactions page (admin only)
2. Click "Add Transaction"
3. Select type (income/expense) and category
4. Enter amount and details
5. Submit to record

### Managing Payments
1. Navigate to Payments page
2. View all pending payments
3. Click "Mark as Paid" when payment is received
4. System automatically records payment date

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Supabase connection in the `.env` file
3. Ensure database migrations have been applied
4. Check that RLS policies are enabled

## Next Steps

Consider adding:
- File upload for maintenance documents
- Email notifications
- Stripe integration for online payments
- Advanced reporting and analytics
- Property owner directory
- Meeting scheduling
- Voting system for HOA decisions
- Document library
