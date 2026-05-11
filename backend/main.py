import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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
