import os
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI(title="Impactshaala API")


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
    interests: str
    role: Optional[str] = None
    agreed_terms: bool


class OrgSignup(BaseModel):
    org_name: str
    org_type: str
    website: Optional[str] = None
    contact_name: str
    email: str
    phone: Optional[str] = None
    password: str
    agreed_terms: bool


class LoginRequest(BaseModel):
    email: str
    password: str


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


@app.post("/api/login")
async def login(data: LoginRequest):
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
        "user_type, role, first_name, last_name, org_name"
    ).eq("id", user_id).execute()

    profile_data = profile.data[0] if profile.data else {}

    return {
        "message": "Login successful",
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
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


@app.get("/api/profile/{user_id}")
async def get_public_profile(user_id: str, authorization: str = Header(None)):
    """Return a public profile for any user by ID (requires auth)."""
    get_user_id(authorization)  # verify caller is logged in
    result = supabase_admin.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]


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


@app.get("/api/profile/resume")
async def get_resume_url(authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    result = supabase_admin.table("users").select("resume_url").eq("id", user_id).execute()
    if not result.data or not result.data[0].get("resume_url"):
        raise HTTPException(status_code=404, detail="No resume uploaded")
    path = result.data[0]["resume_url"]
    signed = supabase_admin.storage.from_("documents").create_signed_url(path, 3600)
    return {"url": signed.get("signedURL") or signed.get("signed_url") or ""}


@app.post("/api/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    user_id = get_user_id(authorization)
    ext = (file.filename or "document.pdf").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    content = await file.read()
    if len(content) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 12 MB limit")
    bucket = "documents"
    path = f"{user_id}/resume.pdf"
    try:
        supabase_admin.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": "application/pdf", "upsert": "true"},
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
        "*, user:users(first_name, last_name, org_name, avatar_url)"
    ).eq("status", "published")

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


def _row_to_item(row: dict, bookmarked_ids: set) -> dict:
    user_data = row.get("users") or {}
    name = (
        user_data.get("org_name")
        or f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
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
        "slug": row["id"],
        "opportunityNotes": row.get("body") or "",
        "description": row.get("body") or "",
        "onsiteVenue": row.get("onsite_venue") or "",
        "onlineAccess": row.get("online_access") or "",
    }


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
    post_type = "seeker" if tab == "seekers" else "provider"

    query = (
        supabase_admin.table("discover_posts")
        .select("*, users!discover_posts_user_id_fkey(first_name, last_name, org_name, avatar_url, role, title, company)")
        .eq("post_type", post_type)
        .eq("visibility", "public")
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
    if user_id:
        bm = supabase_admin.table("discover_bookmarks").select("post_id").eq("user_id", user_id).execute()
        bookmarked_ids = {r["post_id"] for r in (bm.data or [])}

    rows = result.data or []
    items = [_row_to_item(r, bookmarked_ids) for r in rows]
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
    documents: List[UploadFile] = File(default=[]),  # noqa: ARG001
    authorization: Optional[str] = Header(None),
):
    user_id = _optional_user_id(authorization)
    result = supabase_admin.table("discover_applications").insert({
        "post_id": postId,
        "user_id": user_id,
        "name": name,
        "email": email,
        "phone": phone,
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
    eligibilityCriteria: Optional[str] = None
    lastDateToApply: Optional[str] = None
    fee: Optional[str] = None
    onsiteVenue: Optional[str] = None
    onlineAccess: Optional[str] = None
    description: Optional[str] = None
    coverImageUrl: Optional[str] = None
    visibleTo: str = "public"
    weeklySlots: Optional[List[dict]] = None


@app.post("/api/discover/create/provider")
async def create_provider_post(data: ProviderPostCreate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)  # type: ignore[arg-type]
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
        "eligibility_criteria": data.eligibilityCriteria,
        "last_date_to_apply": data.lastDateToApply or None,
        "fee": data.fee,
        "onsite_venue": data.onsiteVenue,
        "online_access": data.onlineAccess,
        "weekly_slots": data.weeklySlots or [],
    }).execute()
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

    connections = []
    for row in rows.data:
        peer_id = row["addressee_id"] if row["requester_id"] == user_id else row["requester_id"]
        peer = users_map.get(peer_id)
        if not peer:
            continue
        formatted = _format_user(peer)
        formatted["connection_id"] = row["id"]
        formatted["connected_at"] = row["created_at"]
        if q and q.lower() not in formatted["name"].lower():
            continue
        connections.append(formatted)

    return {"connections": connections, "total": len(connections)}


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

    requests = []
    for row in rows.data:
        peer = users_map.get(row["requester_id"])
        if not peer:
            continue
        formatted = _format_user(peer)
        formatted["request_id"] = row["id"]
        formatted["requested_at"] = row["created_at"]
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
    """Return users who are not yet connected or pending with the current user."""
    user_id = get_user_id(authorization)

    existing = supabase_admin.table("community_connections").select(
        "requester_id, addressee_id"
    ).or_(
        f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
    ).execute()

    excluded_ids = {user_id}
    for row in (existing.data or []):
        excluded_ids.add(row["requester_id"])
        excluded_ids.add(row["addressee_id"])

    all_users = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, company, avatar_url, cover_url"
    ).limit(50).execute()

    # Collect candidate IDs first
    candidate_ids = [u["id"] for u in (all_users.data or []) if u["id"] not in excluded_ids]

    # Batch-fetch achievement counts for all candidates
    achievement_counts: dict[str, int] = {}
    if candidate_ids:
        try:
            ach_rows = supabase_admin.table("personal_achievements").select(
                "user_id"
            ).in_("user_id", candidate_ids).execute()
            for row in (ach_rows.data or []):
                uid = row["user_id"]
                achievement_counts[uid] = achievement_counts.get(uid, 0) + 1
        except Exception:
            pass  # table may not exist yet

    suggestions = []
    for u in (all_users.data or []):
        if u["id"] in excluded_ids:
            continue
        formatted = _format_user(u)
        uid = u["id"]
        formatted["endorsement_count"] = 0
        formatted["review_count"] = 0
        formatted["achievement_count"] = achievement_counts.get(uid, 0)
        suggestions.append(formatted)

    return {"suggestions": suggestions}


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

    peer_ids = [
        r["participant_2"] if r["participant_1"] == user_id else r["participant_1"]
        for r in rows.data
    ]

    users_res = supabase_admin.table("users").select(
        "id, first_name, last_name, org_name, title, role, avatar_url"
    ).in_("id", peer_ids).execute()
    users_map = {u["id"]: u for u in (users_res.data or [])}

    conversations = []
    for row in rows.data:
        peer_id = row["participant_2"] if row["participant_1"] == user_id else row["participant_1"]
        peer = users_map.get(peer_id, {})
        peer_name = (
            f"{peer.get('first_name', '')} {peer.get('last_name', '')}".strip()
            or peer.get("org_name", "")
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
