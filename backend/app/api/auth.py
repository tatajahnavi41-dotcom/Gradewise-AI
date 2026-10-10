import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, decode_access_token, hash_password
from app.models.models import User, Student, Staff
from app.services.scoring_engine import calculate_student_success_score

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class StudentSignupRequest(BaseModel):
    name: str
    email: str
    username: Optional[str] = None
    password: str
    student_id: str
    branch: str
    year: int
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    attendance_pct: Optional[float] = None
    phone: Optional[str] = None
    career_goal: Optional[str] = "Software Developer"
    learning_style: Optional[str] = "Visual & Practical"

class FacultySignupRequest(BaseModel):
    name: str
    email: str
    username: Optional[str] = None
    password: str
    staff_id: str
    department: str
    designation: str
    specialization: Optional[str] = None
    phone: Optional[str] = None

class VerifyRoleRequest(BaseModel):
    selected_role: str

class ForgotPasswordRequest(BaseModel):
    identifier: str

class ResetPasswordRequest(BaseModel):
    identifier: str
    reset_code: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    career_goal: Optional[str] = None
    learning_style: Optional[str] = None
    specialization: Optional[str] = None
    designation: Optional[str] = None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Token payload invalid")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Please contact Administrator.")
    return user

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Support login with either username or email
    user = db.query(User).filter(
        (User.username == request.username) | (User.email == request.username)
    ).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password. Please verify your credentials."
        )
        
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated by the administrator."
        )
        
    # Server-side verification if role was supplied explicitly
    if request.role and request.role.lower() != user.role.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Account role is '{user.role.title()}', but '{request.role.title()}' portal was selected."
        )
        
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id}
    )
    
    user_info = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "student_id": user.student_id,
        "staff_id": user.staff_id,
        "branch": user.branch,
        "designation": user.designation,
        "avatar": user.avatar,
        "phone": getattr(user, "phone", None),
        "bio": getattr(user, "bio", None),
        "is_active": getattr(user, "is_active", True)
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

@router.post("/signup/student", response_model=LoginResponse)
def signup_student(req: StudentSignupRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    uname_clean = (req.username.strip() if req.username else email_clean.split("@")[0]).lower()
    sid_clean = req.student_id.strip().upper()

    # Check for existing email or username or student ID
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
        
    if db.query(User).filter(User.username == uname_clean).first():
        uname_clean = f"{uname_clean}_{secrets.token_hex(2)}"
        
    if db.query(Student).filter(Student.student_id == sid_clean).first():
        raise HTTPException(status_code=400, detail=f"Student ID '{sid_clean}' is already registered.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    semester_val = req.semester if req.semester else (req.year * 2 - 1)

    # Determine starting indicators from registration inputs or clean zero baseline
    init_cgpa = float(req.cgpa) if req.cgpa is not None else 0.0
    init_attendance = float(req.attendance_pct) if req.attendance_pct is not None else 0.0
    init_academic = round(init_cgpa * 10.0, 1) if init_cgpa > 0 else 0.0
    init_lms = 0.0
    init_engagement = 0.0
    init_placement = round(init_academic * 0.8, 1) if init_academic > 0 else 0.0
    init_skills = 0.0

    if init_academic > 0 or init_attendance > 0:
        calc_res = calculate_student_success_score({
            "academic_score": init_academic,
            "attendance_pct": init_attendance,
            "lms_activity_score": init_lms,
            "engagement_score": init_engagement,
            "placement_readiness_score": init_placement,
            "skills_score": init_skills
        })
        init_success = calc_res["success_score"]
        init_risk = calc_res["risk_category"]
    else:
        init_success = 0.0
        init_risk = "PROVISIONAL"

    # Create Student record with individual user values
    student = Student(
        student_id=sid_clean,
        name=req.name.strip(),
        email=email_clean,
        branch=req.branch.strip().upper(),
        year=req.year,
        semester=semester_val,
        profile_status="Verified",
        phone=req.phone.strip() if req.phone else None,
        is_active=True,
        study_hours=0.0,
        cgpa=init_cgpa,
        academic_score=init_academic,
        attendance_pct=init_attendance,
        lms_activity_score=init_lms,
        engagement_score=init_engagement,
        placement_readiness_score=init_placement,
        skills_score=init_skills,
        success_score=init_success,
        risk_category=init_risk,
        career_goal=req.career_goal or "Software Developer",
        learning_style=req.learning_style or "Visual & Practical",
        growth_points=0,
        learning_streak=0
    )
    db.add(student)

    # Create User login record
    user = User(
        username=uname_clean,
        email=email_clean,
        hashed_password=hash_password(req.password),
        role="student",
        name=req.name.strip(),
        student_id=sid_clean,
        branch=req.branch.strip().upper(),
        phone=req.phone.strip() if req.phone else None,
        is_active=True,
        is_approved=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Direct & full sync to MongoDB Atlas
    try:
        from app.core.mongo_database import sync_data_to_mongo
        sync_data_to_mongo(db)
    except Exception as mongo_err:
        print(f"[MongoDB Atlas Sync Error on Student Signup]: {mongo_err}")

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "student_id": user.student_id,
            "branch": user.branch,
            "phone": user.phone,
            "is_active": True
        }
    }

@router.post("/signup/faculty", response_model=LoginResponse)
def signup_faculty(req: FacultySignupRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    uname_clean = (req.username.strip() if req.username else email_clean.split("@")[0]).lower()
    fid_clean = req.staff_id.strip().upper()

    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
        
    if db.query(User).filter(User.username == uname_clean).first():
        uname_clean = f"{uname_clean}_{secrets.token_hex(2)}"
        
    if db.query(Staff).filter(Staff.staff_id == fid_clean).first():
        raise HTTPException(status_code=400, detail=f"Faculty Staff ID '{fid_clean}' is already registered.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    # Create Staff record
    staff = Staff(
        staff_id=fid_clean,
        name=req.name.strip(),
        email=email_clean,
        department=req.department.strip().upper(),
        role_type="teaching",
        designation=req.designation.strip(),
        specialization=req.specialization.strip() if req.specialization else None,
        assigned_branch=req.department.strip().upper(),
        assigned_subjects="[]",
        max_mentees=20,
        current_mentees=0,
        phone=req.phone.strip() if req.phone else None,
        is_active=True
    )
    db.add(staff)

    # Create User login record
    user = User(
        username=uname_clean,
        email=email_clean,
        hashed_password=hash_password(req.password),
        role="faculty",
        name=req.name.strip(),
        staff_id=fid_clean,
        branch=req.department.strip().upper(),
        designation=req.designation.strip(),
        phone=req.phone.strip() if req.phone else None,
        is_active=True,
        is_approved=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Direct & full sync to MongoDB Atlas
    try:
        from app.core.mongo_database import sync_data_to_mongo
        sync_data_to_mongo(db)
    except Exception as mongo_err:
        print(f"[MongoDB Atlas Sync Error on Faculty Signup]: {mongo_err}")

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "staff_id": user.staff_id,
            "branch": user.branch,
            "designation": user.designation,
            "phone": user.phone,
            "is_active": True
        }
    }

@router.post("/verify-role")
def verify_role(
    req: VerifyRoleRequest,
    current_user: User = Depends(get_current_user)
):
    selected = req.selected_role.lower().strip()
    actual = current_user.role.lower().strip()
    
    if selected != actual:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Your account role is '{actual.title()}'. You are not authorized to access the '{selected.title()}' portal."
        )
        
    return {
        "status": "authorized",
        "role": actual,
        "message": f"Successfully verified access to {actual.title()} portal."
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip()
    user = db.query(User).filter((User.email == ident) | (User.username == ident)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with the provided email or username."
        )
        
    reset_code = secrets.token_hex(3).upper() # 6 characters e.g. "A3F8B2"
    user.reset_token = reset_code
    user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.commit()
    
    return {
        "message": f"Password reset code generated. Use code '{reset_code}' to reset your password.",
        "reset_code": reset_code,
        "expires_in_minutes": 30
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip()
    user = db.query(User).filter((User.email == ident) | (User.username == ident)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    if not user.reset_token or user.reset_token != req.reset_code.strip():
        raise HTTPException(status_code=400, detail="Invalid password reset code.")
        
    if user.reset_token_expiry and user.reset_token_expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Password reset code has expired. Please request a new one.")
        
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    
    return {
        "message": "Password has been successfully reset. You can now sign in with your new password."
    }

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "name": current_user.name,
        "student_id": current_user.student_id,
        "staff_id": current_user.staff_id,
        "branch": current_user.branch,
        "designation": current_user.designation,
        "avatar": current_user.avatar,
        "phone": getattr(current_user, "phone", None),
        "bio": getattr(current_user, "bio", None),
        "is_active": getattr(current_user, "is_active", True)
    }
    
    if current_user.role == "student" and current_user.student_id:
        st = db.query(Student).filter(Student.student_id == current_user.student_id).first()
        if st:
            profile["student_details"] = {
                "cgpa": st.cgpa,
                "academic_score": st.academic_score,
                "attendance_pct": st.attendance_pct,
                "success_score": st.success_score,
                "class_rank": st.class_rank,
                "branch_rank": st.branch_rank,
                "branch": st.branch,
                "year": st.year,
                "semester": st.semester,
                "career_goal": st.career_goal,
                "learning_style": st.learning_style,
                "comeback_score": st.comeback_score,
                "learning_streak": st.learning_streak,
                "growth_points": st.growth_points,
                "study_hours": getattr(st, "study_hours", 16.5),
                "risk_category": st.risk_category,
                "assignments_completed": st.assignments_completed,
                "total_assignments": st.total_assignments,
                "phone": getattr(st, "phone", None),
                "bio": getattr(st, "bio", None)
            }
    elif current_user.role == "faculty" and current_user.staff_id:
        staff = db.query(Staff).filter(Staff.staff_id == current_user.staff_id).first()
        if staff:
            profile["staff_details"] = {
                "staff_id": staff.staff_id,
                "department": staff.department,
                "role_type": staff.role_type,
                "designation": staff.designation,
                "specialization": staff.specialization,
                "current_mentees": staff.current_mentees,
                "max_mentees": staff.max_mentees,
                "phone": getattr(staff, "phone", None),
                "bio": getattr(staff, "bio", None)
            }
            
    return profile

@router.put("/profile")
def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.name is not None and req.name.strip():
        current_user.name = req.name.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip()
    if req.bio is not None:
        current_user.bio = req.bio.strip()
    if req.avatar is not None:
        current_user.avatar = req.avatar.strip()
        
    # Sync with student profile if applicable
    if current_user.role == "student" and current_user.student_id:
        st = db.query(Student).filter(Student.student_id == current_user.student_id).first()
        if st:
            if req.name:
                st.name = current_user.name
            if req.phone is not None:
                st.phone = req.phone.strip()
            if req.bio is not None:
                st.bio = req.bio.strip()
            if req.career_goal:
                st.career_goal = req.career_goal.strip()
            if req.learning_style:
                st.learning_style = req.learning_style.strip()
                
    # Sync with staff profile if applicable
    elif current_user.role in ["faculty", "admin"] and current_user.staff_id:
        staff = db.query(Staff).filter(Staff.staff_id == current_user.staff_id).first()
        if staff:
            if req.name:
                staff.name = current_user.name
            if req.phone is not None:
                staff.phone = req.phone.strip()
            if req.bio is not None:
                staff.bio = req.bio.strip()
            if req.specialization:
                staff.specialization = req.specialization.strip()
            if req.designation:
                staff.designation = req.designation.strip()
                current_user.designation = req.designation.strip()

    db.commit()
    db.refresh(current_user)
    
    try:
        from app.core.mongo_database import sync_data_to_mongo
        sync_data_to_mongo(db)
    except Exception as mongo_err:
        print(f"[MongoDB Atlas Sync Error on Profile Update]: {mongo_err}")
    
    return {
        "message": "Profile successfully updated and synchronized",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "name": current_user.name,
            "student_id": current_user.student_id,
            "staff_id": current_user.staff_id,
            "branch": current_user.branch,
            "designation": current_user.designation,
            "avatar": current_user.avatar,
            "phone": getattr(current_user, "phone", None),
            "bio": getattr(current_user, "bio", None)
        }
    }

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match.")
        
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
        
    current_user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully."}
