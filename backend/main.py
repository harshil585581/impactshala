import os
import re
import uuid
import json
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI(title="Impactshaala API")


# Parse allowed origins
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://aliceblue-caribou-807028.hostingersite.com",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class IndividualSignup(BaseModel):
    first_name: str
    last_name: str
    dob: str
    email: str
    password: str
    interests: Optional[str] = None
    role: Optional[str] = None
    agreed_terms: bool


class OrgSignup(BaseModel):
    org_name: str
    org_type: str
    year_of_founding: Optional[str] = None
    website: Optional[str] = None
    contact_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    password: str
    agreed_terms: bool


class LoginRequest(BaseModel):
    email: str
    password: str


class DeleteAccountRequest(BaseModel):
    password: str


class DeactivateAccountRequest(BaseModel):
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    sign_out_all: bool = False


class ResendRequest(BaseModel):
    email: str


class ProfileUpdate(BaseModel):
    # Individual fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    languages: Optional[str] = None
    skills: Optional[List[str]] = None
    work_sector: Optional[str] = None
    work_industry: Optional[str] = None
    teach_subject: Optional[str] = None
    experience_years: Optional[str] = None
    entrepreneur_type: Optional[str] = None
    describe_as: Optional[str] = None
    education_level: Optional[str] = None
    institute_name: Optional[str] = None
    resume_url: Optional[str] = None

    # Shared fields
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[List[Any]] = None
    reach_for: Optional[List[str]] = None
    setup_complete: Optional[bool] = None

    # Organization fields
    org_name: Optional[str] = None
    sector: Optional[str] = None
    edu_levels_offered: Optional[List[str]] = None
    applicable_industries: Optional[List[str]] = None
    services: Optional[List[str]] = None
    industries: Optional[List[Any]] = None
    venue_types: Optional[List[str]] = None
    department_type: Optional[str] = None
    talent_types: Optional[List[str]] = None
    support_types: Optional[List[str]] = None

    # Settings
    mention_permission: Optional[str] = None
    review_permission: Optional[List[str]] = None
    community_visibility: Optional[str] = None


def get_user_id(authorization: str) -> str:
    """Extract and validate user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    try:
        user_resp = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not user_resp.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_resp.user.id


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/resend-verification")
async def resend_verification(data: ResendRequest):
    try:
        supabase.auth.resend({"type": "signup", "email": data.email})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Verification email resent"}


def _parse_user_agent(ua: str) -> tuple[str, str]:
    """Return (browser, os) from a User-Agent string."""
    u = ua.lower()
    if "edg/" in u or "edge/" in u:
        browser = "Edge"
    elif "chrome/" in u:
        browser = "Chrome"
    elif "firefox/" in u:
        browser = "Firefox"
    elif "safari/" in u:
        browser = "Safari"
    elif "opera/" in u or "opr/" in u:
        browser = "Opera"
    else:
        browser = "Unknown Browser"

    if "windows" in u:
        os_name = "Windows"
    elif "android" in u:
        os_name = "Android"
    elif "iphone" in u or "ipad" in u:
        os_name = "iOS"
    elif "mac os" in u:
        os_name = "Mac OS"
    elif "linux" in u:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"

    return browser, os_name


def _get_location(ip: str) -> str:
    """Return 'City, Region, Country' for an IP address using ip-api.com (free, no key)."""
    if not ip or ip in ("127.0.0.1", "::1"):
        return "Local"
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,city,regionName,country"
        with urllib.request.urlopen(url, timeout=2) as resp:
            data = json.loads(resp.read())
        if data.get("status") == "success":
            return ", ".join(p for p in [data.get("city"), data.get("regionName"), data.get("country")] if p)
    except Exception:
        pass
    return ip


@app.post("/api/login")
async def login(data: LoginRequest, request: Request):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not auth_response.user or not auth_response.session:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = auth_response.user.id

    profile = supabase_admin.table("users").select(
        "user_type, role, first_name, last_name, org_name, deactivated_at"
    ).eq("id", user_id).execute()

    profile_data = profile.data[0] if profile.data else {}

    deactivated_at_str = profile_data.get("deactivated_at")
    if deactivated_at_str:
        try:
            deactivated_at = datetime.fromisoformat(deactivated_at_str.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            if now - deactivated_at < timedelta(hours=24):
                raise HTTPException(
                    status_code=403,
                    detail="This account has been deactivated. You can log in and reactivate it after 24 hours of deactivation."
                )
            else:
                # Reactivate!
                supabase_admin.table("users").update({"deactivated_at": None}).eq("id", user_id).execute()
        except HTTPException:
            raise
        except Exception:
            pass

    # Record login session
    session_id = str(uuid.uuid4())
    ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (request.client.host if request.client else "")
    ua = request.headers.get("User-Agent", "")
    browser, os_name = _parse_user_agent(ua)
    location = _get_location(ip)
    try:
        supabase_admin.table("user_sessions").insert({
            "id": session_id,
            "user_id": user_id,
            "ip_address": ip,
            "browser": browser,
            "os": os_name,
            "location": location,
        }).execute()
    except Exception:
        pass  # session tracking is best-effort; don't fail login

    return {
        "message": "Login successful",
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "session_id": session_id,
        "user": {
            "id": user_id,
            "email": auth_response.user.email,
            "user_type": profile_data.get("user_type"),
            "role": profile_data.get("role"),
            "first_name": profile_data.get("first_name"),
            "last_name": profile_data.get("last_name"),
            "org_name": profile_data.get("org_name"),
        },
    }


@app.get("/api/sessions")
async def get_sessions(authorization: str = Header(None)):
    """Return all login sessions for the current user."""
    user_id = get_user_id(authorization)
    rows = supabase_admin.table("user_sessions").select(
        "id, ip_address, browser, os, location, created_at, last_seen_at"
    ).eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"sessions": rows.data or []}


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, authorization: str = Header(None)):
    """Delete a specific session (sign out from that device)."""
    user_id = get_user_id(authorization)
    supabase_admin.table("user_sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
    return {"ok": True}


@app.delete("/api/sessions")
async def delete_all_sessions(authorization: str = Header(None)):
    """Delete all sessions for the current user (sign out of all devices)."""
    user_id = get_user_id(authorization)
    supabase_admin.table("user_sessions").delete().eq("user_id", user_id).execute()
    return {"ok": True}


@app.post("/api/signup/individual")
async def signup_individual(data: IndividualSignup):
    if not data.agreed_terms:
        raise HTTPException(status_code=400, detail="Must agree to terms and conditions")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    try:
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = auth_response.user.id

    result = supabase_admin.table("users").insert({
        "id": user_id,
        "user_type": "individual",
        "email": data.email,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "dob": data.dob or None,
        "interests": data.interests,
        "role": data.role,
        "agreed_terms": data.agreed_terms,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create profile")

    return {
        "message": "Account created successfully",
        "id": user_id,
        "requires_confirmation": auth_response.session is None,
    }


@app.get("/api/profile")
async def get_profile(authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    result = supabase_admin.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]


@app.get("/api/profile/resume")
async def get_resume_url(authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    result = supabase_admin.table("users").select("resume_url").eq("id", user_id).execute()
    if not result.data or not result.data[0].get("resume_url"):
        raise HTTPException(status_code=404, detail="No resume uploaded")
    raw = result.data[0]["resume_url"]
    # Normalize: extract just the storage path within the bucket.
    # Stored value may be a bare path like "{uuid}/resume.pdf" or a full/signed
    # URL like "storage/v1/object/sign/documents/{uuid}/resume.pdf".
    bucket_marker = "/documents/"
    if bucket_marker in raw:
        path = raw.split(bucket_marker, 1)[1].split("?")[0]
    else:
        path = raw.split("?")[0]
    # Also fix the DB record so future requests are clean
    if path != raw:
        supabase_admin.table("users").update({"resume_url": path}).eq("id", user_id).execute()
    signed = supabase_admin.storage.from_("documents").create_signed_url(path, 3600)
    return {"url": signed.get("signedURL") or signed.get("signed_url") or ""}


@app.get("/api/profile/{user_id}")
async def get_public_profile(user_id: str, authorization: str = Header(None)):
    """Return a public profile for any user by ID (requires auth)."""
    caller_id = get_user_id(authorization)  # verify caller is logged in
    result = supabase_admin.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = result.data[0]
    if profile.get("deactivated_at") and user_id != caller_id:
        raise HTTPException(status_code=404, detail="Profile not found or deactivated")
    return profile


@app.patch("/api/profile")
async def update_profile(data: ProfileUpdate, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        result = supabase_admin.table("users").update(payload).eq("id", user_id).select().execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")
    if not result.data:
        raise HTTPException(status_code=500, detail="No rows updated — user row may be missing in public.users")
    return result.data[0]


@app.post("/api/account/delete")
async def delete_account(data: DeleteAccountRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    
    # Fetch user's email from database to verify password
    user_data = supabase_admin.table("users").select("email").eq("id", user_id).execute()
    if not user_data.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    email = user_data.data[0]["email"]
    
    # Verify password by trying to log in
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": data.password,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    if not auth_response.user or not auth_response.session:
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    # Log to deleted_accounts_log before hard-deleting
    try:
        profile = supabase_admin.table("users").select(
            "id, first_name, last_name, org_name, email, user_type, role, org_type, avatar_url"
        ).eq("id", user_id).execute()
        if profile.data:
            p = profile.data[0]
            supabase_admin.table("deleted_accounts_log").insert({
                "user_id": p["id"],
                "first_name": p.get("first_name"),
                "last_name": p.get("last_name"),
                "org_name": p.get("org_name"),
                "email": p.get("email"),
                "user_type": p.get("user_type"),
                "role": p.get("role"),
                "org_type": p.get("org_type"),
                "avatar_url": p.get("avatar_url"),
            }).execute()
    except Exception as log_err:
        print(f"[delete_account] logging failed: {log_err}")

    # Delete the user from auth.users (ON DELETE CASCADE deletes other tables)
    try:
        supabase_admin.auth.admin.delete_user(id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user account: {str(e)}")

    return {"message": "Account deleted successfully"}


@app.post("/api/account/deactivate")
async def deactivate_account(data: DeactivateAccountRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    
    # Fetch user's email from database to verify password
    user_data = supabase_admin.table("users").select("email").eq("id", user_id).execute()
    if not user_data.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    email = user_data.data[0]["email"]
    
    # Verify password by trying to log in
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": data.password,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    if not auth_response.user or not auth_response.session:
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    # Mark user as deactivated by setting deactivated_at timestamp
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        result = supabase_admin.table("users").update({"deactivated_at": now_iso}).eq("id", user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate user: {str(e)}")
        
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to deactivate user profile")
        
    return {"message": "Account deactivated successfully"}


@app.post("/api/account/change-password")
async def change_password(data: ChangePasswordRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)

    user_data = supabase_admin.table("users").select("email").eq("id", user_id).execute()
    if not user_data.data:
        raise HTTPException(status_code=404, detail="User not found")
    email = user_data.data[0]["email"]

    # Verify current password
    try:
        auth_resp = supabase.auth.sign_in_with_password({"email": email, "password": data.current_password})
    except Exception:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if not auth_resp.user:
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    try:
        supabase_admin.auth.admin.update_user_by_id(user_id, {"password": data.new_password})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update password: {str(e)}")

    if data.sign_out_all:
        supabase_admin.table("user_sessions").delete().eq("user_id", user_id).execute()

    return {"message": "Password changed successfully"}


@app.post("/api/upload/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    image_type: str = Form(...),
    authorization: str = Header(None),
):
    user_id = get_user_id(authorization)
    if image_type not in ("avatar", "cover"):
        raise HTTPException(status_code=400, detail="image_type must be 'avatar' or 'cover'")

    content = await file.read()
    ext = (file.filename or "image.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "gif", "webp"):
        ext = "jpg"

    bucket = "profile-images"
    path = f"{user_id}/{image_type}.{ext}"
    content_type = file.content_type or "image/jpeg"

    try:
        supabase_admin.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": content_type, "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    public_url = supabase_admin.storage.from_(bucket).get_public_url(path)

    field = "avatar_url" if image_type == "avatar" else "cover_url"
    supabase_admin.table("users").update({field: public_url}).eq("id", user_id).select().execute()

    return {"url": public_url}


DOCUMENT_CONTENT_TYPES = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


@app.post("/api/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    user_id = get_user_id(authorization)
    ext = (file.filename or "document.pdf").rsplit(".", 1)[-1].lower()
    if ext not in DOCUMENT_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, DOC, DOCX, PPT, or PPTX files are allowed")
    content = await file.read()
    if len(content) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 12 MB limit")
    bucket = "documents"
    path = f"{user_id}/resume.{ext}"
    try:
        supabase_admin.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": DOCUMENT_CONTENT_TYPES[ext], "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")
    # Store the storage path (not a public URL) — we generate signed URLs on demand
    supabase_admin.table("users").update({"resume_url": path}).eq("id", user_id).select().execute()
    # Return a short-lived signed URL (1 hour) for immediate preview
    signed = supabase_admin.storage.from_(bucket).create_signed_url(path, 3600)
    return {"url": signed.get("signedURL") or signed.get("signed_url") or ""}


class CreateCourseRequest(BaseModel):
    program_level: str
    title: str
    course_mode: str
    venue: Optional[str] = None
    online_access: Optional[str] = None
    visibility: str = "public"
    # School
    admission_for: Optional[List[str]] = None
    education_board: Optional[str] = None
    board_affiliation: Optional[str] = None
    grades_for: Optional[List[str]] = None
    # College
    academic_levels: Optional[List[str]] = None
    college_stream: Optional[str] = None
    # Professional
    course_levels: Optional[List[str]] = None
    pro_stream: Optional[str] = None
    # Step-2
    curriculum_features: Optional[Any] = None
    languages: Optional[List[str]] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    start_time: Optional[str] = None
    end_date: Optional[str] = None
    end_time: Optional[str] = None
    last_date_to_apply: Optional[str] = None
    certification: Optional[str] = None
    other_benefits: Optional[str] = None
    career_outcomes: Optional[str] = None
    eligibility_criteria: Optional[List[str]] = None
    required_documents: Optional[List[str]] = None
    fee_type: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    brochure_url: Optional[str] = None


@app.get("/api/learning/courses")
async def list_courses(
    program_level: Optional[str] = None,
    mode: Optional[str] = None,
):
    query = supabase_admin.table("learning_courses").select(
        "*, user:users(first_name, last_name, org_name, avatar_url, deactivated_at)"
    ).is_("user.deactivated_at", "null").eq("status", "published")

    if program_level:
        query = query.eq("program_level", program_level)
    if mode:
        query = query.eq("course_mode", mode)

    result = query.order("created_at", desc=True).execute()
    return result.data


_VALID_PROGRAM_LEVELS = {"school", "college", "professional"}
_VALID_COURSE_MODES = {"onsite", "remote", "hybrid"}


@app.post("/api/learning/courses")
async def create_course(data: CreateCourseRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)

    if data.program_level not in _VALID_PROGRAM_LEVELS:
        raise HTTPException(status_code=422, detail=f"program_level must be one of {sorted(_VALID_PROGRAM_LEVELS)}")
    if data.course_mode not in _VALID_COURSE_MODES:
        raise HTTPException(status_code=422, detail=f"course_mode must be one of {sorted(_VALID_COURSE_MODES)}")
    if not data.title or not data.title.strip():
        raise HTTPException(status_code=422, detail="title is required")

    payload = {
        "user_id": user_id,
        "program_level": data.program_level,
        "title": data.title,
        "course_mode": data.course_mode,
        "venue": data.venue,
        "online_access": data.online_access,
        "visibility": data.visibility,
        "status": "published",
        "admission_for": data.admission_for or [],
        "education_board": data.education_board,
        "board_affiliation": data.board_affiliation,
        "grades_for": data.grades_for or [],
        "academic_levels": data.academic_levels or [],
        "college_stream": data.college_stream,
        "course_levels": data.course_levels or [],
        "pro_stream": data.pro_stream,
        "curriculum_features": data.curriculum_features or {},
        "languages": data.languages or [],
        "duration": data.duration,
        "start_date": data.start_date or None,
        "start_time": data.start_time,
        "end_date": data.end_date or None,
        "end_time": data.end_time,
        "last_date_to_apply": data.last_date_to_apply or None,
        "certification": data.certification,
        "other_benefits": data.other_benefits,
        "career_outcomes": data.career_outcomes,
        "eligibility_criteria": data.eligibility_criteria or [],
        "required_documents": data.required_documents or [],
        "fee_type": data.fee_type,
        "description": data.description,
        "thumbnail_url": data.thumbnail_url,
        "brochure_url": data.brochure_url,
    }

    try:
        result = supabase_admin.table("learning_courses").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create course: {str(e)}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create course")

    return result.data[0]


@app.get("/api/learning/courses/{course_id}")
async def get_course(course_id: str):
    result = supabase_admin.table("learning_courses").select(
        "*, user:users(first_name, last_name, org_name, avatar_url)"
    ).eq("id", course_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found")
    return result.data[0]


@app.post("/api/learning/courses/{course_id}/apply")
async def apply_to_course(
    course_id: str,
    applicant_name: str = Form(...),
    applicant_email: str = Form(...),
    applicant_mobile: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    documents: List[UploadFile] = File(default=[]),
    authorization: Optional[str] = Header(None),
):
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            user_id = get_user_id(authorization)
        except Exception:
            pass

    doc_urls: List[str] = []
    for doc in documents:
        if doc and doc.filename:
            content = await doc.read()
            ext = (doc.filename).rsplit(".", 1)[-1].lower()
            path = f"applications/{course_id}/{uuid.uuid4().hex}.{ext}"
            try:
                supabase_admin.storage.from_("documents").upload(
                    path=path,
                    file=content,
                    file_options={
                        "content-type": doc.content_type or "application/octet-stream",
                        "upsert": "true",
                    },
                )
                doc_urls.append(path)
            except Exception:
                pass

    try:
        result = supabase_admin.table("course_applications").insert({
            "course_id": course_id,
            "user_id": user_id,
            "applicant_name": applicant_name,
            "applicant_email": applicant_email,
            "applicant_mobile": applicant_mobile,
            "message": message,
            "document_urls": doc_urls,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit application: {str(e)}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit application")

    return {"message": "Application submitted successfully", "id": result.data[0]["id"]}


@app.get("/api/storage/signed-url")
async def get_signed_url(
    bucket: str,
    path: str,
    authorization: str = Header(None),
):
    get_user_id(authorization)  # must be authenticated
    try:
        result = supabase_admin.storage.from_(bucket).create_signed_url(path, 3600)
        url = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url") or ""
        if not url:
            raise HTTPException(status_code=404, detail="Could not generate signed URL")
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/learning/my-courses")
async def get_my_courses(authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    result = supabase_admin.table("learning_courses").select(
        "id, title, program_level, course_mode, status, created_at, eligibility_criteria, required_documents"
    ).eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data or []


@app.get("/api/learning/my-courses/{course_id}/applications")
async def get_course_applications(course_id: str, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    course_check = supabase_admin.table("learning_courses").select("id").eq("id", course_id).eq("user_id", user_id).execute()
    if not course_check.data:
        raise HTTPException(status_code=403, detail="Not your course or course not found")
    result = supabase_admin.table("course_applications").select("*").eq("course_id", course_id).order("created_at", desc=True).execute()
    apps = result.data or []
    enhanced = []
    for app in apps:
        app_data = dict(app)
        applicant_id = app.get("user_id")
        if applicant_id:
            try:
                u = supabase_admin.table("users").select("avatar_url, first_name, last_name, org_name, resume_url").eq("id", applicant_id).execute()
                if u.data:
                    profile = dict(u.data[0])
                    raw_resume = profile.pop("resume_url", None)
                    if raw_resume:
                        try:
                            bucket_marker = "/documents/"
                            if bucket_marker in raw_resume:
                                resume_path = raw_resume.split(bucket_marker, 1)[1].split("?")[0]
                            else:
                                resume_path = raw_resume.split("?")[0]
                            signed = supabase_admin.storage.from_("documents").create_signed_url(resume_path, 3600)
                            profile["resume_signed_url"] = signed.get("signedURL") or signed.get("signed_url") or None
                        except Exception:
                            profile["resume_signed_url"] = None
                    else:
                        profile["resume_signed_url"] = None
                    app_data["user_profile"] = profile
            except Exception:
                pass
            try:
                exp = supabase_admin.table("experiences").select(
                    "role, company, emp_type, start_month, start_year, end_month, end_year, is_current, location"
                ).eq("user_id", applicant_id).order("is_current", desc=True).order("start_year", desc=True).execute()
                app_data["experiences"] = exp.data or []
            except Exception:
                app_data["experiences"] = []
            try:
                edu = supabase_admin.table("educations").select(
                    "school, level, field_of_study, start_date, end_date"
                ).eq("user_id", applicant_id).order("start_date", desc=True).execute()
                app_data["educations"] = edu.data or []
            except Exception:
                app_data["educations"] = []
        enhanced.append(app_data)
    return enhanced


@app.patch("/api/learning/applications/{app_id}/status")
async def update_course_application_status(app_id: str, body: dict, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    app_check = supabase_admin.table("course_applications").select("course_id").eq("id", app_id).execute()
    if not app_check.data:
        raise HTTPException(status_code=404, detail="Application not found")
    course_id = app_check.data[0]["course_id"]
    course_check = supabase_admin.table("learning_courses").select("id").eq("id", course_id).eq("user_id", user_id).execute()
    if not course_check.data:
        raise HTTPException(status_code=403, detail="Not authorized")
    new_status = body.get("status")
    if new_status not in ("applied", "not_a_fit", "maybe", "goodfit"):
        raise HTTPException(status_code=400, detail="Invalid status")
    supabase_admin.table("course_applications").update({"status": new_status}).eq("id", app_id).execute()
    return {"ok": True}


@app.delete("/api/learning/applications/{app_id}/withdraw")
async def withdraw_course_application(app_id: str, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    app_check = supabase_admin.table("course_applications").select("user_id").eq("id", app_id).execute()
    if not app_check.data:
        raise HTTPException(status_code=404, detail="Application not found")
    if app_check.data[0].get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    supabase_admin.table("course_applications").delete().eq("id", app_id).execute()
    return {"ok": True}


@app.post("/api/upload/course-image")
async def upload_course_image(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    user_id = get_user_id(authorization)
    content = await file.read()
    ext = (file.filename or "image.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "gif", "webp", "pdf"):
        ext = "jpg"

    path = f"courses/{user_id}/{uuid.uuid4().hex}.{ext}"
    content_type = file.content_type or ("application/pdf" if ext == "pdf" else "image/jpeg")

    try:
        supabase_admin.storage.from_("post-media").upload(
            path=path,
            file=content,
            file_options={"content-type": content_type, "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    public_url = supabase_admin.storage.from_("post-media").get_public_url(path)
    return {"url": public_url}


@app.post("/api/signup/organization")
async def signup_organization(data: OrgSignup):
    if not data.agreed_terms:
        raise HTTPException(status_code=400, detail="Must agree to terms and conditions")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    try:
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = auth_response.user.id

    result = supabase_admin.table("users").insert({
        "id": user_id,
        "user_type": "organization",
        "email": data.email,
        "org_name": data.org_name,
        "org_type": data.org_type,
        "year_of_founding": data.year_of_founding,
        "website": data.website,
        "contact_name": data.contact_name,
        "phone": data.phone,
        "agreed_terms": data.agreed_terms,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create profile")

    return {
        "message": "Account created successfully",
        "id": user_id,
        "requires_confirmation": auth_response.session is None,
    }


# ============================================================
# Discover endpoints
# ============================================================

def _optional_user_id(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        resp = supabase.auth.get_user(token)
        return resp.user.id if resp.user else None
    except Exception:
        return None


def _relative_time(ts: str) -> str:
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        diff = datetime.now(timezone.utc) - dt
        secs = diff.total_seconds()
        if secs < 3600:
            return f"{int(secs // 60)}m ago"
        elif secs < 86400:
            return f"{int(secs // 3600)}h ago"
        else:
            return f"{int(secs // 86400)}d ago"
    except Exception:
        return ""


def _row_to_item(row: dict, bookmarked_ids: set, reacted_ids: set = set()) -> dict:
    user_data = row.get("users") or {}
    name = (
        user_data.get("org_name")
        or f"{user_data.get('first_name') or ''} {user_data.get('last_name') or ''}".strip()
        or "Unknown"
    )
    nature = row.get("nature") or ""
    badge = nature.split(":")[-1].strip() if ":" in nature else nature
    return {
        "id": row["id"],
        "type": row["post_type"],
        "avatarUrl": user_data.get("avatar_url") or "",
        "name": name,
        "role": user_data.get("title") or user_data.get("role") or "",
        "company": user_data.get("company") or "",
        "postedAt": _relative_time(row.get("created_at") or ""),
        "badge": badge,
        "title": row.get("title") or "",
        "categoryTag": row.get("domain") or "",
        "subTags": nature,
        "mode": row.get("delivery_mode") or "",
        "payment": row.get("fee") or "",
        "targetAudience": row.get("target_audience") or "",
        "lastDate": row.get("last_date_to_apply") or "",
        "imageUrl": row.get("image_url") or "",
        "body": row.get("body") or "",
        "reactions": row.get("reactions_count") or 0,
        "comments": row.get("comments_count") or 0,
        "isBookmarked": row["id"] in bookmarked_ids,
        "isLiked": row["id"] in reacted_ids,
        "slug": row["id"],
        "opportunityNotes": row.get("body") or "",
        "description": row.get("body") or "",
        "onsiteVenue": row.get("onsite_venue") or "",
        "onlineAccess": row.get("online_access") or "",
        "eligibilityCriteria": row.get("eligibility_criteria") or [],
        "documentsRequired": row.get("documents_required") or [],
        "communicationLanguage": row.get("communication_language") or "",
        "levelOfParticipant": row.get("level_of_participant") or "",
        "educationalLevel": row.get("educational_level") or "",
        "eventOccurrence": row.get("event_occurrence") or "",
        "address": row.get("address") or "",
    }


@app.get("/api/discover/post/{post_id}")
async def get_single_discover_post(post_id: str, authorization: Optional[str] = Header(None)):
    result = supabase_admin.table("discover_posts").select(
        "*, users!discover_posts_user_id_fkey(first_name, last_name, org_name, avatar_url, role, title, company)"
    ).eq("id", post_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    user_id = _optional_user_id(authorization)
    bookmarked_ids: set = set()
    reacted_ids: set = set()
    if user_id:
        bm = supabase_admin.table("discover_bookmarks").select("post_id").eq("user_id", user_id).execute()
        bookmarked_ids = {r["post_id"] for r in (bm.data or [])}
        rx = supabase_admin.table("discover_reactions").select("post_id").eq("user_id", user_id).execute()
        reacted_ids = {r["post_id"] for r in (rx.data or [])}
    return _row_to_item(result.data[0], bookmarked_ids, reacted_ids)


@app.get("/api/discover/feed")
async def discover_feed(
    tab: str = Query("providers"),
    category: Optional[str] = Query(None),
    cursor: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    deliveryMode: Optional[str] = Query(None),
    levelOfParticipant: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    # Tabs show content curated for that audience, not content created by it:
    # provider-authored posts (opportunities/services) target seekers, and
    # seeker-authored posts (availability/requests) target providers.
    post_type = "provider" if tab == "seekers" else "seeker"

    query = (
        supabase_admin.table("discover_posts")
        .select("*, users!discover_posts_user_id_fkey(first_name, last_name, org_name, avatar_url, role, title, company, deactivated_at)")
        .eq("post_type", post_type)
        .eq("visibility", "public")
        .is_("users.deactivated_at", "null")
        .order("created_at", desc=True)
    )
    if category:
        query = query.eq("domain", category)
    if q:
        query = query.ilike("title", f"%{q}%")
    if deliveryMode:
        query = query.eq("delivery_mode", deliveryMode)
    if levelOfParticipant:
        query = query.eq("level_of_participant", levelOfParticipant)
    if cursor:
        query = query.lt("created_at", cursor)

    result = query.limit(10).execute()

    user_id = _optional_user_id(authorization)
    bookmarked_ids: set = set()
    reacted_ids: set = set()
    if user_id:
        bm = supabase_admin.table("discover_bookmarks").select("post_id").eq("user_id", user_id).execute()
        bookmarked_ids = {r["post_id"] for r in (bm.data or [])}
        rx = supabase_admin.table("discover_reactions").select("post_id").eq("user_id", user_id).execute()
        reacted_ids = {r["post_id"] for r in (rx.data or [])}

    rows = result.data or []
    items = [_row_to_item(r, bookmarked_ids, reacted_ids) for r in rows]
    next_cursor = rows[-1]["created_at"] if len(rows) == 10 else None
    return {"items": items, "nextCursor": next_cursor}


@app.get("/api/discover/search")
async def discover_search(
    q: str = Query(""),
    authorization: Optional[str] = Header(None),
):
    result = (
        supabase_admin.table("discover_posts")
        .select("*, users!discover_posts_user_id_fkey(first_name, last_name, org_name, avatar_url, role, title, company)")
        .ilike("title", f"%{q}%")
        .eq("visibility", "public")
        .limit(20)
        .execute()
    )
    user_id = _optional_user_id(authorization)
    bookmarked_ids: set = set()
    if user_id:
        bm = supabase_admin.table("discover_bookmarks").select("post_id").eq("user_id", user_id).execute()
        bookmarked_ids = {r["post_id"] for r in (bm.data or [])}
    return [_row_to_item(r, bookmarked_ids) for r in (result.data or [])]


@app.get("/api/discover/trending")
async def discover_trending(authorization: Optional[str] = Header(None)):
    result = (
        supabase_admin.table("discover_posts")
        .select("*, users!discover_posts_user_id_fkey(first_name, last_name, org_name, avatar_url, role, title, company)")
        .eq("visibility", "public")
        .order("reactions_count", desc=True)
        .limit(10)
        .execute()
    )
    user_id = _optional_user_id(authorization)
    bookmarked_ids: set = set()
    if user_id:
        bm = supabase_admin.table("discover_bookmarks").select("post_id").eq("user_id", user_id).execute()
        bookmarked_ids = {r["post_id"] for r in (bm.data or [])}
    return [_row_to_item(r, bookmarked_ids) for r in (result.data or [])]


class TrackRequest(BaseModel):
    postId: str


@app.post("/api/discover/track")
async def track_impression(data: TrackRequest, authorization: Optional[str] = Header(None)):  # noqa: ARG001
    return {"ok": True}


class ReactRequest(BaseModel):
    postId: str


@app.post("/api/discover/react")
async def toggle_reaction(data: ReactRequest, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    existing = supabase_admin.table("discover_reactions").select("id").eq("post_id", data.postId).eq("user_id", user_id).execute()
    if existing.data:
        supabase_admin.table("discover_reactions").delete().eq("post_id", data.postId).eq("user_id", user_id).execute()
        reacted = False
    else:
        supabase_admin.table("discover_reactions").insert({"post_id": data.postId, "user_id": user_id}).execute()
        reacted = True
    count_res = supabase_admin.table("discover_reactions").select("id", count="exact").eq("post_id", data.postId).execute()
    count = count_res.count or 0
    supabase_admin.table("discover_posts").update({"reactions_count": count}).eq("id", data.postId).execute()
    return {"reacted": reacted, "count": count}


class BookmarkRequest(BaseModel):
    postId: str
    bookmarked: bool


@app.post("/api/discover/bookmark")
async def toggle_discover_bookmark(data: BookmarkRequest, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    if data.bookmarked:
        supabase_admin.table("discover_bookmarks").upsert(
            {"user_id": user_id, "post_id": data.postId}
        ).execute()
    else:
        supabase_admin.table("discover_bookmarks").delete().eq("user_id", user_id).eq("post_id", data.postId).execute()
    return {"ok": True}


@app.post("/api/discover/apply")
async def submit_discover_application(
    postId: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    message: str = Form(""),
    document_labels: List[str] = Form(default=[]),
    documents: List[UploadFile] = File(default=[]),
    authorization: Optional[str] = Header(None),
):
    user_id = _optional_user_id(authorization)

    doc_data = []
    for i, doc in enumerate(documents):
        if not doc.filename:
            continue
        content = await doc.read()
        ts = int(datetime.now(timezone.utc).timestamp())
        path = f"discover-apps/{postId}/{ts}_{uuid.uuid4().hex[:6]}_{doc.filename}"
        try:
            supabase_admin.storage.from_("post-media").upload(
                path=path,
                file=content,
                file_options={"content-type": doc.content_type or "application/octet-stream", "upsert": "true"},
            )
            public_url = supabase_admin.storage.from_("post-media").get_public_url(path)
            label = document_labels[i] if i < len(document_labels) else doc.filename
            doc_data.append({"name": label, "url": public_url})
        except Exception:
            pass

    result = supabase_admin.table("discover_applications").insert({
        "post_id": postId,
        "user_id": user_id,
        "name": name,
        "email": email,
        "phone": phone,
        "message": message,
        "status": "applied",
        "document_data": doc_data,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit application")
    return {"id": result.data[0]["id"]}


class ProviderPostCreate(BaseModel):
    type: str = "opportunity"
    domain: str = ""
    nature: str = ""
    keyword: Optional[str] = None
    targetAudience: str = ""
    educationalLevel: Optional[str] = None
    eventOccurrence: str = "one_day"
    title: str
    eventDate: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    deliveryMode: Optional[str] = None
    address: Optional[str] = None
    communicationLanguage: Optional[str] = None
    levelOfParticipant: Optional[str] = None
    eligibilityCriteria: Optional[List[str]] = None
    documentsRequired: Optional[List[str]] = None
    lastDateToApply: Optional[str] = None
    fee: Optional[str] = None
    onsiteVenue: Optional[str] = None
    onlineAccess: Optional[str] = None
    description: Optional[str] = None
    coverImageUrl: Optional[str] = None
    visibleTo: str = "public"
    weeklySlots: Optional[List[dict]] = None

    @field_validator("eligibilityCriteria", "documentsRequired", mode="before")
    @classmethod
    def coerce_to_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v] if v.strip() else []
        return v


@app.post("/api/discover/create/provider")
async def create_provider_post(data: ProviderPostCreate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    try:
        result = supabase_admin.table("discover_posts").insert({
            "user_id": user_id,
            "post_type": "provider",
            "visibility": data.visibleTo.lower(),
            "title": data.title,
            "domain": data.domain,
            "nature": data.nature,
            "keyword": data.keyword,
            "target_audience": data.targetAudience,
            "educational_level": data.educationalLevel,
            "body": data.description,
            "image_url": data.coverImageUrl,
            "event_occurrence": data.eventOccurrence,
            "event_date": data.eventDate or None,
            "start_time": data.startTime,
            "end_time": data.endTime,
            "delivery_mode": data.deliveryMode,
            "address": data.address,
            "communication_language": data.communicationLanguage,
            "level_of_participant": data.levelOfParticipant,
            "eligibility_criteria": data.eligibilityCriteria or [],
            "documents_required": data.documentsRequired or [],
            "last_date_to_apply": data.lastDateToApply or None,
            "fee": data.fee,
            "onsite_venue": data.onsiteVenue,
            "online_access": data.onlineAccess,
            "weekly_slots": data.weeklySlots or [],
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create post")
    return {"id": result.data[0]["id"]}


class SeekerPostCreate(BaseModel):
    title: str
    professionalLevel: Optional[str] = None
    address: Optional[str] = None
    canPay: bool = False
    budget: Optional[str] = None
    providerPreferences: Optional[str] = None
    preferredDate: Optional[str] = None
    description: Optional[str] = None
    coverImageUrl: Optional[str] = None
    visibleTo: str = "public"


@app.post("/api/discover/create/seeker")
async def create_seeker_post(data: SeekerPostCreate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    result = supabase_admin.table("discover_posts").insert({
        "user_id": user_id,
        "post_type": "seeker",
        "visibility": data.visibleTo.lower(),
        "title": data.title,
        "body": data.description,
        "image_url": data.coverImageUrl,
        "professional_level": data.professionalLevel,
        "address": data.address,
        "can_pay": data.canPay,
        "budget": data.budget,
        "provider_preferences": data.providerPreferences,
        "preferred_date": data.preferredDate or None,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create post")
    return {"id": result.data[0]["id"]}


@app.post("/api/discover/upload-image")
async def upload_discover_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    content = await file.read()
    ext = (file.filename or "image.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "gif", "webp"):
        ext = "jpg"
    path = f"{user_id}/discover/{int(datetime.now(timezone.utc).timestamp())}.{ext}"
    try:
        supabase_admin.storage.from_("post-media").upload(
            path=path,
            file=content,
            file_options={"content-type": file.content_type or "image/jpeg", "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")
    return {"url": supabase_admin.storage.from_("post-media").get_public_url(path)}


@app.get("/api/discover/my-posts")
async def get_my_discover_posts(authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    result = supabase_admin.table("discover_posts").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    posts = []
    for row in (result.data or []):
        try:
            cnt = supabase_admin.table("discover_applications").select("id", count="exact").eq("post_id", row["id"]).execute()
            applicant_count = cnt.count or 0
        except Exception:
            applicant_count = 0
        posts.append({
            "id": row["id"],
            "title": row.get("title") or "",
            "domain": row.get("domain") or "",
            "nature": row.get("nature") or "",
            "deliveryMode": row.get("delivery_mode") or "",
            "address": row.get("address") or "",
            "imageUrl": row.get("image_url") or "",
            "eligibilityCriteria": row.get("eligibility_criteria") or [],
            "documentsRequired": row.get("documents_required") or [],
            "status": "active",
            "createdAt": row.get("created_at") or "",
            "applicant_count": applicant_count,
        })
    return posts


@app.get("/api/discover/my-applications")
async def get_my_discover_applications(authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    result = supabase_admin.table("discover_applications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    apps = result.data or []
    enhanced = []
    for app in apps:
        app_data = dict(app)
        try:
            p = supabase_admin.table("discover_posts").select(
                "id, title, domain, nature, address, delivery_mode, user_id"
            ).eq("id", app["post_id"]).execute()
            if p.data:
                post = p.data[0]
                app_data["post"] = {
                    "title": post.get("title") or "",
                    "domain": post.get("domain") or "",
                    "nature": post.get("nature") or "",
                    "address": post.get("address") or "",
                    "delivery_mode": post.get("delivery_mode") or "",
                }
                try:
                    u = supabase_admin.table("users").select(
                        "first_name, last_name, org_name"
                    ).eq("id", post["user_id"]).execute()
                    if u.data:
                        app_data["post_creator"] = u.data[0]
                except Exception:
                    pass
        except Exception:
            pass
        enhanced.append(app_data)
    return enhanced


@app.get("/api/employment/postings/{posting_id}/applications")
async def get_employment_posting_applications(posting_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    post_check = supabase_admin.table("employment_hub_postings").select("user_id").eq("id", posting_id).execute()
    if not post_check.data or post_check.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase_admin.table("employment_applications").select("*").eq("posting_id", posting_id).order("applied_at", desc=True).execute()
    apps = result.data or []
    enhanced = []
    for app in apps:
        app_data = dict(app)
        applicant_id = app.get("applicant_id")
        if applicant_id:
            try:
                u = supabase_admin.table("users").select("avatar_url, first_name, last_name, org_name, resume_url").eq("id", applicant_id).execute()
                if u.data:
                    profile = dict(u.data[0])
                    # Generate a signed URL for the resume so the employer can view it
                    raw_resume = profile.pop("resume_url", None)
                    if raw_resume:
                        try:
                            bucket_marker = "/documents/"
                            if bucket_marker in raw_resume:
                                resume_path = raw_resume.split(bucket_marker, 1)[1].split("?")[0]
                            else:
                                resume_path = raw_resume.split("?")[0]
                            signed = supabase_admin.storage.from_("documents").create_signed_url(resume_path, 3600)
                            profile["resume_signed_url"] = signed.get("signedURL") or signed.get("signed_url") or None
                        except Exception:
                            profile["resume_signed_url"] = None
                    else:
                        profile["resume_signed_url"] = None
                    app_data["user_profile"] = profile
            except Exception:
                pass
            try:
                sp = supabase_admin.table("job_seeker_profiles").select(
                    "career_goals, work_drives_you, current_location, job_industry, department, technical_skills, soft_skills, resume_url, institute_name, education_level, documents_required"
                ).eq("user_id", applicant_id).execute()
                if sp.data:
                    app_data["seeker_profile"] = sp.data[0]
            except Exception:
                pass
            try:
                exp = supabase_admin.table("experiences").select(
                    "role, company, emp_type, start_month, start_year, end_month, end_year, is_current, location"
                ).eq("user_id", applicant_id).order("is_current", desc=True).order("start_year", desc=True).execute()
                app_data["experiences"] = exp.data or []
            except Exception:
                app_data["experiences"] = []
            try:
                edu = supabase_admin.table("educations").select(
                    "school, level, field_of_study, start_date, end_date"
                ).eq("user_id", applicant_id).order("start_date", desc=True).execute()
                app_data["educations"] = edu.data or []
            except Exception:
                app_data["educations"] = []
        enhanced.append(app_data)
    return enhanced


@app.delete("/api/employment/applications/{app_id}/withdraw")
async def withdraw_employment_application(app_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    app_check = supabase_admin.table("employment_applications").select("applicant_id").eq("id", app_id).execute()
    if not app_check.data:
        raise HTTPException(status_code=404, detail="Application not found")
    if app_check.data[0].get("applicant_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    supabase_admin.table("employment_applications").delete().eq("id", app_id).execute()
    return {"ok": True}


@app.delete("/api/discover/applications/{app_id}/withdraw")
async def withdraw_discover_application(app_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    app_check = supabase_admin.table("discover_applications").select("user_id").eq("id", app_id).execute()
    if not app_check.data:
        raise HTTPException(status_code=404, detail="Application not found")
    if app_check.data[0].get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    supabase_admin.table("discover_applications").delete().eq("id", app_id).execute()
    return {"ok": True}


@app.get("/api/discover/posts/{post_id}/applications")
async def get_discover_post_applications(post_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    post_check = supabase_admin.table("discover_posts").select("user_id").eq("id", post_id).execute()
    if not post_check.data or post_check.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase_admin.table("discover_applications").select("*").eq("post_id", post_id).order("created_at", desc=True).execute()
    apps = result.data or []
    enhanced = []
    for app in apps:
        app_data = dict(app)
        if app.get("user_id"):
            try:
                u = supabase_admin.table("users").select(
                    "avatar_url, first_name, last_name, org_name, resume_url, user_type, bio, website, work_sector, work_industry"
                ).eq("id", app["user_id"]).execute()
                if u.data:
                    profile = dict(u.data[0])
                    raw_resume = profile.pop("resume_url", None)
                    if raw_resume:
                        try:
                            bucket_marker = "/documents/"
                            if bucket_marker in raw_resume:
                                resume_path = raw_resume.split(bucket_marker, 1)[1].split("?")[0]
                            else:
                                resume_path = raw_resume.split("?")[0]
                            signed = supabase_admin.storage.from_("documents").create_signed_url(resume_path, 3600)
                            profile["resume_signed_url"] = signed.get("signedURL") or signed.get("signed_url") or None
                        except Exception:
                            profile["resume_signed_url"] = None
                    else:
                        profile["resume_signed_url"] = None
                    app_data["user_profile"] = profile
            except Exception:
                pass
            try:
                sp = supabase_admin.table("job_seeker_profiles").select(
                    "career_goals, work_drives_you, current_location, job_industry, department, technical_skills, soft_skills, institute_name, education_level"
                ).eq("user_id", app["user_id"]).execute()
                if sp.data:
                    app_data["seeker_profile"] = sp.data[0]
            except Exception:
                pass
            try:
                exp = supabase_admin.table("experiences").select(
                    "role, company, emp_type, start_month, start_year, end_month, end_year, is_current, location"
                ).eq("user_id", app["user_id"]).order("is_current", desc=True).order("start_year", desc=True).execute()
                app_data["experiences"] = exp.data or []
            except Exception:
                app_data["experiences"] = []
            try:
                edu = supabase_admin.table("educations").select(
                    "school, level, field_of_study, start_date, end_date"
                ).eq("user_id", app["user_id"]).order("start_date", desc=True).execute()
                app_data["educations"] = edu.data or []
            except Exception:
                app_data["educations"] = []
        enhanced.append(app_data)
    return enhanced


@app.delete("/api/discover/applications/{app_id}")
async def delete_discover_application(app_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    app_check = supabase_admin.table("discover_applications").select("post_id").eq("id", app_id).execute()
    if not app_check.data:
        raise HTTPException(status_code=404, detail="Application not found")
    post_id = app_check.data[0]["post_id"]
    post_check = supabase_admin.table("discover_posts").select("user_id").eq("id", post_id).execute()
    if not post_check.data or post_check.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    supabase_admin.table("discover_applications").delete().eq("id", app_id).execute()
    return {"ok": True}


class DiscoverAppStatusUpdate(BaseModel):
    status: str


@app.patch("/api/discover/applications/{app_id}/status")
async def update_discover_application_status(
    app_id: str,
    data: DiscoverAppStatusUpdate,
    authorization: Optional[str] = Header(None),
):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
    app_check = supabase_admin.table("discover_applications").select("post_id").eq("id", app_id).execute()
    if not app_check.data:
        raise HTTPException(status_code=404, detail="Application not found")
    post_id = app_check.data[0]["post_id"]
    post_check = supabase_admin.table("discover_posts").select("user_id").eq("id", post_id).execute()
    if not post_check.data or post_check.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    supabase_admin.table("discover_applications").update({"status": data.status}).eq("id", app_id).execute()
    return {"ok": True}


# ============================================================
# Community Endpoints
# ============================================================

def _format_user(u: dict) -> dict:
    """Return a consistent user shape for community responses."""
    first = u.get("first_name") or ""
    last = u.get("last_name") or ""
    name = f"{first} {last}".strip() or u.get("org_name") or "Unknown"

    raw_role = u.get("title") or u.get("role") or ""
    title = raw_role.replace("_", " ").title() if raw_role else ""

    # Don't show company if it duplicates the display name
    company_raw = u.get("company") or u.get("org_name") or ""
    company = "" if company_raw == name else company_raw

    return {
        "id": u["id"],
        "name": name,
        "title": title,
        "company": company,
        "avatar_url": u.get("avatar_url"),
        "cover_url": u.get("cover_url"),
    }


def _get_first_degree_ids(user_id: str) -> set[str]:
    """Return the set of user IDs the given user is directly (1st-degree) connected to."""
    rows = supabase_admin.table("community_connections").select(
        "requester_id, addressee_id"
    ).eq("status", "accepted").or_(
        f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
    ).execute()

    first_degree_ids: set[str] = set()
    for row in (rows.data or []):
        peer = row["addressee_id"] if row["requester_id"] == user_id else row["requester_id"]
        first_degree_ids.add(peer)
    return first_degree_ids


def _compute_mutual_counts(first_degree_ids: set[str], target_ids: list[str]) -> dict[str, int]:
    """For each target ID, count how many of the current user's 1st-degree
    connections are themselves directly connected to that target — i.e. the
    number of mutual connections, used to derive LinkedIn-style 2nd-degree status."""
    mutual_counts: dict[str, int] = {}
    if not first_degree_ids or not target_ids:
        return mutual_counts

    target_set = set(target_ids)
    peer_list = list(first_degree_ids)
    peer_conn_rows = supabase_admin.table("community_connections").select(
        "requester_id, addressee_id"
    ).eq("status", "accepted").or_(
        f"requester_id.in.({','.join(peer_list)}),addressee_id.in.({','.join(peer_list)})"
    ).execute()

    for row in (peer_conn_rows.data or []):
        r, a = row["requester_id"], row["addressee_id"]
        if r in first_degree_ids and a in target_set:
            mutual_counts[a] = mutual_counts.get(a, 0) + 1
        if a in first_degree_ids and r in target_set:
            mutual_counts[r] = mutual_counts.get(r, 0) + 1

    return mutual_counts


def _degree_label(user_id: str, target_id: str, first_degree_ids: set[str], mutual_counts: dict[str, int]) -> str:
    """LinkedIn-style connection degree: 1st = direct connection, 2nd = connected
    to at least one of my 1st-degree connections, 3rd+ = everyone else."""
    if target_id == user_id:
        return "1st"
    if target_id in first_degree_ids:
        return "1st"
    if mutual_counts.get(target_id, 0) > 0:
        return "2nd"
    return "3rd+"


@app.get("/api/community/connections")
async def get_connections(
    q: Optional[str] = None,
    authorization: str = Header(None),
):
    """Return all accepted connections for the authenticated user."""
    user_id = get_user_id(authorization)

    rows = supabase_admin.table("community_connections").select(
        "id, requester_id, addressee_id, created_at"
    ).eq("status", "accepted").or_(
        f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
    ).order("created_at", desc=True).execute()

    if not rows.data:
        return {"connections": [], "total": 0}

    peer_ids = [
        r["addressee_id"] if r["requester_id"] == user_id else r["requester_id"]
        for r in rows.data
    ]

    users_result = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, company, avatar_url, cover_url"
    ).in_("id", peer_ids).execute()

    users_map = {u["id"]: u for u in (users_result.data or [])}

    # Batch-fetch social proof counts so the share card shows correct numbers
    achievement_counts: dict[str, int] = {}
    endorsement_counts: dict[str, int] = {}
    review_counts: dict[str, int] = {}
    if peer_ids:
        try:
            for row in (supabase_admin.table("personal_achievements").select(
                "user_id"
            ).in_("user_id", peer_ids).execute().data or []):
                uid = row["user_id"]
                achievement_counts[uid] = achievement_counts.get(uid, 0) + 1
        except Exception:
            pass
        try:
            for row in (supabase_admin.table("user_endorsements").select(
                "endorsed_id"
            ).in_("endorsed_id", peer_ids).execute().data or []):
                uid = row["endorsed_id"]
                endorsement_counts[uid] = endorsement_counts.get(uid, 0) + 1
        except Exception:
            pass
        try:
            for row in (supabase_admin.table("user_reviews").select(
                "reviewed_id"
            ).in_("reviewed_id", peer_ids).execute().data or []):
                uid = row["reviewed_id"]
                review_counts[uid] = review_counts.get(uid, 0) + 1
        except Exception:
            pass

    connections = []
    for row in rows.data:
        peer_id = row["addressee_id"] if row["requester_id"] == user_id else row["requester_id"]
        peer = users_map.get(peer_id)
        if not peer:
            continue
        formatted = _format_user(peer)
        formatted["connection_id"] = row["id"]
        formatted["connected_at"] = row["created_at"]
        formatted["endorsement_count"] = endorsement_counts.get(peer_id, 0)
        formatted["review_count"] = review_counts.get(peer_id, 0)
        formatted["achievement_count"] = achievement_counts.get(peer_id, 0)
        formatted["degree"] = "1st"
        if q and q.lower() not in formatted["name"].lower():
            continue
        connections.append(formatted)

    return {"connections": connections, "total": len(connections)}


@app.get("/api/community/connection-ids")
async def get_connection_ids(authorization: str = Header(None)):
    """Return just the accepted-connection peer IDs — a lightweight variant of
    /api/community/connections for callers (like the feed) that only need IDs
    for a visibility filter, not full profile cards with social-proof counts."""
    user_id = get_user_id(authorization)

    rows = supabase_admin.table("community_connections").select(
        "requester_id, addressee_id"
    ).eq("status", "accepted").or_(
        f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
    ).execute()

    peer_ids = [
        r["addressee_id"] if r["requester_id"] == user_id else r["requester_id"]
        for r in (rows.data or [])
    ]
    return {"ids": peer_ids}


@app.get("/api/community/members/{profile_user_id}")
async def get_profile_community_members(
    profile_user_id: str,
    q: Optional[str] = None,
    user_type: Optional[str] = None,
    authorization: str = Header(None),
):
    """Return accepted community members for any user's profile page, respecting community_visibility."""
    requester_id = get_user_id(authorization)

    # Fetch profile user's community_visibility setting
    profile_row = supabase_admin.table("users").select("community_visibility").eq("id", profile_user_id).execute()
    visibility = "everyone"
    if profile_row.data:
        visibility = profile_row.data[0].get("community_visibility") or "everyone"

    # Enforce visibility unless the requester is the profile owner
    if requester_id != profile_user_id and visibility != "everyone":
        # Check if requester is a direct community member of the profile user
        direct_conn = supabase_admin.table("community_connections").select("id").eq(
            "status", "accepted"
        ).or_(
            f"and(requester_id.eq.{profile_user_id},addressee_id.eq.{requester_id}),and(requester_id.eq.{requester_id},addressee_id.eq.{profile_user_id})"
        ).execute()
        if not direct_conn.data:
            return {"members": [], "total": 0, "restricted": True}

    rows = supabase_admin.table("community_connections").select(
        "id, requester_id, addressee_id, created_at"
    ).eq("status", "accepted").or_(
        f"requester_id.eq.{profile_user_id},addressee_id.eq.{profile_user_id}"
    ).order("created_at", desc=True).execute()

    if not rows.data:
        return {"members": [], "total": 0, "restricted": False}

    peer_ids = [
        r["addressee_id"] if r["requester_id"] == profile_user_id else r["requester_id"]
        for r in rows.data
    ]

    query = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, company, avatar_url, cover_url, user_type"
    ).in_("id", peer_ids)
    if user_type:
        query = query.eq("user_type", user_type)
    users_result = query.execute()

    users_map = {u["id"]: u for u in (users_result.data or [])}

    members = []
    for row in rows.data:
        peer_id = row["addressee_id"] if row["requester_id"] == profile_user_id else row["requester_id"]
        peer = users_map.get(peer_id)
        if not peer:
            continue
        formatted = _format_user(peer)
        formatted["user_type"] = peer.get("user_type") or "individual"
        if q and q.lower() not in formatted["name"].lower():
            continue
        members.append(formatted)

    return {"members": members, "total": len(members), "restricted": False}


@app.get("/api/mentions/search")
async def search_mentionable_users(
    q: Optional[str] = None,
    authorization: str = Header(None),
):
    """Return connections that allow being mentioned (respects mention_permission)."""
    user_id = get_user_id(authorization)

    rows = supabase_admin.table("community_connections").select(
        "id, requester_id, addressee_id"
    ).eq("status", "accepted").or_(
        f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
    ).execute()

    if not rows.data:
        return {"users": []}

    peer_ids = [
        r["addressee_id"] if r["requester_id"] == user_id else r["requester_id"]
        for r in rows.data
    ]

    users_result = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, company, avatar_url, mention_permission"
    ).in_("id", peer_ids).execute()

    result = []
    for u in (users_result.data or []):
        mention_perm = u.get("mention_permission") or "everyone"
        # Exclude users who have opted out of mentions
        if mention_perm == "none":
            continue
        formatted = _format_user(u)
        if q and q.lower() not in formatted["name"].lower():
            continue
        result.append(formatted)

    return {"users": result}


@app.get("/api/community/pending")
async def get_pending_requests(authorization: str = Header(None)):
    """Return incoming connection requests that are still pending."""
    user_id = get_user_id(authorization)

    rows = supabase_admin.table("community_connections").select(
        "id, requester_id, created_at"
    ).eq("addressee_id", user_id).eq("status", "pending").order("created_at", desc=True).execute()

    if not rows.data:
        return {"requests": []}

    requester_ids = [r["requester_id"] for r in rows.data]

    users_result = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, company, avatar_url, cover_url"
    ).in_("id", requester_ids).execute()

    users_map = {u["id"]: u for u in (users_result.data or [])}

    first_degree_ids = _get_first_degree_ids(user_id)
    mutual_counts = _compute_mutual_counts(first_degree_ids, requester_ids)

    requests = []
    for row in rows.data:
        peer = users_map.get(row["requester_id"])
        if not peer:
            continue
        formatted = _format_user(peer)
        formatted["request_id"] = row["id"]
        formatted["requested_at"] = row["created_at"]
        formatted["mutual_connections"] = mutual_counts.get(row["requester_id"], 0)
        formatted["degree"] = _degree_label(user_id, row["requester_id"], first_degree_ids, mutual_counts)
        requests.append(formatted)

    return {"requests": requests}


@app.get("/api/community/sent")
async def get_sent_requests(authorization: str = Header(None)):
    """Return outgoing connection requests sent by the current user that are still pending."""
    user_id = get_user_id(authorization)

    rows = supabase_admin.table("community_connections").select(
        "id, addressee_id, created_at"
    ).eq("requester_id", user_id).eq("status", "pending").order("created_at", desc=True).execute()

    if not rows.data:
        return {"requests": []}

    addressee_ids = [r["addressee_id"] for r in rows.data]

    users_result = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, company, avatar_url, cover_url"
    ).in_("id", addressee_ids).execute()

    users_map = {u["id"]: u for u in (users_result.data or [])}

    requests = []
    for row in rows.data:
        peer = users_map.get(row["addressee_id"])
        if not peer:
            continue
        formatted = _format_user(peer)
        formatted["request_id"] = row["id"]
        formatted["sent_at"] = row["created_at"]
        requests.append(formatted)

    return {"requests": requests}


@app.get("/api/community/suggestions")
async def get_suggestions(authorization: str = Header(None)):
    """
    Return ranked connection suggestions using a LinkedIn-style scoring algorithm.

    Scoring weights:
      - Mutual connections : +10 per shared connection
      - Same company       : +8
      - Same role          : +8
      - Same work sector   : +6
      - Same location      : +5
      - Shared skills      : +3 each (capped at +15)
      - Endorsements       : +1 each (capped at +3)
      - Reviews            : +1 each (capped at +2)
    """
    user_id = get_user_id(authorization)

    # ── 1. Current user's profile attributes for comparison ──────────────────
    me_result = supabase_admin.table("users").select(
        "role, company, work_sector, location, skills"
    ).eq("id", user_id).execute()
    me = me_result.data[0] if me_result.data else {}
    me_role     = (me.get("role") or "").lower().strip()
    me_company  = (me.get("company") or "").lower().strip()
    me_sector   = (me.get("work_sector") or "").lower().strip()
    me_location = (me.get("location") or "").lower().strip()
    me_skills   = {s.lower() for s in (me.get("skills") or [])}

    # ── 2. All existing connections / pending relationships ───────────────────
    existing = supabase_admin.table("community_connections").select(
        "requester_id, addressee_id, status"
    ).or_(
        f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
    ).execute()

    excluded_ids: set[str] = {user_id}
    first_degree_ids: set[str] = set()
    for row in (existing.data or []):
        excluded_ids.add(row["requester_id"])
        excluded_ids.add(row["addressee_id"])
        if row["status"] == "accepted":
            peer = row["addressee_id"] if row["requester_id"] == user_id else row["requester_id"]
            first_degree_ids.add(peer)

    # ── 3. 2nd-degree graph: count mutual connections per candidate ───────────
    # Walk all connections that involve any of my 1st-degree peers and count
    # how many times each non-excluded person appears as the "other" side.
    mutual_counts: dict[str, int] = {}
    if first_degree_ids:
        peer_list = list(first_degree_ids)
        peer_conn_rows = supabase_admin.table("community_connections").select(
            "requester_id, addressee_id"
        ).eq("status", "accepted").or_(
            f"requester_id.in.({','.join(peer_list)}),addressee_id.in.({','.join(peer_list)})"
        ).execute()

        for row in (peer_conn_rows.data or []):
            r, a = row["requester_id"], row["addressee_id"]
            if r in first_degree_ids and a not in excluded_ids:
                mutual_counts[a] = mutual_counts.get(a, 0) + 1
            if a in first_degree_ids and r not in excluded_ids:
                mutual_counts[r] = mutual_counts.get(r, 0) + 1

    # ── 4. Candidate pool ─────────────────────────────────────────────────────
    all_users = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, company, "
        "work_sector, location, skills, avatar_url, cover_url"
    ).limit(300).execute()

    candidates = [u for u in (all_users.data or []) if u["id"] not in excluded_ids]
    candidate_ids = [u["id"] for u in candidates]

    # ── 5. Batch-fetch social proof counts ────────────────────────────────────
    achievement_counts: dict[str, int] = {}
    endorsement_counts: dict[str, int] = {}
    review_counts: dict[str, int] = {}
    if candidate_ids:
        try:
            for row in (supabase_admin.table("personal_achievements").select(
                "user_id"
            ).in_("user_id", candidate_ids).execute().data or []):
                uid = row["user_id"]
                achievement_counts[uid] = achievement_counts.get(uid, 0) + 1
        except Exception:
            pass
        try:
            for row in (supabase_admin.table("user_endorsements").select(
                "endorsed_id"
            ).in_("endorsed_id", candidate_ids).execute().data or []):
                uid = row["endorsed_id"]
                endorsement_counts[uid] = endorsement_counts.get(uid, 0) + 1
        except Exception:
            pass
        try:
            for row in (supabase_admin.table("user_reviews").select(
                "reviewed_id"
            ).in_("reviewed_id", candidate_ids).execute().data or []):
                uid = row["reviewed_id"]
                review_counts[uid] = review_counts.get(uid, 0) + 1
        except Exception:
            pass

    # ── 6. Score and rank ─────────────────────────────────────────────────────
    scored: list[dict] = []
    for u in candidates:
        uid = u["id"]
        score = 0

        # Mutual connections — strongest signal
        mutual = mutual_counts.get(uid, 0)
        score += mutual * 10

        # Same company
        if me_company and (u.get("company") or "").lower().strip() == me_company:
            score += 8

        # Same role
        if me_role and (u.get("role") or "").lower().strip() == me_role:
            score += 8

        # Same work sector
        if me_sector and (u.get("work_sector") or "").lower().strip() == me_sector:
            score += 6

        # Same location
        if me_location and (u.get("location") or "").lower().strip() == me_location:
            score += 5

        # Shared skills (3 pts each, capped at 15)
        u_skills = {s.lower() for s in (u.get("skills") or [])}
        score += min(len(me_skills & u_skills) * 3, 15)

        # Small credibility boost
        score += min(endorsement_counts.get(uid, 0), 3)
        score += min(review_counts.get(uid, 0), 2)

        formatted = _format_user(u)
        formatted["endorsement_count"]  = endorsement_counts.get(uid, 0)
        formatted["review_count"]       = review_counts.get(uid, 0)
        formatted["achievement_count"]  = achievement_counts.get(uid, 0)
        formatted["mutual_connections"] = mutual
        formatted["degree"]             = "2nd" if mutual > 0 else "3rd+"
        formatted["_score"]             = score
        scored.append(formatted)

    scored.sort(key=lambda x: x.pop("_score"), reverse=True)
    return {"suggestions": scored[:50]}


class ConnectionRequestBody(BaseModel):
    addressee_id: str


@app.post("/api/community/request")
async def send_connection_request(data: ConnectionRequestBody, authorization: str = Header(None)):
    """Send a connection request to another user."""
    user_id = get_user_id(authorization)

    if data.addressee_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")

    existing = supabase_admin.table("community_connections").select("id, status").or_(
        f"and(requester_id.eq.{user_id},addressee_id.eq.{data.addressee_id}),"
        f"and(requester_id.eq.{data.addressee_id},addressee_id.eq.{user_id})"
    ).execute()

    if existing.data:
        raise HTTPException(status_code=409, detail="Connection already exists or is pending")

    result = supabase_admin.table("community_connections").insert({
        "requester_id": user_id,
        "addressee_id": data.addressee_id,
        "status": "pending",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send request")

    return {"message": "Request sent", "id": result.data[0]["id"]}


@app.post("/api/community/accept/{request_id}")
async def accept_connection_request(request_id: str, authorization: str = Header(None)):
    """Accept an incoming connection request."""
    user_id = get_user_id(authorization)

    result = supabase_admin.table("community_connections").update({
        "status": "accepted",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", request_id).eq("addressee_id", user_id).eq("status", "pending").execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found or already handled")

    return {"message": "Connection accepted"}


@app.delete("/api/community/reject/{request_id}")
async def reject_or_cancel_request(request_id: str, authorization: str = Header(None)):
    """Reject an incoming request or cancel an outgoing one."""
    user_id = get_user_id(authorization)

    supabase_admin.table("community_connections").delete().eq("id", request_id).or_(
        f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
    ).execute()

    return {"message": "Request removed"}


@app.delete("/api/community/remove/{peer_id}")
async def remove_connection(peer_id: str, authorization: str = Header(None)):
    """Remove an accepted connection."""
    user_id = get_user_id(authorization)

    supabase_admin.table("community_connections") \
        .delete() \
        .eq("status", "accepted") \
        .or_(
            f"and(requester_id.eq.{user_id},addressee_id.eq.{peer_id}),"
            f"and(requester_id.eq.{peer_id},addressee_id.eq.{user_id})"
        ).execute()

    return {"message": "Connection removed"}


# ============================================================
# Block Endpoints
# ============================================================

@app.post("/api/block/{target_id}")
async def block_user(target_id: str, authorization: str = Header(None)):
    """Block a user."""
    user_id = get_user_id(authorization)

    if target_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    existing = supabase_admin.table("blocks").select("id").eq("blocker_id", user_id).eq("blocked_id", target_id).execute()
    if existing.data:
        return {"message": "Already blocked"}

    result = supabase_admin.table("blocks").insert({
        "blocker_id": user_id,
        "blocked_id": target_id,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to block user")

    return {"message": "User blocked"}


@app.delete("/api/block/{target_id}")
async def unblock_user(target_id: str, authorization: str = Header(None)):
    """Unblock a user."""
    user_id = get_user_id(authorization)

    supabase_admin.table("blocks").delete().eq("blocker_id", user_id).eq("blocked_id", target_id).execute()

    return {"message": "User unblocked"}


@app.get("/api/blocks")
async def get_blocked_users(authorization: str = Header(None)):
    """Get all users blocked by the current user."""
    user_id = get_user_id(authorization)

    blocks = supabase_admin.table("blocks").select("blocked_id").eq("blocker_id", user_id).execute()

    if not blocks.data:
        return {"blocked": []}

    blocked_ids = [b["blocked_id"] for b in blocks.data]

    users = supabase_admin.table("users").select("id, user_type, first_name, last_name, org_name").in_("id", blocked_ids).execute()

    result = []
    for u in users.data:
        if u.get("user_type") == "organization":
            name = u.get("org_name") or "Unknown Organisation"
        else:
            name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip() or "Unknown"
        result.append({
            "id": u["id"],
            "name": name,
            "user_type": u.get("user_type", "individual"),
        })

    return {"blocked": result}


@app.get("/api/block/{target_id}/status")
async def get_block_status(target_id: str, authorization: str = Header(None)):
    """Check if the current user has blocked a specific user."""
    user_id = get_user_id(authorization)

    result = supabase_admin.table("blocks").select("id").eq("blocker_id", user_id).eq("blocked_id", target_id).execute()

    return {"is_blocked": bool(result.data)}


@app.get("/api/blocks/blocked-me")
async def get_users_who_blocked_me(authorization: str = Header(None)):
    """Return list of user IDs who have blocked the current user."""
    user_id = get_user_id(authorization)

    result = supabase_admin.table("blocks").select("blocker_id").eq("blocked_id", user_id).execute()

    return {"blocked_by": [r["blocker_id"] for r in (result.data or [])]}


def _is_either_blocked(user_a: str, user_b: str) -> bool:
    """Return True if either user has blocked the other."""
    result = supabase_admin.table("blocks").select("id").or_(
        f"and(blocker_id.eq.{user_a},blocked_id.eq.{user_b}),and(blocker_id.eq.{user_b},blocked_id.eq.{user_a})"
    ).execute()
    return bool(result.data)


# ============================================================
# Review Endpoints
# ============================================================

class SubmitReviewRequest(BaseModel):
    rating: int
    review_text: str
    media_url: Optional[str] = None


@app.post("/api/reviews/{target_id}")
async def submit_review(target_id: str, data: SubmitReviewRequest, authorization: str = Header(None)):
    """Submit a review for a user, enforcing that user's review_permission setting."""
    reviewer_id = get_user_id(authorization)

    if reviewer_id == target_id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")

    # Fetch target user's review_permission
    target = supabase_admin.table("users").select("review_permission").eq("id", target_id).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="User not found")

    review_perm = target.data[0].get("review_permission") or ["everyone"]

    # If community-only and "everyone" is NOT in permissions, check connection
    if "everyone" not in review_perm:
        connection = supabase_admin.table("community_connections").select("id").eq("status", "accepted").or_(
            f"and(requester_id.eq.{reviewer_id},addressee_id.eq.{target_id}),"
            f"and(requester_id.eq.{target_id},addressee_id.eq.{reviewer_id})"
        ).execute()
        if not connection.data:
            raise HTTPException(status_code=403, detail="This user only allows reviews from their community members.")

    # Upsert the review
    result = supabase_admin.table("user_reviews").upsert(
        {
            "reviewer_id": reviewer_id,
            "reviewed_id": target_id,
            "rating": data.rating,
            "review_text": data.review_text,
            **({"media_url": data.media_url} if data.media_url else {}),
        },
        on_conflict="reviewer_id,reviewed_id",
    ).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit review")

    return {"message": "Review submitted"}


@app.get("/api/reviews/{target_id}/can-review")
async def can_review(target_id: str, authorization: str = Header(None)):
    """Check if the current user is allowed to review the target user."""
    reviewer_id = get_user_id(authorization)

    target = supabase_admin.table("users").select("review_permission").eq("id", target_id).execute()
    if not target.data:
        return {"allowed": False, "reason": "User not found"}

    review_perm = target.data[0].get("review_permission") or ["everyone"]

    if "everyone" in review_perm:
        return {"allowed": True}

    connection = supabase_admin.table("community_connections").select("id").eq("status", "accepted").or_(
        f"and(requester_id.eq.{reviewer_id},addressee_id.eq.{target_id}),"
        f"and(requester_id.eq.{target_id},addressee_id.eq.{reviewer_id})"
    ).execute()

    if connection.data:
        return {"allowed": True}

    return {"allowed": False, "reason": "This user only allows reviews from their community members."}


# ============================================================
# Messaging Endpoints
# ============================================================

class SendMessageBody(BaseModel):
    content: str
    message_type: str = "text"
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    reply_to_id: Optional[str] = None


class EditMessageBody(BaseModel):
    content: str


def _get_or_create_conversation(user_id: str, peer_id: str) -> dict:
    """Return existing conversation or create one. Always stores participant_1 < participant_2."""
    p1, p2 = sorted([user_id, peer_id])
    existing = supabase_admin.table("conversations").select("*") \
        .eq("participant_1", p1).eq("participant_2", p2).execute()
    if existing.data:
        return existing.data[0]
    result = supabase_admin.table("conversations").insert({
        "participant_1": p1,
        "participant_2": p2,
    }).execute()
    return result.data[0]


@app.get("/api/messages/conversations")
async def list_conversations(authorization: str = Header(None)):
    """Return all conversations for the current user, newest first."""
    user_id = get_user_id(authorization)

    rows = supabase_admin.table("conversations").select("*").or_(
        f"participant_1.eq.{user_id},participant_2.eq.{user_id}"
    ).order("last_message_at", desc=True, nullsfirst=False).execute()

    if not rows.data:
        return {"conversations": []}

    # Get all block relationships involving this user (both directions)
    blocks_res = supabase_admin.table("blocks").select("blocker_id, blocked_id").or_(
        f"blocker_id.eq.{user_id},blocked_id.eq.{user_id}"
    ).execute()
    blocked_peers: set = set()
    for b in (blocks_res.data or []):
        blocked_peers.add(b["blocker_id"] if b["blocked_id"] == user_id else b["blocked_id"])

    peer_ids = [
        r["participant_2"] if r["participant_1"] == user_id else r["participant_1"]
        for r in rows.data
        if (r["participant_2"] if r["participant_1"] == user_id else r["participant_1"]) not in blocked_peers
    ]

    users_res = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, avatar_url"
    ).in_("id", peer_ids).execute()
    users_map = {u["id"]: u for u in (users_res.data or [])}

    conversations = []
    for row in rows.data:
        peer_id = row["participant_2"] if row["participant_1"] == user_id else row["participant_1"]
        if peer_id in blocked_peers:
            continue
        peer = users_map.get(peer_id, {})
        peer_name = (
            f"{peer.get('first_name') or ''} {peer.get('last_name') or ''}".strip()
            or peer.get("org_name") or ""
            or "Unknown"
        )
        conversations.append({
            "id": row["id"],
            "peer_id": peer_id,
            "peer_name": peer_name,
            "peer_avatar": peer.get("avatar_url"),
            "peer_title": peer.get("title") or peer.get("role") or "",
            "last_message": row.get("last_message"),
            "last_message_at": row.get("last_message_at"),
        })

    return {"conversations": conversations}


@app.post("/api/messages/conversations")
async def get_or_create_conversation(
    data: ConnectionRequestBody,  # reuse {addressee_id} body shape
    authorization: str = Header(None),
):
    """Get or create a direct conversation with a peer."""
    user_id = get_user_id(authorization)
    if data.addressee_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    if _is_either_blocked(user_id, data.addressee_id):
        raise HTTPException(status_code=403, detail="Cannot message this user")
    conv = _get_or_create_conversation(user_id, data.addressee_id)
    return {"id": conv["id"]}


@app.get("/api/messages/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, authorization: str = Header(None)):
    """Return messages in a conversation, oldest first."""
    user_id = get_user_id(authorization)

    # Verify user is a participant
    conv = supabase_admin.table("conversations").select("participant_1, participant_2") \
        .eq("id", conv_id).execute()
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    c = conv.data[0]
    if user_id not in (c["participant_1"], c["participant_2"]):
        raise HTTPException(status_code=403, detail="Not a participant")

    msgs = supabase_admin.table("direct_messages").select(
        "id, sender_id, content, message_type, file_url, file_name, reply_to_id, is_edited, is_deleted, created_at"
    ).eq("conversation_id", conv_id).order("created_at").execute()

    return {"messages": msgs.data or []}


@app.post("/api/messages/conversations/{conv_id}/messages")
async def send_message(
    conv_id: str,
    data: SendMessageBody,
    authorization: str = Header(None),
):
    """Send a message in a conversation."""
    user_id = get_user_id(authorization)

    conv = supabase_admin.table("conversations").select("participant_1, participant_2") \
        .eq("id", conv_id).execute()
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    c = conv.data[0]
    if user_id not in (c["participant_1"], c["participant_2"]):
        raise HTTPException(status_code=403, detail="Not a participant")

    peer_id = c["participant_2"] if c["participant_1"] == user_id else c["participant_1"]
    if _is_either_blocked(user_id, peer_id):
        raise HTTPException(status_code=403, detail="Cannot message this user")

    payload = {
        "conversation_id": conv_id,
        "sender_id": user_id,
        "content": data.content,
        "message_type": data.message_type,
        "file_url": data.file_url,
        "file_name": data.file_name,
        "reply_to_id": data.reply_to_id or None,
    }
    result = supabase_admin.table("direct_messages").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")

    msg = result.data[0]

    # Update conversation last message
    supabase_admin.table("conversations").update({
        "last_message": data.content if data.message_type == "text" else f"[{data.message_type}]",
        "last_message_at": msg["created_at"],
    }).eq("id", conv_id).execute()

    return msg


def _validate_uuid(value: str, field: str = "id") -> None:
    try:
        uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {field}: must be a UUID")


@app.patch("/api/messages/messages/{msg_id}")
async def edit_message(
    msg_id: str,
    data: EditMessageBody,
    authorization: str = Header(None),
):
    """Edit the text content of a sent message."""
    _validate_uuid(msg_id, "msg_id")
    user_id = get_user_id(authorization)
    result = supabase_admin.table("direct_messages").update({
        "content": data.content,
        "is_edited": True,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", msg_id).eq("sender_id", user_id).eq("is_deleted", False).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Message not found or not yours")
    return result.data[0]


@app.delete("/api/messages/messages/{msg_id}")
async def delete_message(msg_id: str, authorization: str = Header(None)):
    """Soft-delete a message (marks it deleted, clears content)."""
    _validate_uuid(msg_id, "msg_id")
    user_id = get_user_id(authorization)
    result = supabase_admin.table("direct_messages").update({
        "is_deleted": True,
        "content": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", msg_id).eq("sender_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Message not found or not yours")
    return {"message": "Deleted"}


@app.post("/api/messages/upload")
async def upload_message_file(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    """Upload a file for use in a message (image, audio, document)."""
    user_id = get_user_id(authorization)
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20 MB)")
    ext = (file.filename or "file").rsplit(".", 1)[-1].lower()
    path = f"{user_id}/messages/{int(datetime.now(timezone.utc).timestamp())}.{ext}"
    try:
        supabase_admin.storage.from_("post-media").upload(
            path=path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream", "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    url = supabase_admin.storage.from_("post-media").get_public_url(path)
    return {"url": url, "name": file.filename}


class MentionNotifyRequest(BaseModel):
    content: str
    commenter_name: str
    post_id: Optional[str] = None
    post_table: Optional[str] = None


@app.get("/api/admin/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(8, ge=1, le=100),
    authorization: str = Header(None),
):
    """Paginated list of all users for the admin General view."""
    get_user_id(authorization)

    offset = (page - 1) * per_page
    end = offset + per_page - 1

    res = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, avatar_url, user_type, role, org_type, email, created_at, deactivated_at",
        count="exact",
    ).order("created_at", desc=True).range(offset, end).execute()

    return {
        "users": res.data or [],
        "total": res.count or 0,
        "page": page,
        "per_page": per_page,
    }


@app.delete("/api/admin/users/{target_id}")
async def admin_delete_user(target_id: str, authorization: str = Header(None)):
    """Hard-delete a user (admin only). Logs to deleted_accounts_log before removal."""
    get_user_id(authorization)
    # Log the account before deleting so the Account Attribution view can show it
    try:
        profile = supabase_admin.table("users").select(
            "id, first_name, last_name, org_name, email, user_type, role, org_type, avatar_url"
        ).eq("id", target_id).execute()
        if profile.data:
            p = profile.data[0]
            supabase_admin.table("deleted_accounts_log").insert({
                "user_id": p["id"],
                "first_name": p.get("first_name"),
                "last_name": p.get("last_name"),
                "org_name": p.get("org_name"),
                "email": p.get("email"),
                "user_type": p.get("user_type"),
                "role": p.get("role"),
                "org_type": p.get("org_type"),
                "avatar_url": p.get("avatar_url"),
            }).execute()
    except Exception as log_err:
        print(f"[admin_delete_user] logging failed: {log_err}")
    try:
        supabase_admin.auth.admin.delete_user(target_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"deleted": target_id}


# ── Account Attribution endpoints ─────────────────────────────────────────────

@app.get("/api/admin/account-attribution")
async def admin_account_attribution(
    page: int = Query(1, ge=1),
    per_page: int = Query(8, ge=1, le=100),
    tab: str = Query("deactivated"),
    search: str = Query(""),
    authorization: str = Header(None),
):
    """Deactivated / Deleted accounts for the admin Account Attribution view."""
    import asyncio as _asyncio

    get_user_id(authorization)

    offset = (page - 1) * per_page
    end = offset + per_page - 1

    def _fetch_deactivated_stats():
        return supabase_admin.table("users").select("id", count="exact").not_.is_("deactivated_at", "null").execute()

    def _fetch_deleted_stats():
        return supabase_admin.table("deleted_accounts_log").select("id", count="exact").execute()

    if tab == "deleted":
        def _fetch_list():
            q = supabase_admin.table("deleted_accounts_log").select("*", count="exact")
            if search:
                q = q.or_(
                    f"first_name.ilike.%{search}%,"
                    f"last_name.ilike.%{search}%,"
                    f"org_name.ilike.%{search}%,"
                    f"email.ilike.%{search}%"
                )
            return q.order("deleted_at", desc=True).range(offset, end).execute()

        res, deact_c, del_c = await _asyncio.gather(
            _asyncio.to_thread(_fetch_list),
            _asyncio.to_thread(_fetch_deactivated_stats),
            _asyncio.to_thread(_fetch_deleted_stats),
        )

        rows = []
        for r in (res.data or []):
            rows.append({
                "id": r["id"],
                "user_id": r.get("user_id"),
                "first_name": r.get("first_name") or "",
                "last_name": r.get("last_name") or "",
                "org_name": r.get("org_name") or "",
                "email": r.get("email") or "",
                "user_type": r.get("user_type") or "individual",
                "role": r.get("role") or "",
                "org_type": r.get("org_type") or "",
                "avatar_url": r.get("avatar_url"),
                "deactivated_at": None,
                "deleted_at": r.get("deleted_at") or "",
            })
    else:
        def _fetch_list():  # type: ignore[no-redef]
            q = (
                supabase_admin.table("users")
                .select(
                    "id, first_name, last_name, org_name, avatar_url, "
                    "user_type, role, org_type, email, deactivated_at, created_at",
                    count="exact",
                )
                .not_.is_("deactivated_at", "null")
            )
            if search:
                q = q.or_(
                    f"first_name.ilike.%{search}%,"
                    f"last_name.ilike.%{search}%,"
                    f"org_name.ilike.%{search}%"
                )
            return q.order("deactivated_at", desc=True).range(offset, end).execute()

        res, deact_c, del_c = await _asyncio.gather(
            _asyncio.to_thread(_fetch_list),
            _asyncio.to_thread(_fetch_deactivated_stats),
            _asyncio.to_thread(_fetch_deleted_stats),
        )

        rows = []
        for r in (res.data or []):
            rows.append({
                "id": r["id"],
                "user_id": r["id"],
                "first_name": r.get("first_name") or "",
                "last_name": r.get("last_name") or "",
                "org_name": r.get("org_name") or "",
                "email": r.get("email") or "",
                "user_type": r.get("user_type") or "individual",
                "role": r.get("role") or "",
                "org_type": r.get("org_type") or "",
                "avatar_url": r.get("avatar_url"),
                "deactivated_at": r.get("deactivated_at") or "",
                "deleted_at": None,
            })

    return {
        "rows": rows,
        "total": res.count or 0,
        "page": page,
        "per_page": per_page,
        "stats": {
            "deactivated": deact_c.count or 0,
            "deleted": del_c.count or 0,
        },
    }


@app.patch("/api/admin/account-attribution/{user_id}/reactivate")
async def admin_reactivate_user(user_id: str, authorization: str = Header(None)):
    """Clear deactivated_at to restore a deactivated account."""
    get_user_id(authorization)
    supabase_admin.table("users").update({"deactivated_at": None}).eq("id", user_id).execute()
    return {"reactivated": user_id}


@app.get("/api/admin/stats")
async def get_admin_stats(authorization: str = Header(None)):
    """
    Admin dashboard stats. Uses the service-role client (supabase_admin)
    so all queries bypass RLS and return accurate counts.
    Requires a valid user JWT — anyone authenticated can call this for now.
    """
    get_user_id(authorization)  # validates token; raises 401 if missing/invalid

    from datetime import datetime as _dt
    now = _dt.now()
    start_of_month = _dt(now.year, now.month, 1).isoformat()

    # ── Basic counts ──────────────────────────────────────────────────────────
    total_users_res = supabase_admin.table("users").select(
        "*", count="exact"
    ).execute()

    orgs_res = supabase_admin.table("users").select(
        "*", count="exact"
    ).eq("user_type", "organization").execute()

    active_users_res = supabase_admin.table("users").select(
        "*", count="exact"
    ).is_("deactivated_at", "null").execute()

    initiatives_res = supabase_admin.table("collaborative_accomplishments").select(
        "*", count="exact"
    ).execute()

    # ── Monthly engagement ─────────────────────────────────────────────────────
    # Distinct users who posted, liked, OR commented this month — same formula
    # LinkedIn uses for Member Engagement Rate.
    posts_res = supabase_admin.table("posts").select("user_id").gte(
        "created_at", start_of_month
    ).limit(10000).execute()

    likes_res = supabase_admin.table("post_likes").select("user_id").gte(
        "created_at", start_of_month
    ).limit(10000).execute()

    comments_res = supabase_admin.table("post_comments").select("user_id").gte(
        "created_at", start_of_month
    ).limit(10000).execute()

    engaged: set = set()
    for row in (posts_res.data or []):
        engaged.add(row["user_id"])
    for row in (likes_res.data or []):
        engaged.add(row["user_id"])
    for row in (comments_res.data or []):
        engaged.add(row["user_id"])

    active_count = active_users_res.count or 0
    engagement_pct = (
        min(100, round(len(engaged) / active_count * 100))
        if active_count > 0 else 0
    )

    # ── Engagement overview counts ────────────────────────────────────────────
    media_posts_res = supabase_admin.table("posts").select(
        "*", count="exact"
    ).in_("post_type", ["photo", "video"]).execute()

    events_res = supabase_admin.table("posts").select(
        "*", count="exact"
    ).eq("post_type", "event").execute()

    polls_res = supabase_admin.table("posts").select(
        "*", count="exact"
    ).eq("post_type", "poll").execute()

    employment_posts_res = supabase_admin.table("employment_hub_postings").select(
        "*", count="exact"
    ).execute()

    learning_posts_res = supabase_admin.table("learning_courses").select(
        "*", count="exact"
    ).execute()

    # ── User categorisation ───────────────────────────────────────────────────
    # Left chart: individual users grouped by role
    individual_res = supabase_admin.table("users").select("role").eq(
        "user_type", "individual"
    ).limit(10000).execute()

    # Right chart: organisations grouped by org_type
    org_type_res = supabase_admin.table("users").select("org_type").eq(
        "user_type", "organization"
    ).limit(10000).execute()

    def _categorise(rows: list, field: str) -> list:
        counts: dict = {}
        for row in rows:
            val = (row.get(field) or "unknown").strip()
            counts[val] = counts.get(val, 0) + 1
        total = sum(counts.values()) or 1
        return [
            {"key": k, "count": v, "pct": round(v / total * 100, 1)}
            for k, v in sorted(counts.items(), key=lambda x: -x[1])
        ]

    individual_categories = _categorise(individual_res.data or [], "role")
    org_categories = _categorise(org_type_res.data or [], "org_type")

    return {
        "total_users": total_users_res.count or 0,
        "total_organisations": orgs_res.count or 0,
        "active_users": active_count,
        "completed_initiatives": initiatives_res.count or 0,
        "monthly_engagement": f"{engagement_pct}%",
        "individual_categories": individual_categories,
        "org_categories": org_categories,
        "media_posts": media_posts_res.count or 0,
        "events": events_res.count or 0,
        "polls": polls_res.count or 0,
        "employment_posts": employment_posts_res.count or 0,
        "learning_posts": learning_posts_res.count or 0,
    }


@app.get("/api/admin/client-requests")
async def admin_list_client_requests(
    page: int = Query(1, ge=1),
    per_page: int = Query(8, ge=1, le=100),
    tab: str = Query("open"),
    search: str = Query(""),
    authorization: str = Header(None),
):
    """Paginated help_center_inquiries for the admin Client Requests view."""
    import asyncio as _asyncio

    get_user_id(authorization)

    status_val = "closed" if tab == "closed" else ("cancelled" if tab == "cancelled" else "open")
    offset = (page - 1) * per_page
    end = offset + per_page - 1

    # ── Parallel I/O: list page + all-statuses for stats ─────────────────────
    def _fetch_list():
        q = (
            supabase_admin.table("help_center_inquiries")
            .select("id, user_id, name, email, category, urgency, timeline, status, created_at", count="exact")
            .eq("status", status_val)
        )
        if search:
            q = q.ilike("name", f"%{search}%")
        return q.order("created_at", desc=True).range(offset, end).execute()

    def _fetch_all_statuses():
        # One pass to derive all three counts — avoids 3 separate count queries
        return supabase_admin.table("help_center_inquiries").select("status").limit(50000).execute()

    res, statuses_res = await _asyncio.gather(
        _asyncio.to_thread(_fetch_list),
        _asyncio.to_thread(_fetch_all_statuses),
    )

    inquiries = res.data or []

    # Derive stats in-process (no extra DB round trip)
    counts: dict = {"open": 0, "closed": 0, "cancelled": 0}
    for row in (statuses_res.data or []):
        s = (row.get("status") or "open")
        if s in counts:
            counts[s] += 1

    # ── Conditional user batch (only when page has rows with user_id) ─────────
    user_ids = list({i["user_id"] for i in inquiries if i.get("user_id")})
    users_map: dict = {}
    if user_ids:
        u_res = await _asyncio.to_thread(
            lambda: supabase_admin.table("users").select(
                "id, first_name, last_name, org_name, avatar_url, user_type"
            ).in_("id", user_ids).execute()
        )
        users_map = {u["id"]: u for u in (u_res.data or [])}

    result = []
    for inq in inquiries:
        user = users_map.get(inq.get("user_id") or "", {})
        result.append({
            "id": inq["id"],
            "name": inq.get("name") or "",
            "email": inq.get("email") or "",
            "category": inq.get("category") or "",
            "urgency": inq.get("urgency") or "",
            "timeline": str(inq.get("timeline") or ""),
            "status": inq.get("status") or "open",
            "created_at": inq.get("created_at") or "",
            "user_id": inq.get("user_id"),
            "user": {
                "first_name": user.get("first_name") or "",
                "last_name": user.get("last_name") or "",
                "org_name": user.get("org_name") or "",
                "avatar_url": user.get("avatar_url"),
                "user_type": user.get("user_type") or "individual",
            } if user else None,
        })

    return {
        "inquiries": result,
        "total": res.count or 0,
        "page": page,
        "per_page": per_page,
        "stats": {
            "total": counts["open"] + counts["closed"] + counts["cancelled"],
            "open": counts["open"],
            "closed": counts["closed"],
            "cancelled": counts["cancelled"],
        },
    }


@app.get("/api/admin/client-requests/{inquiry_id}")
async def admin_get_client_request(inquiry_id: str, authorization: str = Header(None)):
    """Full detail of a single help_center_inquiry (admin only)."""
    get_user_id(authorization)
    res = supabase_admin.table("help_center_inquiries").select("*").eq("id", inquiry_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    inq = res.data[0]
    user = None
    if inq.get("user_id"):
        u_res = supabase_admin.table("users").select(
            "id, first_name, last_name, org_name, avatar_url, user_type"
        ).eq("id", inq["user_id"]).execute()
        if u_res.data:
            user = u_res.data[0]
    return {**inq, "user": user}


class UpdateInquiryStatus(BaseModel):
    status: str


@app.patch("/api/admin/client-requests/{inquiry_id}/status")
async def admin_update_client_request_status(
    inquiry_id: str,
    data: UpdateInquiryStatus,
    authorization: str = Header(None),
):
    """Update help_center_inquiry status (admin only): open | closed | cancelled."""
    get_user_id(authorization)
    if data.status not in ("open", "closed", "cancelled"):
        raise HTTPException(status_code=400, detail="status must be open, closed, or cancelled")
    supabase_admin.table("help_center_inquiries").update({"status": data.status}).eq("id", inquiry_id).execute()
    return {"updated": inquiry_id, "status": data.status}


@app.delete("/api/admin/client-requests/{inquiry_id}")
async def admin_delete_client_request(inquiry_id: str, authorization: str = Header(None)):
    """Hard-delete a help_center_inquiry (admin only)."""
    get_user_id(authorization)
    supabase_admin.table("help_center_inquiries").delete().eq("id", inquiry_id).execute()
    return {"deleted": inquiry_id}


@app.post("/api/comments/notify-mentions")
async def notify_comment_mentions(
    body: MentionNotifyRequest,
    authorization: str = Header(None),
):
    """
    Parse @slugs from comment text, resolve to user IDs via DB name matching,
    then insert notifications via direct REST POST with the caller's JWT
    (authenticated role — avoids service-role PostgREST schema cache issues).
    """
    import json as _json
    import urllib.request as _urllib
    import urllib.error

    commenter_id = get_user_id(authorization)
    access_token = (authorization or "").split(" ", 1)[-1]

    slugs = list(set(re.findall(r'@([\w]+)', body.content)))
    if not slugs:
        return {"notified": 0}

    all_users_resp = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, mention_permission"
    ).execute()
    all_users = [
        u for u in (all_users_resp.data or [])
        if (u.get("mention_permission") or "everyone") != "none"
    ]

    notified = 0
    seen_ids: set = set()

    for slug in slugs:
        slug_lower = slug.lower()
        for u in all_users:
            uid = u.get("id", "")
            if uid in seen_ids or uid == commenter_id:
                continue
            first = (u.get("first_name") or "").strip()
            last = (u.get("last_name") or "").strip()
            org = (u.get("org_name") or "").strip()

            full_name = f"{first} {last}".strip()
            candidates = set()
            if full_name:
                candidates.add(re.sub(r'\s+', '_', full_name).lower())
            if org:
                candidates.add(re.sub(r'\s+', '_', org).lower())
            if first:
                candidates.add(first.lower())
            if last:
                candidates.add(last.lower())

            if slug_lower in candidates:
                seen_ids.add(uid)
                try:
                    msg_data: dict = {
                        "text": f"{body.commenter_name} mentioned you in a comment",
                    }
                    if body.post_id:
                        msg_data["post_id"] = body.post_id
                        msg_data["post_table"] = body.post_table or "posts"
                    notif: dict = {
                        "user_id": uid,
                        "message": _json.dumps(msg_data),
                        "type": "message",
                    }
                    payload = _json.dumps(notif).encode("utf-8")
                    req = _urllib.Request(
                        f"{SUPABASE_URL}/rest/v1/notifications",
                        data=payload,
                        headers={
                            "apikey": SUPABASE_KEY,
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal",
                        },
                        method="POST",
                    )
                    try:
                        with _urllib.urlopen(req) as resp:
                            if resp.status < 300:
                                notified += 1
                    except urllib.error.HTTPError as http_err:
                        body_bytes = http_err.read()
                        print(f"[mention notify] HTTP {http_err.code} for uid={uid}: {body_bytes.decode('utf-8', errors='replace')}")
                except Exception as e:
                    print(f"[mention notify] failed for uid={uid}: {e}")

    return {"notified": notified}
