import os
from typing import Any, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    languages: Optional[str] = None
    skills: Optional[List[str]] = None
    social_links: Optional[List[Any]] = None
    reach_for: Optional[List[str]] = None
    work_sector: Optional[str] = None
    work_industry: Optional[str] = None
    teach_subject: Optional[str] = None
    experience_years: Optional[str] = None
    entrepreneur_type: Optional[str] = None
    describe_as: Optional[str] = None
    website: Optional[str] = None
    setup_complete: Optional[bool] = None
    education_level: Optional[str] = None
    institute_name: Optional[str] = None
    resume_url: Optional[str] = None


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
