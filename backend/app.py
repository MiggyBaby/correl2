from flask import Flask, request, jsonify, send_from_directory
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
import os
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app)

# ======================
# CONFIG
# ======================

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

PAYMENT_NUMBER = "09222333123"

EMAIL_ADDRESS = "your_email@gmail.com"
EMAIL_PASSWORD = "your_app_password"

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


def send_email(to_email, subject, body):
    try:
        if EMAIL_ADDRESS == "your_email@gmail.com":
            print("Email skipped (configure credentials)")
            return

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())

    except Exception as e:
        print("Email error:", e)

# ======================
# AUTH
# ======================

@app.post("/api/signup")
def signup():
    data = request.get_json()
    db = SessionLocal()

    if db.query(User).filter(User.email == data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

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
    })


@app.post("/api/login")
def login():
    data = request.get_json()
    db = SessionLocal()

    user = db.query(User).filter(User.email == data["email"]).first()

    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    return jsonify({
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    })

# ======================
# EVENTS
# ======================

@app.get("/api/events")
def public_events():
    db = SessionLocal()
    events = db.query(Event).filter(Event.visibility == "public").all()

    return jsonify([{
        "id": e.id,
        "title": e.title,
        "description": e.description,
        "location": e.location,
        "date": e.date,
        "price": e.price
    } for e in events])


@app.get("/api/admin/events/<int:user_id>")
def my_events(user_id):
    db = SessionLocal()
    events = db.query(Event).filter(Event.owner_id == user_id).all()

    return jsonify([{
        "id": e.id,
        "title": e.title,
        "location": e.location,
        "date": e.date,
        "price": e.price,
        "visibility": e.visibility
    } for e in events])


@app.post("/api/events")
def create_event():
    data = request.get_json()
    db = SessionLocal()

    event = Event(
        title=data["title"],
        description=data["description"],
        location=data["location"],
        date=data["date"],
        price=data["price"],
        owner_id=data.get("owner_id"),
        visibility=data.get("visibility", "public")
    )

    db.add(event)
    db.commit()

    return jsonify({"message": "created"})

# ======================
# PAYMENT INFO
# ======================

@app.get("/api/payment-info")
def payment_info():
    text = f"Send to {PAYMENT_NUMBER}"
    qr = generate_qr(text)

    return jsonify({
        "number": PAYMENT_NUMBER,
        "qr": qr
    })

# ======================
# REGISTER
# ======================

@app.post("/api/register")
def register():
    full_name = request.form.get("full_name")
    email = request.form.get("email")
    event_id = request.form.get("event_id")
    method = request.form.get("payment_method")
    reference = request.form.get("reference_number")
    file = request.files.get("screenshot")

    db = SessionLocal()

    filename = None

    if method != "Cash":
        if not reference or not file:
            return jsonify({"message": "Need proof"}), 400

        filename = file.filename
        file.save(os.path.join(UPLOAD_FOLDER, filename))

    reg = Registration(
        full_name=full_name,
        email=email,
        event_id=event_id,
        payment_method=method,
        reference_number=reference,
        payment_date=str(datetime.now()),
        screenshot_filename=filename
    )

    db.add(reg)
    db.commit()

    send_email(email, "Registration Submitted", "Waiting for approval")

    return jsonify({"message": "Submitted"})

# ======================
# ADMIN
# ======================

@app.get("/api/participants/<int:event_id>/<int:user_id>")
def participants(event_id, user_id):
    db = SessionLocal()
    regs = db.query(Registration).filter(Registration.event_id == event_id).all()

    return jsonify([r.__dict__ for r in regs])


@app.post("/api/approve/<int:id>/<int:user_id>")
def approve(id, user_id):
    db = SessionLocal()

    reg = db.query(Registration).filter(Registration.id == id).first()

    reg.approval_status = "approved"
    reg.payment_status = "paid"
    reg.receipt_number = generate_code("RCPT")
    reg.ticket_code = generate_code("TICKET")
    reg.ticket_qr_data = generate_qr(reg.ticket_code)

    db.commit()

    return jsonify({"message": "Approved"})


@app.post("/api/reject/<int:id>/<int:user_id>")
def reject(id, user_id):
    db = SessionLocal()

    reg = db.query(Registration).filter(Registration.id == id).first()
    reg.approval_status = "rejected"

    db.commit()

    return jsonify({"message": "Rejected"})

# ======================
# CHECK-IN
# ======================

@app.post("/api/check-in")
def check_in():
    data = request.get_json()
    code = data.get("ticket_code")

    db = SessionLocal()

    reg = db.query(Registration).filter(Registration.ticket_code == code).first()

    if not reg:
        return jsonify({"message": "Invalid ticket"}), 404

    if reg.attended:
        return jsonify({"message": "Already checked in"}), 400

    reg.attended = True
    db.commit()

    return jsonify({"message": "Checked in"})

# ======================
# FILES
# ======================

@app.get("/uploads/<filename>")
def get_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ======================

if __name__ == "__main__":
    app.run(debug=True)


