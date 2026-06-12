# Correl 2 Project

Event management system with admin event creation, participant registration, Stripe payments, email notifications, analytics, export, and reminder workflows.

## Project structure

- `backend/` - Flask API server, database models, payment handling, email and analytics endpoints.
- `frontend/` - Vite + React admin and user UI.

## Prerequisites

- Python 3.11+ (or compatible)
- Node.js 18+ and npm
- Windows PowerShell or any terminal

## Backend setup

1. Open a terminal in the project root.
2. Create a Python virtual environment if not already present:

```powershell
python -m venv .venv
```

3. Activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

4. Install backend dependencies:

```powershell
pip install -r backend/requirements.txt
```

5. Copy the example environment file and update your credentials:

```powershell
copy backend\.env.example backend\.env
```

6. Edit `backend/.env` and set:
- `STRIPE_API_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY` (optional for AI suggestions)
- `SMTP_SERVER`
- `SMTP_PORT`
- `EMAIL_ACCOUNT`
- `EMAIL_PASSWORD`

7. Start the backend server:

```powershell
cd backend
python app.py
```

The Flask API will run on `http://localhost:5000` by default.

## Frontend setup

1. Open a second terminal in the project root.
2. Install frontend dependencies:

```powershell
cd frontend
npm install
```

3. Start the Vite development server:

```powershell
npm run dev
```

The React app will run on `http://localhost:5173`.

## Running the app

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:5173` in the browser.
4. Use the admin dashboard to create events, view participants, run analytics, export registrations, and send reminder emails.

## Demo script

This demo assumes a working backend and frontend.

1. Open the app at `http://localhost:5173`.
2. Sign in as an admin user or use the admin dashboard entry point.
3. Create a new event with title, location, date, ticket price, and payment details.
4. Switch to the event listing and click `View Participants` for the new event.
5. Confirm the analytics card shows totals for registrations, approvals, paid status, and projected revenue.
6. Click `Export Participants` to download the CSV file. If no event is selected, the app shows a prompt with the required action.
7. Click `Send Reminders` to dispatch reminder emails to registered attendees.
8. Review the email notifications log below the participant list to confirm messages were recorded.
9. Register for the event as a user, choose either manual or Stripe payment, then return to the admin dashboard to approve, reject, or confirm payments.

## Notes

- Use `backend/.env` for secret keys and credentials.
- The participant export endpoint is protected by owner checks and only works for the selected admin event.
- If emails fail, verify the SMTP configuration in `backend/.env`.

## Troubleshooting

- If the frontend cannot reach the backend, ensure the backend is running on `http://localhost:5000`.
- For Stripe checkout issues, verify both `STRIPE_API_KEY` and `STRIPE_PUBLISHABLE_KEY` are set.
- For missing AI suggestions, check `OPENAI_API_KEY` or use fallback text prompts.
