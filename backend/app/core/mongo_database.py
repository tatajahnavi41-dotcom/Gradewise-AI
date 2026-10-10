import os
import re
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

_cached_mongo_client: Optional[MongoClient] = None
_cached_uri: Optional[str] = None

def get_active_mongo_uri() -> str:
    # Always reload env to catch runtime .env modifications
    load_dotenv(override=True)
    uri = (
        os.getenv("MONGODB_URI") or 
        os.getenv("DB_URL") or 
        os.getenv("MONGODB_URL") or 
        "mongodb+srv://tatajahnavi41_db_user:txdXLTbumxvQk6Qf@cluster0.jukaa2w.mongodb.net/?appName=Cluster0"
    )
    return uri.strip()

def get_mongo_client() -> Optional[MongoClient]:
    global _cached_mongo_client, _cached_uri
    current_uri = get_active_mongo_uri()

    # Reconnect if client not created or URI changed
    if _cached_mongo_client is None or _cached_uri != current_uri:
        try:
            if current_uri:
                _cached_mongo_client = MongoClient(
                    current_uri,
                    serverSelectionTimeoutMS=8000,
                    connectTimeoutMS=8000,
                    tlsAllowInvalidCertificates=True
                )
                _cached_uri = current_uri
                print(f"[MongoDB Atlas] Client successfully initialized for active cluster.")
        except Exception as e:
            print(f"[MongoDB Atlas] Connection initialization warning: {e}")
            _cached_mongo_client = None
    return _cached_mongo_client

def get_mongo_db() -> Optional[Database]:
    client = get_mongo_client()
    if client:
        try:
            db_name = os.getenv("MONGODB_DB_NAME", "campusiq").strip()
            return client[db_name]
        except Exception as e:
            print(f"[MongoDB Atlas] Error accessing database: {e}")
            return None
    return None

def ping_mongo() -> Dict[str, Any]:
    client = get_mongo_client()
    if not client:
        return {"status": "disconnected", "error": "No MongoClient initialized", "healthy": False}
    try:
        client.admin.command('ping')
        db = get_mongo_db()
        collections = db.list_collection_names() if db is not None else []
        
        active_uri = get_active_mongo_uri()
        masked_uri = re.sub(r'//[^:]+:[^@]+@', '//***:***@', active_uri) if active_uri else ""
        
        return {
            "status": "connected",
            "cluster_uri": masked_uri,
            "database": os.getenv("MONGODB_DB_NAME", "campusiq"),
            "collections": collections,
            "healthy": True
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "healthy": False}

def upsert_document(collection_name: str, doc_id: Any, data: Dict[str, Any]) -> bool:
    """
    Inserts or updates a single document in a MongoDB Atlas collection by _id.
    """
    db = get_mongo_db()
    if db is None:
        print(f"[MongoDB Atlas] Cannot upsert to {collection_name}: Database not connected.")
        return False
    try:
        data_to_save = dict(data)
        data_to_save["_id"] = doc_id
        db[collection_name].replace_one({"_id": doc_id}, data_to_save, upsert=True)
        print(f"[MongoDB Atlas] Successfully saved document {doc_id} to collection '{collection_name}'.")
        return True
    except Exception as e:
        print(f"[MongoDB Atlas] Error saving document to collection '{collection_name}': {e}")
        return False

def sync_data_to_mongo(db_session) -> Dict[str, Any]:
    """
    Synchronizes platform records (Students, Staff, Users, Tasks, Submissions, Interventions)
    from SQLAlchemy into MongoDB Atlas collections.
    """
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return {"success": False, "message": "MongoDB Atlas connection not available"}

    from app.models.models import Student, Staff, User, Task, TaskSubmission, Intervention

    counts = {}
    try:
        # 1. Sync Students
        students = db_session.query(Student).all()
        mongo_db.students.drop()
        if students:
            st_docs = []
            for s in students:
                st_docs.append({
                    "_id": s.student_id,
                    "student_id": s.student_id,
                    "name": s.name,
                    "email": s.email,
                    "branch": s.branch,
                    "year": s.year,
                    "semester": s.semester,
                    "cgpa": s.cgpa,
                    "academic_score": s.academic_score,
                    "attendance_pct": s.attendance_pct,
                    "lms_activity_score": s.lms_activity_score,
                    "engagement_score": s.engagement_score,
                    "placement_readiness_score": s.placement_readiness_score,
                    "skills_score": s.skills_score,
                    "success_score": s.success_score,
                    "comeback_score": s.comeback_score,
                    "risk_category": s.risk_category,
                    "career_goal": s.career_goal,
                    "learning_style": s.learning_style,
                    "study_hours": getattr(s, "study_hours", 16.5),
                    "phone": getattr(s, "phone", None),
                    "is_active": getattr(s, "is_active", True)
                })
            if st_docs:
                mongo_db.students.insert_many(st_docs)
            counts["students"] = len(st_docs)
        else:
            counts["students"] = 0

        # 2. Sync Staff / Faculty
        staff_members = db_session.query(Staff).all()
        mongo_db.staff.drop()
        if staff_members:
            staff_docs = []
            for stf in staff_members:
                staff_docs.append({
                    "_id": stf.staff_id,
                    "staff_id": stf.staff_id,
                    "name": stf.name,
                    "email": stf.email,
                    "department": stf.department,
                    "role_type": stf.role_type,
                    "designation": stf.designation,
                    "specialization": stf.specialization,
                    "assigned_branch": stf.assigned_branch,
                    "max_mentees": stf.max_mentees,
                    "current_mentees": stf.current_mentees,
                    "phone": getattr(stf, "phone", None),
                    "is_active": getattr(stf, "is_active", True)
                })
            if staff_docs:
                mongo_db.staff.insert_many(staff_docs)
            counts["staff"] = len(staff_docs)
        else:
            counts["staff"] = 0

        # 3. Sync Users
        users = db_session.query(User).all()
        mongo_db.users.drop()
        if users:
            user_docs = []
            for u in users:
                user_docs.append({
                    "_id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "role": u.role,
                    "name": u.name,
                    "student_id": u.student_id,
                    "staff_id": u.staff_id,
                    "branch": u.branch,
                    "designation": u.designation,
                    "phone": getattr(u, "phone", None),
                    "is_active": getattr(u, "is_active", True)
                })
            if user_docs:
                mongo_db.users.insert_many(user_docs)
            counts["users"] = len(user_docs)
        else:
            counts["users"] = 0

        # 4. Sync Tasks
        tasks = db_session.query(Task).all()
        mongo_db.tasks.drop()
        if tasks:
            task_docs = []
            for t in tasks:
                task_docs.append({
                    "_id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "subject_code": t.subject_code,
                    "subject_name": t.subject_name,
                    "branch": t.branch,
                    "year": t.year,
                    "faculty_id": t.faculty_id,
                    "faculty_name": t.faculty_name,
                    "due_date": t.due_date,
                    "points": t.points,
                    "status": t.status
                })
            if task_docs:
                mongo_db.tasks.insert_many(task_docs)
            counts["tasks"] = len(task_docs)
        else:
            counts["tasks"] = 0

        # 5. Sync Interventions
        interventions = db_session.query(Intervention).all()
        mongo_db.interventions.drop()
        if interventions:
            int_docs = []
            for item in interventions:
                int_docs.append({
                    "_id": item.id,
                    "student_id": item.student_id,
                    "concern": item.concern,
                    "action_plan": item.action_plan,
                    "assigned_faculty_id": item.assigned_faculty_id,
                    "due_date": item.due_date,
                    "status": item.status
                })
            if int_docs:
                mongo_db.interventions.insert_many(int_docs)
            counts["interventions"] = len(int_docs)
        else:
            counts["interventions"] = 0

        db_name = os.getenv("MONGODB_DB_NAME", "campusiq").strip()
        print(f"[MongoDB Atlas] Synced platform state to database '{db_name}': {counts}")
        return {
            "success": True,
            "message": "Platform data successfully synchronized to MongoDB Atlas!",
            "database": db_name,
            "synced_counts": counts
        }
    except Exception as e:
        print(f"[MongoDB Atlas] Sync error: {e}")
        return {"success": False, "error": str(e)}
