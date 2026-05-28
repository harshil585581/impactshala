import os
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
    interests: str
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
        if not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_resp.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


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
async def track_impression(data: TrackRequest, authorization: Optional[str] = Header(None)):
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
    documents: List[UploadFile] = File(default=[]),
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
