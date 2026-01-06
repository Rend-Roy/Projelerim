from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from fpdf import FPDF
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    region: str
    phone: Optional[str] = None
    address: Optional[str] = None
    visit_days: List[str] = []  # Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    region: str
    phone: Optional[str] = None
    address: Optional[str] = None
    visit_days: List[str] = []

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    visit_days: Optional[List[str]] = None

class Visit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    date: str  # YYYY-MM-DD format
    completed: bool = False
    note: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitUpdate(BaseModel):
    completed: Optional[bool] = None
    note: Optional[str] = None

# Customer endpoints
@api_router.get("/")
async def root():
    return {"message": "Müşteri Ziyaret Takip API"}

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for c in customers:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    if isinstance(customer.get('created_at'), str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customer

@api_router.post("/customers", response_model=Customer)
async def create_customer(input: CustomerCreate):
    customer_obj = Customer(**input.model_dump())
    doc = customer_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer_obj

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, input: CustomerUpdate):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    # Delete related visits
    await db.visits.delete_many({"customer_id": customer_id})
    return {"message": "Müşteri silindi"}

# Get customers for today based on visit_days
@api_router.get("/customers/today/{day_name}")
async def get_today_customers(day_name: str):
    customers = await db.customers.find(
        {"visit_days": day_name}, 
        {"_id": 0}
    ).to_list(1000)
    for c in customers:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return customers

# Visit endpoints
@api_router.get("/visits", response_model=List[Visit])
async def get_visits(date: Optional[str] = None, customer_id: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    if customer_id:
        query["customer_id"] = customer_id
    
    visits = await db.visits.find(query, {"_id": 0}).to_list(1000)
    for v in visits:
        if isinstance(v.get('created_at'), str):
            v['created_at'] = datetime.fromisoformat(v['created_at'])
        if isinstance(v.get('completed_at'), str):
            v['completed_at'] = datetime.fromisoformat(v['completed_at'])
    return visits

@api_router.get("/visits/{visit_id}", response_model=Visit)
async def get_visit(visit_id: str):
    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Ziyaret bulunamadı")
    if isinstance(visit.get('created_at'), str):
        visit['created_at'] = datetime.fromisoformat(visit['created_at'])
    if isinstance(visit.get('completed_at'), str):
        visit['completed_at'] = datetime.fromisoformat(visit['completed_at'])
    return visit

@api_router.post("/visits", response_model=Visit)
async def create_or_get_visit(customer_id: str, date: str):
    # Check if visit already exists
    existing = await db.visits.find_one({"customer_id": customer_id, "date": date}, {"_id": 0})
    if existing:
        if isinstance(existing.get('created_at'), str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        if isinstance(existing.get('completed_at'), str):
            existing['completed_at'] = datetime.fromisoformat(existing['completed_at'])
        return existing
    
    # Create new visit
    visit_obj = Visit(customer_id=customer_id, date=date)
    doc = visit_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('completed_at'):
        doc['completed_at'] = doc['completed_at'].isoformat()
    await db.visits.insert_one(doc)
    return visit_obj

@api_router.put("/visits/{visit_id}", response_model=Visit)
async def update_visit(visit_id: str, input: VisitUpdate):
    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Ziyaret bulunamadı")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if 'completed' in update_data and update_data['completed']:
        update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.visits.update_one({"id": visit_id}, {"$set": update_data})
    
    updated = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('completed_at'), str):
        updated['completed_at'] = datetime.fromisoformat(updated['completed_at'])
    return updated

# Seed sample data
@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    count = await db.customers.count_documents({})
    if count > 0:
        return {"message": "Veriler zaten mevcut", "customer_count": count}
    
    sample_customers = [
        {
            "id": str(uuid.uuid4()),
            "name": "Ahmet Yılmaz Market",
            "region": "Kadıköy",
            "phone": "0532 111 2233",
            "address": "Caferağa Mah. Moda Cad. No:15",
            "visit_days": ["Pazartesi", "Perşembe"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Elif Bakkaliye",
            "region": "Beşiktaş",
            "phone": "0533 222 3344",
            "address": "Sinanpaşa Mah. Çarşı Cad. No:8",
            "visit_days": ["Salı", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mehmet Gıda",
            "region": "Şişli",
            "phone": "0534 333 4455",
            "address": "Meşrutiyet Mah. Halaskargazi Cad. No:42",
            "visit_days": ["Pazartesi", "Çarşamba", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ayşe Manav",
            "region": "Üsküdar",
            "phone": "0535 444 5566",
            "address": "Altunizade Mah. Kısıklı Cad. No:23",
            "visit_days": ["Salı", "Perşembe", "Cumartesi"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Can Süpermarket",
            "region": "Kadıköy",
            "phone": "0536 555 6677",
            "address": "Fenerbahçe Mah. Bağdat Cad. No:156",
            "visit_days": ["Çarşamba", "Cumartesi"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Demir Ticaret",
            "region": "Maltepe",
            "phone": "0537 666 7788",
            "address": "Cevizli Mah. D-100 Yan Yol No:88",
            "visit_days": ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Güneş Market",
            "region": "Ataşehir",
            "phone": "0538 777 8899",
            "address": "İçerenköy Mah. Kayışdağı Cad. No:34",
            "visit_days": ["Perşembe", "Pazar"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Yıldız Bakkal",
            "region": "Beşiktaş",
            "phone": "0539 888 9900",
            "address": "Levent Mah. Nispetiye Cad. No:67",
            "visit_days": ["Pazartesi", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.customers.insert_many(sample_customers)
    return {"message": "Örnek veriler eklendi", "customer_count": len(sample_customers)}

# PDF Report endpoint
@api_router.get("/report/pdf/{day_name}/{date}")
async def generate_daily_report_pdf(day_name: str, date: str):
    """Generate daily visit report as PDF"""
    
    # Get customers for this day
    customers = await db.customers.find(
        {"visit_days": day_name}, 
        {"_id": 0}
    ).to_list(1000)
    
    # Get visits for this date
    visits = await db.visits.find({"date": date}, {"_id": 0}).to_list(1000)
    visits_map = {v["customer_id"]: v for v in visits}
    
    # Calculate stats
    total_count = len(customers)
    completed_count = sum(1 for c in customers if visits_map.get(c["id"], {}).get("completed", False))
    pending_count = total_count - completed_count
    
    # Create PDF
    pdf = FPDF()
    pdf.add_page()
    
    # Add Unicode font for Turkish characters
    pdf.add_font("DejaVu", "", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", uni=True)
    pdf.add_font("DejaVu", "B", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", uni=True)
    
    # Header
    pdf.set_font("DejaVu", "B", 18)
    pdf.set_text_color(15, 23, 42)  # slate-900
    pdf.cell(0, 15, "Günlük Müşteri Ziyaret Raporu", ln=True, align="C")
    
    # Date info
    pdf.set_font("DejaVu", "", 12)
    pdf.set_text_color(71, 85, 105)  # slate-500
    pdf.cell(0, 10, f"{day_name}, {date}", ln=True, align="C")
    
    pdf.ln(10)
    
    # Summary box
    pdf.set_fill_color(248, 250, 252)  # slate-50
    pdf.set_draw_color(226, 232, 240)  # slate-200
    pdf.rect(15, pdf.get_y(), 180, 35, "DF")
    
    pdf.set_font("DejaVu", "B", 11)
    pdf.set_text_color(15, 23, 42)
    
    y_start = pdf.get_y() + 5
    pdf.set_xy(20, y_start)
    pdf.cell(50, 8, "Toplam Ziyaret:", ln=False)
    pdf.set_font("DejaVu", "", 11)
    pdf.cell(30, 8, str(total_count), ln=True)
    
    pdf.set_font("DejaVu", "B", 11)
    pdf.set_xy(20, y_start + 10)
    pdf.set_text_color(16, 185, 129)  # green-500
    pdf.cell(50, 8, "Ziyaret Edilen:", ln=False)
    pdf.set_font("DejaVu", "", 11)
    pdf.cell(30, 8, str(completed_count), ln=True)
    
    pdf.set_font("DejaVu", "B", 11)
    pdf.set_xy(20, y_start + 20)
    pdf.set_text_color(239, 68, 68)  # red-500
    pdf.cell(50, 8, "Ziyaret Edilmeyen:", ln=False)
    pdf.set_font("DejaVu", "", 11)
    pdf.cell(30, 8, str(pending_count), ln=True)
    
    pdf.ln(25)
    
    # Customer details header
    pdf.set_font("DejaVu", "B", 14)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 10, "Müşteri Detayları", ln=True)
    
    pdf.ln(3)
    
    # Table header
    pdf.set_fill_color(241, 245, 249)  # slate-100
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_text_color(51, 65, 85)  # slate-700
    pdf.cell(70, 10, "Müşteri Adı", border=1, fill=True)
    pdf.cell(35, 10, "Bölge", border=1, fill=True)
    pdf.cell(35, 10, "Durum", border=1, fill=True)
    pdf.cell(50, 10, "Not", border=1, fill=True, ln=True)
    
    # Table rows
    pdf.set_font("DejaVu", "", 9)
    for customer in customers:
        visit = visits_map.get(customer["id"], {})
        is_completed = visit.get("completed", False)
        note = visit.get("note", "") or "-"
        
        # Truncate note if too long
        if len(note) > 30:
            note = note[:27] + "..."
        
        pdf.set_text_color(51, 65, 85)
        pdf.cell(70, 9, customer["name"][:35], border=1)
        pdf.cell(35, 9, customer["region"], border=1)
        
        if is_completed:
            pdf.set_text_color(16, 185, 129)  # green
            status = "Ziyaret Edildi"
        else:
            pdf.set_text_color(239, 68, 68)  # red
            status = "Bekliyor"
        
        pdf.cell(35, 9, status, border=1)
        pdf.set_text_color(51, 65, 85)
        pdf.cell(50, 9, note, border=1, ln=True)
    
    # Footer
    pdf.ln(15)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(148, 163, 184)  # slate-400
    pdf.cell(0, 5, f"Rapor oluşturma tarihi: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M')}", ln=True, align="C")
    
    # Output PDF
    pdf_output = io.BytesIO()
    pdf_content = pdf.output()
    pdf_output.write(pdf_content)
    pdf_output.seek(0)
    
    filename = f"ziyaret_raporu_{date}.pdf"
    
    return StreamingResponse(
        pdf_output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
