import bcrypt
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

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Impactshaala API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


class IndividualSignup(BaseModel):
    first_name: str
    last_name: str
    dob: str
    email: str
    password: str
    interests: str
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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/login")
async def login(data: LoginRequest):
    result = supabase.table("users").select(
        "id, user_type, email, password_hash, first_name, last_name, org_name"
    ).eq("email", data.email).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "user_type": user["user_type"],
            "email": user["email"],
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "org_name": user.get("org_name"),
        },
    }


@app.post("/api/signup/individual")
async def signup_individual(data: IndividualSignup):
    if not data.agreed_terms:
        raise HTTPException(status_code=400, detail="Must agree to terms and conditions")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = supabase.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    result = supabase.table("users").insert({
        "user_type": "individual",
        "email": data.email,
        "password_hash": hash_password(data.password),
        "first_name": data.first_name,
        "last_name": data.last_name,
        "dob": data.dob or None,
        "interests": data.interests,
        "agreed_terms": data.agreed_terms,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create account")

    return {"message": "Account created successfully", "id": result.data[0]["id"]}


@app.post("/api/signup/organization")
async def signup_organization(data: OrgSignup):
    if not data.agreed_terms:
        raise HTTPException(status_code=400, detail="Must agree to terms and conditions")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = supabase.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    result = supabase.table("users").insert({
        "user_type": "organization",
        "email": data.email,
        "password_hash": hash_password(data.password),
        "org_name": data.org_name,
        "org_type": data.org_type,
        "website": data.website,
        "contact_name": data.contact_name,
        "phone": data.phone,
        "agreed_terms": data.agreed_terms,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create account")

    return {"message": "Account created successfully", "id": result.data[0]["id"]}
