from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.models import User

db = SessionLocal()
try:
    admin_user = db.query(User).filter(User.rut == "1-9").first()
    if admin_user:
        admin_user.password_hash = get_password_hash("Admin123!")
        print("Updated Admin password to 'Admin123!'")

    coach_user = db.query(User).filter(User.rut == "2-7").first()
    if coach_user:
        coach_user.password_hash = get_password_hash("Coach123!")
        print("Updated Coach password to 'Coach123!'")

    db.commit()
    print("Default seed users ready:")
    print("Admin: RUT: 1-9 | Pass: Admin123!")
    print("Coach: RUT: 2-7 | Pass: Coach123!")
finally:
    db.close()
