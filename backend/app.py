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

from flask import Flask, request, jsonify, send_from_directory
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
from io import BytesIO
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)
load_dotenv()
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


def send_email(to_email, subject, body, event_id=None):
    status = "sent"
    db = SessionLocal()

    try:
        if EMAIL_ADDRESS == "your_email@gmail.com" or EMAIL_PASSWORD == "your_app_password":
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


