import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = os.path.join(BASE_DIR, ".venv", "Scripts", "python.exe")

if (
    os.name == "nt"
    and os.path.exists(VENV_PYTHON)
    and os.path.abspath(sys.executable).lower() != os.path.abspath(VENV_PYTHON).lower()
):
    raise SystemExit(subprocess.call([VENV_PYTHON, *sys.argv]))

from flask import Flask, request, jsonify, send_from_directory, Response
from werkzeug.utils import secure_filename
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import random
import string
import qrcode
import base64
import csv
import io
import json
import urllib.request
from urllib.error import HTTPError, URLError
from io import BytesIO
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
import stripe
import re

app = Flask(__name__)
# Load the backend .env explicitly so API keys work even when the server is started from the repo root.
dotenv_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path)
CORS(app)

# ======================
# CONFIG
# ======================

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

PAYMENT_NUMBER = "09222333123"

EMAIL_ADDRESS = os.environ.get("EMAIL_ADDRESS", "your_email@gmail.com")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "your_app_password")
EMAIL_SMTP_SERVER = os.environ.get("EMAIL_SMTP_SERVER", "smtp.gmail.com")
EMAIL_SMTP_PORT = int(os.environ.get("EMAIL_SMTP_PORT", "465"))
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "true").lower() in ("1", "true", "yes")

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Log AI configuration on startup
if GROQ_API_KEY:
    print("✅ Groq API Key loaded successfully (length: {})".format(len(GROQ_API_KEY)))
elif OPENAI_API_KEY:
    print("✅ OpenAI API Key loaded successfully (length: {})".format(len(OPENAI_API_KEY)))
else:
    print("⚠️  WARNING: No AI API key configured. AI features will be unavailable.")

engine = create_engine("sqlite:///event.db", echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ======================
# MODELS
# ======================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    email = Column(String(200), unique=True)
    password_hash = Column(String(255))


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    title = Column(String(200))
    description = Column(Text)
    location = Column(String(200))
    date = Column(String(50))
    price = Column(Integer)
    owner_id = Column(Integer)
    visibility = Column(String(50))
    payment_phone = Column(String(200))
    payment_qr_filename = Column(String(255))


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(200))
    email = Column(String(200))
    event_id = Column(Integer)

    payment_method = Column(String(50))
    payment_status = Column(String(50), default="pending")
    approval_status = Column(String(50), default="waiting")

    reference_number = Column(String(100))
    payment_date = Column(String(100))

    screenshot_filename = Column(String(255))

    receipt_number = Column(String(100))
    ticket_code = Column(String(100))
    ticket_qr_data = Column(Text)

    attended = Column(Boolean, default=False)


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True)
    recipient = Column(String(200))
    subject = Column(String(255))
    body = Column(Text)
    status = Column(String(100))
    event_id = Column(Integer)
    created_at = Column(String(100))


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    recipient_email = Column(String(200))
    title = Column(String(255))
    message = Column(Text)
    type = Column(String(50), default="info")
    event_id = Column(Integer)
    registration_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    created_at = Column(String(100))


Base.metadata.create_all(engine)

# ======================
# HELPERS
# ======================

def generate_code(prefix):
    return prefix + "-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=10))


def generate_qr(data):
    qr = qrcode.make(data)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()


def is_valid_email(addr):
    if not addr or "@" not in addr:
        return False
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", addr) is not None


def call_ai_api(messages, max_tokens=500, temperature=0.7):
    """
    Call AI API using Groq (primary, free) or OpenAI (fallback, paid).
    Returns dict with 'response' key or None on failure.
    """
    # Prefer Groq (free tier)
    if GROQ_API_KEY:
        api_key = GROQ_API_KEY
        api_url = GROQ_API_URL
        model = "llama2-70b-chat"  # Use llama2-70b-chat which is commonly available in Groq free tier
    elif OPENAI_API_KEY:
        api_key = OPENAI_API_KEY
        api_url = OPENAI_API_URL
        model = "gpt-3.5-turbo"
    else:
        return None

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature
    }

    try:
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            response_text = result["choices"][0]["message"]["content"]
            return {"response": response_text}
    except (HTTPError, URLError, Exception) as e:
        print(f"AI API error: {str(e)}")
        return None


def call_openai_for_suggestions(event):
    if not GROQ_API_KEY and not OPENAI_API_KEY:
        return None

    prompt = (
        f"You are an event promotion assistant. Create a short event summary, a social media caption, "
        f"and a friendly participant invitation based on these details:\n\n"
        f"Title: {event.title}\n"
        f"Description: {event.description}\n"
        f"Location: {event.location}\n"
        f"Date: {event.date}\n"
        f"Price: {event.price if event.price is not None else 'Free'} PHP\n"
        f"Payment info: {event.payment_phone or 'standard payment flow'}\n"
    )

    messages = [
        {"role": "system", "content": "You are a helpful event marketing assistant."},
        {"role": "user", "content": prompt}
    ]

    result = call_ai_api(messages, max_tokens=220, temperature=0.8)
    if result:
        return {"openai": result["response"]}
    return None


def generate_ai_suggestions(event):
    summary = (
        f"{event.title} is happening on {event.date} at {event.location}. "
        f"Join us for {event.description[:150].rstrip()}" +
        ("..." if len(event.description or "") > 150 else "")
    )

    price_note = "Free entry" if not event.price else f"Only PHP {event.price} to attend"
    action_line = "Reserve your spot now" if event.price else "Sign up today"

    return {
        "event_summary": summary,
        "marketing_copy": (
            f"Don’t miss '{event.title}' at {event.location} on {event.date}. {price_note}. "
            f"{action_line} and share this with your friends!"
        ),
        "social_caption": (
            f"Looking for something exciting to do? {event.title} is coming to {event.location} on {event.date}. "
            f"{price_note}. Tap to learn more and book your spot!"
        ),
        "participant_message": (
            f"Hi there! We’re excited to invite you to '{event.title}'. "
            f"It will take place at {event.location} on {event.date}. "
            f"{price_note} — we hope to see you there!"
        )
    }


def create_notification(db, recipient_email, title, message, type="info", event_id=None, registration_id=None):
    notification = Notification(
        recipient_email=recipient_email,
        title=title,
        message=message,
        type=type,
        event_id=event_id,
        registration_id=registration_id,
        is_read=False,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(notification)
    db.commit()
    return notification


def send_email(to_email, subject, body, event_id=None):
    status = "sent"
    db = SessionLocal()

    try:
        if not is_valid_email(to_email):
            status = "invalid-email"
            print(f"Email not sent: invalid recipient '{to_email}'")
        elif EMAIL_ADDRESS == "your_email@gmail.com" or EMAIL_PASSWORD == "your_app_password":
            print("Email skipped (configure credentials)")
            status = "skipped"
        else:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = EMAIL_ADDRESS
            msg["To"] = to_email

            if EMAIL_USE_SSL:
                with smtplib.SMTP_SSL(EMAIL_SMTP_SERVER, EMAIL_SMTP_PORT) as server:
                    server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                    server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
            else:
                with smtplib.SMTP(EMAIL_SMTP_SERVER, EMAIL_SMTP_PORT) as server:
                    server.ehlo()
                    server.starttls()
                    server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                    server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())

    except Exception as e:
        status = f"failed: {e}"
        print("Email error:", e)

    finally:
        email_log = EmailLog(
            recipient=to_email,
            subject=subject,
            body=body,
            status=status,
            event_id=event_id,
            created_at=str(datetime.now())
        )
        db.add(email_log)
        db.commit()
        db.close()

    return status

# ======================
# NOTIFICATIONS
# ======================

@app.post("/api/notifications/<int:notification_id>/read")
def mark_notification_read(notification_id):
    db = SessionLocal()
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"message": "Email query parameter is required"}), 400

        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return jsonify({"message": "Notification not found"}), 404

        if notification.recipient_email != email:
            return jsonify({"message": "Forbidden"}), 403

        if not notification.is_read:
            notification.is_read = True
            db.commit()

        return jsonify({
            "id": notification.id,
            "recipient_email": notification.recipient_email,
            "is_read": notification.is_read,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "event_id": notification.event_id,
            "registration_id": notification.registration_id,
            "created_at": notification.created_at
        }), 200
    finally:
        db.close()

@app.delete("/api/notifications/<int:notification_id>")
def delete_notification(notification_id):
    db = SessionLocal()
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"message": "Email query parameter is required"}), 400

        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return jsonify({"message": "Notification not found"}), 404

        if notification.recipient_email != email:
            return jsonify({"message": "Forbidden"}), 403

        db.delete(notification)
        db.commit()

        return jsonify({"message": "Notification deleted successfully"}), 200
    finally:
        db.close()

@app.post("/api/email-logs/<int:log_id>/resend/<int:user_id>")
def resend_email_log(log_id, user_id):
    db = SessionLocal()
    try:
        log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
        if not log:
            return jsonify({"message": "Email log not found"}), 404

        if not log.event_id:
            return jsonify({"message": "Cannot resend an email log not associated with an event."}), 400

        event = db.query(Event).filter(Event.id == log.event_id).first()
        if not event or event.owner_id != user_id:
            return jsonify({"message": "Forbidden"}), 403

        status = send_email(log.recipient, log.subject, log.body, event_id=log.event_id)

        new_log = EmailLog(
            recipient=log.recipient,
            subject=log.subject,
            body=log.body,
            status=status,
            event_id=log.event_id,
            created_at=str(datetime.now())
        )
        db.add(new_log)
        db.commit()

        return jsonify({"message": "Resent email log.", "email_status": status}), 200
    finally:
        db.close()

# ======================
# AUTH
# ======================

@app.post("/api/signup")
def signup():
    db = SessionLocal()
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get("name") or not data.get("email") or not data.get("password"):
            return jsonify({"message": "Name, email, and password are required"}), 400
        
        # Check if email already exists
        if db.query(User).filter(User.email == data["email"]).first():
            return jsonify({"message": "Email already registered"}), 400
        
        # Create new user
        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=generate_password_hash(data["password"])
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return jsonify({
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Signup failed: {str(e)}"}), 500
    finally:
        db.close()


@app.post("/api/login")
def login():
    db = SessionLocal()
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"message": "Email and password are required"}), 400
        
        # Find user by email
        user = db.query(User).filter(User.email == data["email"]).first()
        
        # Check if user exists and password is correct
        if not user or not check_password_hash(user.password_hash, data["password"]):
            return jsonify({"message": "Invalid email or password"}), 401
        
        return jsonify({
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }), 200
    except Exception as e:
        return jsonify({"message": f"Login failed: {str(e)}"}), 500
    finally:
        db.close()

# ======================
# EVENTS
# ======================

@app.get("/api/events")
def public_events():
    db = SessionLocal()
    try:
        events = db.query(Event).filter(Event.visibility == "public").all()

        result = []
        for e in events:
            owner = db.query(User).filter(User.id == e.owner_id).first()
            result.append({
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "location": e.location,
                "date": e.date,
                "price": e.price,
                "owner_id": e.owner_id,
                "owner_name": owner.name if owner else "Unknown"
                ,
                "payment_phone": e.payment_phone,
                "payment_qr_filename": e.payment_qr_filename
            })

        return jsonify(result)
    finally:
        db.close()


@app.get("/api/events/<int:event_id>")
def event_details(event_id):
    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == event_id).first()

        if not event:
            return jsonify({"message": "Event not found"}), 404

        owner = db.query(User).filter(User.id == event.owner_id).first()

        return jsonify({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "location": event.location,
            "date": event.date,
            "price": event.price,
            "owner_id": event.owner_id,
            "owner_name": owner.name if owner else "Unknown"
            ,
            "payment_phone": event.payment_phone,
            "payment_qr_filename": event.payment_qr_filename
        })
    finally:
        db.close()


@app.get("/api/admin/events/<int:user_id>")
def my_events(user_id):
    db = SessionLocal()
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        events = db.query(Event).filter(Event.owner_id == user_id).all()

        return jsonify([{
            "id": e.id,
            "title": e.title,
            "location": e.location,
            "date": e.date,
            "price": e.price,
            "visibility": e.visibility
            ,
            "payment_phone": e.payment_phone,
            "payment_qr_filename": e.payment_qr_filename
        } for e in events])
    finally:
        db.close()


@app.get("/api/events/<int:event_id>/analytics")
def event_analytics(event_id):
    db = SessionLocal()
    try:
        user_id = request.args.get("user_id", type=int)
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        if user_id and event.owner_id != user_id:
            return jsonify({"message": "You are not allowed to access analytics for this event"}), 403

        regs = db.query(Registration).filter(Registration.event_id == event_id).all()
        total = len(regs)
        approved = sum(1 for r in regs if r.approval_status == "approved")
        rejected = sum(1 for r in regs if r.approval_status == "rejected")
        waiting = sum(1 for r in regs if r.approval_status == "waiting")
        paid = sum(1 for r in regs if r.payment_status in ("paid", "confirmed"))
        revenue = sum((event.price or 0) for r in regs if r.payment_status in ("paid", "confirmed") and event.price)

        return jsonify({
            "event_id": event.id,
            "title": event.title,
            "total_registrations": total,
            "approved": approved,
            "rejected": rejected,
            "waiting": waiting,
            "paid": paid,
            "revenue": revenue
        })
    finally:
        db.close()


@app.get("/api/events/<int:event_id>/export")
def export_event_participants(event_id):
    db = SessionLocal()
    try:
        user_id = request.args.get("user_id", type=int)
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        if not user_id or event.owner_id != user_id:
            return jsonify({"message": "You are not allowed to export this event"}), 403

        regs = db.query(Registration).filter(Registration.event_id == event_id).all()
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["ID", "Full Name", "Email", "Payment Method", "Payment Status", "Approval Status", "Reference", "Receipt", "Ticket Code", "Payment Date", "Attended"])

        for r in regs:
            writer.writerow([
                r.id,
                r.full_name or "",
                r.email or "",
                r.payment_method or "",
                r.payment_status or "",
                r.approval_status or "",
                r.reference_number or "",
                r.receipt_number or "",
                r.ticket_code or "",
                r.payment_date or "",
                "Yes" if r.attended else "No"
            ])

        csv_body = buffer.getvalue()
        filename = f"event-{event.id}-participants.csv"
        headers = {
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8"
        }
        return Response(csv_body, headers=headers)
    finally:
        db.close()


@app.post("/api/events/<int:event_id>/send-reminders/<int:user_id>")
def send_event_reminders(event_id, user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"message": "User not found"}), 404

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        if event.owner_id != user_id:
            return jsonify({"message": "You are not allowed to send reminders for this event"}), 403

        regs = db.query(Registration).filter(Registration.event_id == event_id).all()
        sent = 0
        skipped = 0

        for reg in regs:
            if reg.approval_status == "rejected" or not reg.email:
                skipped += 1
                continue

            body = f"Reminder: '{event.title}' is scheduled for {event.date} at {event.location}.\n\n"
            body += f"Your registration status is: {reg.approval_status}."
            if reg.ticket_code:
                body += f"\nTicket code: {reg.ticket_code}."
            if reg.payment_status in ("paid", "confirmed"):
                body += "\nYour payment has been received."
            else:
                body += "\nIf payment is still pending, please complete it as soon as possible."
            body += "\n\nSee you there!"

            send_email(
                reg.email,
                f"Reminder: {event.title}",
                body,
                event_id=event.id
            )
            sent += 1

        return jsonify({
            "message": "Reminder emails sent",
            "sent": sent,
            "skipped": skipped
        })
    finally:
        db.close()


@app.post("/api/events")
def create_event():
    db = SessionLocal()
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get("title") or not data.get("owner_id"):
            return jsonify({"message": "Title and owner_id are required"}), 400
        
        # Verify owner exists
        owner = db.query(User).filter(User.id == data["owner_id"]).first()
        if not owner:
            return jsonify({"message": "Owner not found"}), 404
        
        # Create event
        event = Event(
            title=data["title"],
            description=data.get("description", ""),
            location=data.get("location", ""),
            date=data.get("date", ""),
            price=data.get("price", 0),
            owner_id=data["owner_id"],
            visibility=data.get("visibility", "public"),
            payment_phone=data.get("payment_phone"),
            payment_qr_filename=data.get("payment_qr_filename")
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return jsonify({"message": "created", "event_id": event.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Event creation failed: {str(e)}"}), 500
    finally:
        db.close()


@app.delete("/api/events/<int:event_id>")
def delete_event(event_id):
    db = SessionLocal()
    try:
        data = request.get_json()
        owner_id = data.get("owner_id")
        if not owner_id:
            return jsonify({"message": "owner_id required"}), 400
        
        event = db.query(Event).filter(Event.id == event_id, Event.owner_id == owner_id).first()
        if not event:
            return jsonify({"message": "Event not found or not owned by you"}), 404
        
        # Delete related registrations and email logs
        db.query(Registration).filter(Registration.event_id == event_id).delete()
        db.query(EmailLog).filter(EmailLog.event_id == event_id).delete()
        
        db.delete(event)
        db.commit()
        
        return jsonify({"message": "Event deleted"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Delete failed: {str(e)}"}), 500
    finally:
        db.close()


@app.put("/api/events/<int:event_id>")
def update_event(event_id):
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        owner_id = data.get("owner_id")
        if not owner_id:
            return jsonify({"message": "owner_id required"}), 400

        event = db.query(Event).filter(Event.id == event_id, Event.owner_id == owner_id).first()
        if not event:
            return jsonify({"message": "Event not found or not owned by you"}), 404

        # Update allowed fields
        event.title = data.get("title", event.title)
        event.description = data.get("description", event.description)
        event.location = data.get("location", event.location)
        event.date = data.get("date", event.date)
        event.price = data.get("price", event.price)
        event.visibility = data.get("visibility", event.visibility)
        event.payment_phone = data.get("payment_phone", event.payment_phone)
        event.payment_qr_filename = data.get("payment_qr_filename", event.payment_qr_filename)

        db.commit()
        db.refresh(event)

        return jsonify({
            "message": "updated",
            "event": {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "location": event.location,
                "date": event.date,
                "price": event.price,
                "owner_id": event.owner_id,
                "visibility": event.visibility
            }
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Update failed: {str(e)}"}), 500
    finally:
        db.close()


@app.post('/api/upload')
def upload_file():
    file = request.files.get('file')
    if not file:
        return jsonify({"message": "No file provided"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)

    return jsonify({"filename": filename, "url": f"/uploads/{filename}"}), 201

# ======================
# PAYMENT INFO
# ======================

@app.get("/api/payment-info")
def payment_info():
    text = f"Send to {PAYMENT_NUMBER}"
    qr = generate_qr(text)

    return jsonify({
        "payment_number": PAYMENT_NUMBER,
        "payment_qr_data": qr,
        "number": PAYMENT_NUMBER,
        "qr": qr
    })

@app.get("/api/events/<int:event_id>/ai-suggestions")
def event_ai_suggestions(event_id):
    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404

        suggestions = generate_ai_suggestions(event)
        ai_response = call_openai_for_suggestions(event)
        if ai_response and ai_response.get("openai"):
            suggestions["openai_suggestion"] = ai_response["openai"]

        participant_count = db.query(Registration).filter(Registration.event_id == event_id).count()

        return jsonify({
            "event_id": event.id,
            "event_title": event.title,
            "participant_count": participant_count,
            "suggestions": suggestions
        })
    finally:
        db.close()

@app.post("/api/ai/generate-description")
def generate_event_description():
    """Generate AI-powered event descriptions based on event name"""
    if not GROQ_API_KEY and not OPENAI_API_KEY:
        return jsonify({
            "error": "AI service not configured",
            "message": "Please configure GROQ_API_KEY in .env file (recommended - free tier) or OPENAI_API_KEY",
            "help": "Free option: Sign up at https://console.groq.com/ and get your API key"
        }), 503
    
    data = request.get_json() or {}
    event_name = data.get("event_name", "").strip()
    
    if not event_name:
        return jsonify({"message": "Event name is required"}), 400
    
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a creative event description writer. Generate engaging, brief event descriptions for student campus events. Keep descriptions under 200 words. Make them friendly, student-focused, and compelling."
            },
            {
                "role": "user",
                "content": f"Generate 3 different event descriptions for an event called '{event_name}'. Format as numbered list."
            }
        ]
        
        result = call_ai_api(messages, max_tokens=500)
        if result:
            return jsonify({"descriptions": result["response"]}), 200
        else:
            return jsonify({"error": "AI service error", "message": "Failed to generate descriptions"}), 502
    except Exception as e:
        print(f"AI description generation error: {str(e)}")
        return jsonify({"error": "Failed to generate descriptions", "message": str(e)}), 500

@app.post("/api/ai/chat")
def ai_chatbot():
    """AI-powered event chatbot for answering questions"""
    if not GROQ_API_KEY and not OPENAI_API_KEY:
        return jsonify({
            "error": "AI service not configured",
            "message": "Please configure GROQ_API_KEY in .env file (recommended - free tier) or OPENAI_API_KEY",
            "help": "Free option: Sign up at https://console.groq.com/ and get your API key"
        }), 503
    
    data = request.get_json() or {}
    user_message = data.get("message", "").strip()
    
    if not user_message:
        return jsonify({"message": "Message is required"}), 400
    
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a helpful campus events assistant. Answer questions about planning events, managing schedules, organizing club activities, and campus life. Keep responses concise and friendly."
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
        
        result = call_ai_api(messages, max_tokens=300)
        if result:
            return jsonify({"response": result["response"]}), 200
        else:
            return jsonify({"error": "AI service error", "message": "Failed to process your message"}), 502
    except Exception as e:
        print(f"Chatbot error: {str(e)}")
        return jsonify({"error": "Failed to process your message", "message": str(e)}), 500

@app.get("/api/stripe-config")
def stripe_config():
    return jsonify({
        "publishableKey": STRIPE_PUBLISHABLE_KEY,
        "enabled": bool(STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY)
    })

@app.post("/api/create-checkout-session")
def create_checkout_session():
    if not STRIPE_SECRET_KEY or not STRIPE_PUBLISHABLE_KEY:
        return jsonify({"message": "Stripe is not configured on the server."}), 500

    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = data.get("email")
    event_id = data.get("event_id")

    if not full_name or not email or not event_id:
        return jsonify({"message": "Full name, email, and event ID are required."}), 400

    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == int(event_id)).first()
        if not event:
            return jsonify({"message": "Event not found."}), 404

        if event.price is None or event.price <= 0:
            return jsonify({"message": "Stripe checkout is only available for paid events."}), 400

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            customer_email=email,
            line_items=[{
                "price_data": {
                    "currency": "php",
                    "product_data": {
                        "name": event.title,
                        "description": event.description[:120]
                    },
                    "unit_amount": int(event.price * 100)
                },
                "quantity": 1
            }],
            metadata={
                "event_id": str(event.id),
                "full_name": full_name,
                "email": email,
                "payment_method": "Stripe"
            },
            success_url=f"{FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/register/{event.id}?canceled=true"
        )

        return jsonify({"sessionId": session.id}), 200
    except Exception as e:
        return jsonify({"message": f"Could not create Stripe checkout session: {str(e)}"}), 500
    finally:
        db.close()

@app.post("/api/complete-stripe-checkout")
def complete_stripe_checkout():
    if not STRIPE_SECRET_KEY:
        return jsonify({"message": "Stripe is not configured on the server."}), 500

    data = request.get_json() or {}
    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"message": "Missing session_id."}), 400

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        return jsonify({"message": f"Stripe session retrieval failed: {str(e)}"}), 400

    if session.payment_status != "paid":
        return jsonify({"message": "Payment has not been completed."}), 400

    metadata = session.metadata or {}
    event_id = int(metadata.get("event_id", 0))
    full_name = metadata.get("full_name")
    email = metadata.get("email")
    payment_method = metadata.get("payment_method", "Stripe")

    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return jsonify({"message": "Event not found."}), 404

        registration = db.query(Registration).filter(
            Registration.event_id == event_id,
            Registration.email == email,
            Registration.payment_method == payment_method
        ).first()

        if registration and registration.approval_status == "approved":
            return jsonify({"message": "Registration already completed.", "ticket_code": registration.ticket_code}), 200

        if not registration:
            registration = Registration(
                full_name=full_name,
                email=email,
                event_id=event_id,
                payment_method=payment_method,
                payment_status="paid",
                approval_status="approved",
                payment_date=str(datetime.now()),
                receipt_number=generate_code("RCPT"),
                ticket_code=generate_code("TICKET")
            )
            registration.ticket_qr_data = generate_qr(registration.ticket_code)
            db.add(registration)
        else:
            registration.payment_status = "paid"
            registration.approval_status = "approved"
            registration.payment_date = str(datetime.now())
            if not registration.receipt_number:
                registration.receipt_number = generate_code("RCPT")
            if not registration.ticket_code:
                registration.ticket_code = generate_code("TICKET")
            if not registration.ticket_qr_data:
                registration.ticket_qr_data = generate_qr(registration.ticket_code)

        db.commit()

        send_email(
            email,
            "Stripe Payment Confirmed",
            f"Your payment for '{event.title}' has been received.\n\nTicket code: {registration.ticket_code}\nReceipt number: {registration.receipt_number}\n\nPlease present this code at the event.",
            event_id=event.id
        )

        return jsonify({
            "message": "Payment confirmed and registration completed.",
            "ticket_code": registration.ticket_code
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Stripe checkout completion failed: {str(e)}"}), 500
    finally:
        db.close()

# ======================
# REGISTER
# ======================

@app.post("/api/register")
def register():
    db = SessionLocal()
    try:
        full_name = request.form.get("full_name")
        email = request.form.get("email")
        event_id = request.form.get("event_id")
        method = request.form.get("payment_method")
        reference = request.form.get("reference_number")
        file = request.files.get("screenshot")
        
        # Validate required fields
        if not full_name or not email or not event_id:
            return jsonify({"message": "Full name, email, and event ID are required"}), 400

        # Validate email format
        if not is_valid_email(email):
            return jsonify({"message": "Invalid email address"}), 400
        
        # Verify event exists
        event_id_int = int(event_id) if event_id else None
        event = db.query(Event).filter(Event.id == event_id_int).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        
        # Check for duplicate registration
        if db.query(Registration).filter(
            Registration.email == email,
            Registration.event_id == event_id_int
        ).first():
            return jsonify({"message": "You already registered for this event."}), 400

        filename = None
        
        # Validate payment method
        if method != "Cash":
            if not reference or not file:
                return jsonify({"message": "Reference number and payment proof required for non-cash payments"}), 400
            
            filename = file.filename
            file.save(os.path.join(UPLOAD_FOLDER, filename))
        
        # Create registration
        reg = Registration(
            full_name=full_name,
            email=email,
            event_id=int(event_id) if event_id else None,
            payment_method=method,
            reference_number=reference,
            payment_date=str(datetime.now()),
            screenshot_filename=filename
        )
        
        db.add(reg)
        db.commit()
        
        # Send confirmation email
        send_email(
            email,
            "Registration Submitted",
            f"Your registration for '{event.title}' is submitted and waiting for admin approval.",
            event_id=int(event_id) if event_id else None
        )
        
        return jsonify({"message": "Submitted"}), 201
    except ValueError:
        return jsonify({"message": "Invalid event ID"}), 400
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Registration failed: {str(e)}"}), 500
    finally:
        db.close()

# ======================
# ADMIN
# ======================

@app.get("/api/participants/<int:event_id>/<int:user_id>")
def participants(event_id, user_id):
    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404

        regs = db.query(Registration).filter(Registration.event_id == event_id).all()
        return jsonify([{
            "id": r.id,
            "full_name": r.full_name,
            "email": r.email,
            "payment_method": r.payment_method,
            "payment_status": r.payment_status,
            "approval_status": r.approval_status,
            "reference_number": r.reference_number,
            "payment_date": r.payment_date,
            "screenshot_filename": r.screenshot_filename,
            "receipt_number": r.receipt_number,
            "ticket_code": r.ticket_code,
            "ticket_qr_data": r.ticket_qr_data,
            "attended": r.attended,
            "event_id": event.id,
            "event_title": event.title,
            "event_date": event.date,
            "event_location": event.location
        } for r in regs])
    finally:
        db.close()


@app.get("/api/my-registrations")
def my_registrations():
    db = SessionLocal()
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"message": "Email query parameter is required"}), 400
        
        regs = db.query(Registration).filter(Registration.email == email).all()
        
        results = []
        for reg in regs:
            event = db.query(Event).filter(Event.id == reg.event_id).first()
            results.append({
                "id": reg.id,
                "full_name": reg.full_name,
                "email": reg.email,
                "event_id": reg.event_id,
                "payment_method": reg.payment_method,
                "payment_status": reg.payment_status,
                "approval_status": reg.approval_status,
                "receipt_number": reg.receipt_number,
                "ticket_code": reg.ticket_code,
                "ticket_qr_data": reg.ticket_qr_data,
                "attended": reg.attended,
                "event": {
                    "id": event.id,
                    "title": event.title,
                    "date": event.date,
                    "location": event.location
                } if event else None
            })
        
        return jsonify(results), 200
    finally:
        db.close()


@app.get("/api/email-logs/<int:user_id>")
def email_logs(user_id):
    db = SessionLocal()
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        logs = db.query(EmailLog).join(Event, EmailLog.event_id == Event.id).filter(Event.owner_id == user_id).all()
        
        return jsonify([{
            "id": log.id,
            "recipient": log.recipient,
            "subject": log.subject,
            "body": log.body,
            "status": log.status,
            "event_id": log.event_id,
            "event_title": (db.query(Event).filter(Event.id == log.event_id).first().title if log.event_id and db.query(Event).filter(Event.id == log.event_id).first() else None),
            "created_at": log.created_at
        } for log in logs]), 200
    finally:
        db.close()


@app.get("/api/notifications")
def notifications():
    db = SessionLocal()
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"message": "Email query parameter is required"}), 400

        notes = db.query(Notification).filter(Notification.recipient_email == email).order_by(Notification.id.desc()).all()
        return jsonify([{
            "id": note.id,
            "title": note.title,
            "message": note.message,
            "type": note.type,
            "event_id": note.event_id,
            "registration_id": note.registration_id,
            "is_read": note.is_read,
            "created_at": note.created_at
        } for note in notes]), 200
    finally:
        db.close()


@app.post("/api/send-test-email/<int:user_id>/<int:event_id>")
def send_test_email(user_id, event_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"message": "User not found"}), 404

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        if event.owner_id != user_id:
            return jsonify({"message": "You are not allowed to send test emails for this event"}), 403

        data = request.get_json() or {}
        to_email = data.get("to_email") or user.email
        subject = data.get("subject") or f"[Test] Notification for {event.title}"
        body = data.get("body") or f"This is a test email for the event '{event.title}'."

        status = send_email(to_email, subject, body, event_id=event.id)

        return jsonify({"message": "Test email queued", "status": status, "recipient": to_email}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to send test email: {e}"}), 500
    finally:
        db.close()


@app.post("/api/approve/<int:id>/<int:user_id>")
def approve(id, user_id):
    db = SessionLocal()
    try:
        reg = db.query(Registration).filter(Registration.id == id).first()
        if not reg:
            return jsonify({"message": "Registration not found"}), 404

        event = db.query(Event).filter(Event.id == reg.event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        if event.owner_id != user_id:
            return jsonify({"message": "You are not allowed to approve this registration"}), 403

        reg.approval_status = "approved"
        reg.payment_status = "paid"
        reg.receipt_number = generate_code("RCPT")
        reg.ticket_code = generate_code("TICKET")
        reg.ticket_qr_data = generate_qr(reg.ticket_code)

        db.commit()

        email_status = send_email(
            reg.email,
            "Registration Approved",
            f"Your registration for '{event.title}' has been approved.\n\nTicket code: {reg.ticket_code}\nReceipt number: {reg.receipt_number}\n\nPlease bring this ticket code to the event.",
            event_id=event.id
        )

        create_notification(
            db,
            recipient_email=reg.email,
            title="Registration Approved",
            message=f"Your registration for '{event.title}' has been approved. Ticket code: {reg.ticket_code}.",
            type="approval",
            event_id=event.id,
            registration_id=reg.id
        )

        return jsonify({
            "message": "Approved",
            "email_status": email_status,
            "recipient": reg.email
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Approval failed: {str(e)}"}), 500
    finally:
        db.close()


@app.post("/api/confirm-payment/<int:id>/<int:user_id>")
def confirm_payment(id, user_id):
    db = SessionLocal()
    try:
        reg = db.query(Registration).filter(Registration.id == id).first()
        if not reg:
            return jsonify({"message": "Registration not found"}), 404

        event = db.query(Event).filter(Event.id == reg.event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        if event.owner_id != user_id:
            return jsonify({"message": "You are not allowed to confirm this payment"}), 403

        if reg.payment_status in ("confirmed", "paid"):
            return jsonify({"message": "Payment is already confirmed."}), 400

        reg.payment_status = "confirmed"
        db.commit()

        email_status = send_email(
            reg.email,
            "Payment Confirmed",
            f"Your payment for '{event.title}' has been confirmed. Your registration is now awaiting final approval.",
            event_id=event.id
        )

        create_notification(
            db,
            recipient_email=reg.email,
            title="Payment Confirmed",
            message=f"Your payment for '{event.title}' has been confirmed. Your registration is now awaiting final approval.",
            type="payment",
            event_id=event.id,
            registration_id=reg.id
        )

        return jsonify({
            "message": "Payment confirmed",
            "email_status": email_status,
            "recipient": reg.email
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Confirmation failed: {str(e)}"}), 500
    finally:
        db.close()


@app.post("/api/reject/<int:id>/<int:user_id>")
def reject(id, user_id):
    db = SessionLocal()
    try:
        reg = db.query(Registration).filter(Registration.id == id).first()
        if not reg:
            return jsonify({"message": "Registration not found"}), 404

        event = db.query(Event).filter(Event.id == reg.event_id).first()
        if not event:
            return jsonify({"message": "Event not found"}), 404
        if event.owner_id != user_id:
            return jsonify({"message": "You are not allowed to reject this registration"}), 403

        reg.approval_status = "rejected"
        db.commit()

        email_status = send_email(
            reg.email,
            "Registration Rejected",
            f"We are sorry to inform you that your registration for '{event.title}' has been rejected.\n\nIf you have questions, please contact the event organizer.",
            event_id=event.id
        )

        create_notification(
            db,
            recipient_email=reg.email,
            title="Registration Rejected",
            message=f"Your registration for '{event.title}' has been rejected. Please contact the organizer if you have questions.",
            type="rejection",
            event_id=event.id,
            registration_id=reg.id
        )

        return jsonify({
            "message": "Rejected",
            "email_status": email_status,
            "recipient": reg.email
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Rejection failed: {str(e)}"}), 500
    finally:
        db.close()

# ======================
# CHECK-IN
# ======================

@app.post("/api/check-in")
def check_in():
    db = SessionLocal()
    try:
        data = request.get_json()
        code = data.get("ticket_code")
        
        if not code:
            return jsonify({"message": "Ticket code is required"}), 400
        
        reg = db.query(Registration).filter(Registration.ticket_code == code).first()
        
        if not reg:
            return jsonify({"message": "Invalid ticket"}), 404
        
        if reg.attended:
            return jsonify({"message": "Already checked in"}), 400
        
        reg.attended = True
        db.commit()
        
        return jsonify({"message": "Checked in"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Check-in failed: {str(e)}"}), 500
    finally:
        db.close()

# ======================
# FILES
# ======================

@app.get("/uploads/<filename>")
def get_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ======================

if __name__ == "__main__":
    app.run(debug=True)


