from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
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
from openpyxl import load_workbook

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
    price_status: str = "Standart"  # İskontolu veya Standart
    visit_days: List[str] = []  # Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    region: str
    phone: Optional[str] = None
    address: Optional[str] = None
    price_status: str = "Standart"
    visit_days: List[str] = []

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    price_status: Optional[str] = None
    visit_days: Optional[List[str]] = None

class Visit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    date: str  # YYYY-MM-DD format
    completed: bool = False
    visit_skip_reason: Optional[str] = None  # Ziyaret edilmediyse sebebi
    payment_collected: bool = False  # Tahsilat yapıldı mı
    payment_skip_reason: Optional[str] = None  # Tahsilat yapılmadıysa sebebi
    payment_type: Optional[str] = None  # Nakit, Kredi Kartı, Havale, Çek
    payment_amount: Optional[float] = None  # Tahsilat tutarı
    customer_request: Optional[str] = None  # Müşteri özel talep/notu
    note: Optional[str] = None  # Genel not
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitUpdate(BaseModel):
    completed: Optional[bool] = None
    visit_skip_reason: Optional[str] = None
    payment_collected: Optional[bool] = None
    payment_skip_reason: Optional[str] = None
    payment_type: Optional[str] = None
    payment_amount: Optional[float] = None
    customer_request: Optional[str] = None
    note: Optional[str] = None

# Daily Report Note model
class DailyReportNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD format
    note: str  # Gün sonu genel notu
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyReportNoteUpdate(BaseModel):
    note: str

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

# Download sample Excel template - MUST be before /{customer_id} route
@api_router.get("/customers/template")
async def download_template():
    """Örnek Excel şablonu indir"""
    from openpyxl import Workbook
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Müşteriler"
    
    # Headers
    headers = ["Müşteri Adı", "Bölge", "Telefon", "Adres", "Fiyat Statüsü", "Ziyaret Günleri"]
    for col, header in enumerate(headers, 1):
        ws.cell(row=1, column=col, value=header)
    
    # Sample data
    sample_data = [
        ["Örnek Market", "Kadıköy", "0532 111 2233", "Moda Cad. No:15", "Standart", "Pazartesi, Çarşamba, Cuma"],
        ["ABC Bakkaliye", "Beşiktaş", "0533 222 3344", "Çarşı Cad. No:8", "İskontolu", "Salı, Perşembe"],
    ]
    for row_num, row_data in enumerate(sample_data, 2):
        for col, value in enumerate(row_data, 1):
            ws.cell(row=row_num, column=col, value=value)
    
    # Adjust column widths
    ws.column_dimensions['A'].width = 25
    ws.column_dimensions['B'].width = 15
    ws.column_dimensions['C'].width = 18
    ws.column_dimensions['D'].width = 30
    ws.column_dimensions['E'].width = 15
    ws.column_dimensions['F'].width = 35
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=musteri_sablonu.xlsx"}
    )

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
    
    update_data = {}
    for k, v in input.model_dump().items():
        if v is not None:
            update_data[k] = v
        elif k in ['visit_skip_reason', 'payment_skip_reason', 'payment_type', 'payment_amount', 'customer_request', 'note']:
            # Allow clearing these fields
            if input.model_dump(exclude_unset=True).get(k) is not None or k in input.model_dump(exclude_unset=True):
                update_data[k] = v
    
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

# Daily Report Note endpoints
@api_router.get("/daily-note/{date}")
async def get_daily_note(date: str):
    note = await db.daily_notes.find_one({"date": date}, {"_id": 0})
    if not note:
        return {"date": date, "note": ""}
    return note

@api_router.post("/daily-note/{date}")
async def save_daily_note(date: str, input: DailyReportNoteUpdate):
    existing = await db.daily_notes.find_one({"date": date})
    if existing:
        await db.daily_notes.update_one({"date": date}, {"$set": {"note": input.note}})
    else:
        note_obj = DailyReportNote(date=date, note=input.note)
        doc = note_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.daily_notes.insert_one(doc)
    return {"message": "Not kaydedildi", "date": date}

# Excel Upload endpoint
@api_router.post("/customers/upload")
async def upload_customers_excel(file: UploadFile = File(...)):
    """
    Excel dosyasından toplu müşteri yükleme.
    Gerekli sütunlar: Müşteri Adı, Bölge
    Opsiyonel sütunlar: Telefon, Adres, Fiyat Statüsü, Ziyaret Günleri
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Sadece Excel dosyaları (.xlsx, .xls) kabul edilir")
    
    try:
        contents = await file.read()
        wb = load_workbook(filename=io.BytesIO(contents))
        ws = wb.active
        
        # Get headers from first row
        headers = []
        for cell in ws[1]:
            headers.append(str(cell.value).strip().lower() if cell.value else "")
        
        # Map column names (Turkish to English)
        column_map = {
            'müşteri adı': 'name',
            'musteri adi': 'name',
            'ad': 'name',
            'isim': 'name',
            'name': 'name',
            'bölge': 'region',
            'bolge': 'region',
            'region': 'region',
            'telefon': 'phone',
            'tel': 'phone',
            'phone': 'phone',
            'adres': 'address',
            'address': 'address',
            'fiyat statüsü': 'price_status',
            'fiyat statusu': 'price_status',
            'fiyat': 'price_status',
            'statü': 'price_status',
            'price_status': 'price_status',
            'ziyaret günleri': 'visit_days',
            'ziyaret gunleri': 'visit_days',
            'günler': 'visit_days',
            'visit_days': 'visit_days',
        }
        
        # Find column indices
        col_indices = {}
        for i, header in enumerate(headers):
            mapped = column_map.get(header)
            if mapped:
                col_indices[mapped] = i
        
        # Check required columns
        if 'name' not in col_indices:
            raise HTTPException(status_code=400, detail="'Müşteri Adı' sütunu bulunamadı")
        if 'region' not in col_indices:
            raise HTTPException(status_code=400, detail="'Bölge' sütunu bulunamadı")
        
        customers_to_add = []
        errors = []
        row_num = 1
        
        for row in ws.iter_rows(min_row=2, values_only=True):
            row_num += 1
            
            # Skip empty rows
            if not any(row):
                continue
            
            name = str(row[col_indices['name']]).strip() if row[col_indices['name']] else ""
            region = str(row[col_indices['region']]).strip() if row[col_indices['region']] else ""
            
            if not name or not region:
                errors.append(f"Satır {row_num}: Müşteri adı veya bölge boş")
                continue
            
            customer = {
                "id": str(uuid.uuid4()),
                "name": name,
                "region": region,
                "phone": str(row[col_indices.get('phone', -1)]).strip() if col_indices.get('phone') is not None and row[col_indices['phone']] else None,
                "address": str(row[col_indices.get('address', -1)]).strip() if col_indices.get('address') is not None and row[col_indices['address']] else None,
                "price_status": "Standart",
                "visit_days": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Handle price_status
            if 'price_status' in col_indices and row[col_indices['price_status']]:
                ps = str(row[col_indices['price_status']]).strip().lower()
                if ps in ['iskontolu', 'iskonto', 'indirimli', 'özel']:
                    customer['price_status'] = "İskontolu"
            
            # Handle visit_days
            if 'visit_days' in col_indices and row[col_indices['visit_days']]:
                days_str = str(row[col_indices['visit_days']]).strip()
                valid_days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
                customer['visit_days'] = [d.strip() for d in days_str.split(',') if d.strip() in valid_days]
            
            customers_to_add.append(customer)
        
        if not customers_to_add:
            raise HTTPException(status_code=400, detail="Yüklenecek geçerli müşteri bulunamadı")
        
        # Insert customers
        await db.customers.insert_many(customers_to_add)
        
        return {
            "message": f"{len(customers_to_add)} müşteri başarıyla yüklendi",
            "added_count": len(customers_to_add),
            "errors": errors[:10] if errors else []  # Return first 10 errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya işlenirken hata: {str(e)}")

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
            "price_status": "İskontolu",
            "visit_days": ["Pazartesi", "Perşembe"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Elif Bakkaliye",
            "region": "Beşiktaş",
            "phone": "0533 222 3344",
            "address": "Sinanpaşa Mah. Çarşı Cad. No:8",
            "price_status": "Standart",
            "visit_days": ["Salı", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mehmet Gıda",
            "region": "Şişli",
            "phone": "0534 333 4455",
            "address": "Meşrutiyet Mah. Halaskargazi Cad. No:42",
            "price_status": "İskontolu",
            "visit_days": ["Pazartesi", "Çarşamba", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ayşe Manav",
            "region": "Üsküdar",
            "phone": "0535 444 5566",
            "address": "Altunizade Mah. Kısıklı Cad. No:23",
            "price_status": "Standart",
            "visit_days": ["Salı", "Perşembe", "Cumartesi"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Can Süpermarket",
            "region": "Kadıköy",
            "phone": "0536 555 6677",
            "address": "Fenerbahçe Mah. Bağdat Cad. No:156",
            "price_status": "Standart",
            "visit_days": ["Çarşamba", "Cumartesi"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Demir Ticaret",
            "region": "Maltepe",
            "phone": "0537 666 7788",
            "address": "Cevizli Mah. D-100 Yan Yol No:88",
            "price_status": "İskontolu",
            "visit_days": ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Güneş Market",
            "region": "Ataşehir",
            "phone": "0538 777 8899",
            "address": "İçerenköy Mah. Kayışdağı Cad. No:34",
            "price_status": "Standart",
            "visit_days": ["Perşembe", "Pazar"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Yıldız Bakkal",
            "region": "Beşiktaş",
            "phone": "0539 888 9900",
            "address": "Levent Mah. Nispetiye Cad. No:67",
            "price_status": "İskontolu",
            "visit_days": ["Pazartesi", "Cuma"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.customers.insert_many(sample_customers)
    return {"message": "Örnek veriler eklendi", "customer_count": len(sample_customers)}

# PDF Report endpoint
@api_router.get("/report/pdf/{day_name}/{date}")
async def generate_daily_report_pdf(day_name: str, date: str):
    """Generate comprehensive daily visit report as PDF"""
    
    # Get customers for this day
    customers = await db.customers.find(
        {"visit_days": day_name}, 
        {"_id": 0}
    ).to_list(1000)
    
    # Get visits for this date
    visits = await db.visits.find({"date": date}, {"_id": 0}).to_list(1000)
    visits_map = {v["customer_id"]: v for v in visits}
    
    # Get new customers added today
    all_customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    new_customers = []
    for c in all_customers:
        created = c.get('created_at', '')
        if isinstance(created, str) and created.startswith(date):
            new_customers.append(c)
        elif hasattr(created, 'strftime') and created.strftime('%Y-%m-%d') == date:
            new_customers.append(c)
    
    # Get daily note
    daily_note = await db.daily_notes.find_one({"date": date}, {"_id": 0})
    daily_note_text = daily_note.get("note", "") if daily_note else ""
    
    # Calculate stats
    total_count = len(customers)
    completed_count = sum(1 for c in customers if visits_map.get(c["id"], {}).get("completed", False))
    pending_count = total_count - completed_count
    
    # Calculate payment stats
    total_payment = 0
    payment_count = 0
    for c in customers:
        visit = visits_map.get(c["id"], {})
        if visit.get("payment_collected"):
            payment_count += 1
            total_payment += visit.get("payment_amount", 0) or 0
    
    # Create PDF
    pdf = FPDF()
    pdf.add_page()
    
    # Add Unicode font for Turkish characters
    pdf.add_font("DejaVu", "", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", uni=True)
    pdf.add_font("DejaVu", "B", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", uni=True)
    
    # ===== HEADER =====
    pdf.set_font("DejaVu", "B", 20)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 12, "GÜNLÜK MÜŞTERİ ZİYARET RAPORU", ln=True, align="C")
    
    pdf.set_font("DejaVu", "", 12)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 8, f"{day_name}, {date}", ln=True, align="C")
    
    pdf.ln(8)
    
    # ===== ÖZET BÖLÜMÜ =====
    pdf.set_fill_color(241, 245, 249)
    pdf.set_draw_color(203, 213, 225)
    pdf.rect(10, pdf.get_y(), 190, 45, "DF")
    
    y_start = pdf.get_y() + 5
    
    # Sol kolon - Ziyaret özeti
    pdf.set_font("DejaVu", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.set_xy(15, y_start)
    pdf.cell(80, 7, "ZİYARET ÖZETİ", ln=True)
    
    pdf.set_font("DejaVu", "", 10)
    pdf.set_xy(15, y_start + 10)
    pdf.cell(45, 6, "Toplam Planlanan:")
    pdf.set_font("DejaVu", "B", 10)
    pdf.cell(30, 6, str(total_count), ln=True)
    
    pdf.set_font("DejaVu", "", 10)
    pdf.set_xy(15, y_start + 18)
    pdf.set_text_color(16, 185, 129)
    pdf.cell(45, 6, "Ziyaret Edilen:")
    pdf.set_font("DejaVu", "B", 10)
    pdf.cell(30, 6, str(completed_count), ln=True)
    
    pdf.set_font("DejaVu", "", 10)
    pdf.set_xy(15, y_start + 26)
    pdf.set_text_color(239, 68, 68)
    pdf.cell(45, 6, "Ziyaret Edilmeyen:")
    pdf.set_font("DejaVu", "B", 10)
    pdf.cell(30, 6, str(pending_count), ln=True)
    
    # Sağ kolon - Tahsilat özeti
    pdf.set_font("DejaVu", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.set_xy(110, y_start)
    pdf.cell(80, 7, "TAHSİLAT ÖZETİ", ln=True)
    
    pdf.set_font("DejaVu", "", 10)
    pdf.set_xy(110, y_start + 10)
    pdf.cell(45, 6, "Tahsilat Yapılan:")
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_text_color(16, 185, 129)
    pdf.cell(30, 6, str(payment_count), ln=True)
    
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.set_xy(110, y_start + 18)
    pdf.cell(45, 6, "Toplam Tahsilat:")
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_text_color(0, 85, 255)
    pdf.cell(30, 6, f"{total_payment:,.2f} TL", ln=True)
    
    pdf.ln(35)
    
    # ===== MÜŞTERİ DETAYLARI =====
    pdf.set_font("DejaVu", "B", 14)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 10, "MÜŞTERİ ZİYARET DETAYLARI", ln=True)
    pdf.ln(2)
    
    for i, customer in enumerate(customers):
        visit = visits_map.get(customer["id"], {})
        is_completed = visit.get("completed", False)
        price_status = customer.get("price_status", "Standart")
        
        # Check if we need a new page
        if pdf.get_y() > 230:
            pdf.add_page()
        
        # Customer card background
        card_height = 35
        if visit.get("customer_request"):
            card_height += 8
        if not is_completed and visit.get("visit_skip_reason"):
            card_height += 8
        if visit.get("payment_collected") or visit.get("payment_skip_reason"):
            card_height += 8
            
        pdf.set_fill_color(255, 255, 255)
        pdf.set_draw_color(226, 232, 240)
        pdf.rect(10, pdf.get_y(), 190, card_height, "DF")
        
        y_card = pdf.get_y() + 3
        
        # Müşteri adı ve bölge
        pdf.set_font("DejaVu", "B", 11)
        pdf.set_text_color(15, 23, 42)
        pdf.set_xy(15, y_card)
        pdf.cell(85, 6, f"{i+1}. {customer['name'][:35]}")
        
        pdf.set_font("DejaVu", "", 9)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(30, 6, f"({customer['region']})")
        
        # Fiyat statüsü badge
        if price_status == "İskontolu":
            pdf.set_fill_color(254, 243, 199)  # amber-100
            pdf.set_text_color(180, 83, 9)  # amber-700
        else:
            pdf.set_fill_color(241, 245, 249)  # slate-100
            pdf.set_text_color(71, 85, 105)  # slate-600
        pdf.cell(25, 6, price_status, align="C", fill=True)
        
        # Ziyaret durumu badge
        pdf.set_xy(160, y_card)
        if is_completed:
            pdf.set_fill_color(220, 252, 231)
            pdf.set_text_color(22, 163, 74)
            pdf.cell(35, 6, "ZİYARET EDİLDİ", align="C", fill=True)
        else:
            pdf.set_fill_color(254, 226, 226)
            pdf.set_text_color(220, 38, 38)
            pdf.cell(35, 6, "ZİYARET EDİLMEDİ", align="C", fill=True)
        
        y_line = y_card + 10
        
        # Ziyaret edilmediyse sebebi
        if not is_completed and visit.get("visit_skip_reason"):
            pdf.set_font("DejaVu", "", 9)
            pdf.set_text_color(220, 38, 38)
            pdf.set_xy(15, y_line)
            pdf.cell(0, 5, f"Ziyaret Edilmeme Sebebi: {visit['visit_skip_reason'][:60]}", ln=True)
            y_line += 8
        
        # Tahsilat bilgisi
        pdf.set_xy(15, y_line)
        pdf.set_font("DejaVu", "", 9)
        if visit.get("payment_collected"):
            pdf.set_text_color(22, 163, 74)
            payment_type = visit.get("payment_type", "Belirtilmemiş")
            payment_amount = visit.get("payment_amount", 0) or 0
            pdf.cell(0, 5, f"Tahsilat: {payment_type} - {payment_amount:,.2f} TL", ln=True)
        elif visit.get("payment_skip_reason"):
            pdf.set_text_color(234, 88, 12)
            pdf.cell(0, 5, f"Tahsilat Yapılmadı: {visit['payment_skip_reason'][:50]}", ln=True)
        else:
            pdf.set_text_color(100, 116, 139)
            pdf.cell(0, 5, "Tahsilat: Bilgi girilmemiş", ln=True)
        y_line += 8
        
        # Müşteri talebi/notu
        if visit.get("customer_request"):
            pdf.set_xy(15, y_line)
            pdf.set_font("DejaVu", "", 9)
            pdf.set_text_color(59, 130, 246)
            pdf.cell(0, 5, f"Müşteri Talebi: {visit['customer_request'][:70]}", ln=True)
            y_line += 8
        
        # Genel not
        if visit.get("note"):
            pdf.set_xy(15, y_line)
            pdf.set_font("DejaVu", "", 9)
            pdf.set_text_color(71, 85, 105)
            pdf.cell(0, 5, f"Not: {visit['note'][:70]}", ln=True)
        
        pdf.ln(card_height + 3)
    
    # ===== YENİ MÜŞTERİLER =====
    if new_customers:
        if pdf.get_y() > 200:
            pdf.add_page()
        
        pdf.ln(5)
        pdf.set_font("DejaVu", "B", 14)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 10, "BUGÜN EKLENEN YENİ MÜŞTERİLER (YENİ CARİ)", ln=True)
        
        # Table header
        pdf.set_fill_color(219, 234, 254)
        pdf.set_draw_color(147, 197, 253)
        pdf.set_font("DejaVu", "B", 9)
        pdf.set_text_color(30, 64, 175)
        pdf.cell(60, 8, "Müşteri Adı", border=1, fill=True)
        pdf.cell(35, 8, "Bölge", border=1, fill=True)
        pdf.cell(35, 8, "Fiyat Statüsü", border=1, fill=True)
        pdf.cell(60, 8, "Telefon", border=1, fill=True, ln=True)
        
        pdf.set_font("DejaVu", "", 9)
        for nc in new_customers:
            pdf.set_text_color(30, 64, 175)
            pdf.cell(60, 8, nc['name'][:30], border=1, fill=True)
            pdf.cell(35, 8, nc['region'], border=1, fill=True)
            price_st = nc.get('price_status', 'Standart')
            pdf.cell(35, 8, price_st, border=1, fill=True)
            pdf.cell(60, 8, nc.get('phone', '-'), border=1, fill=True, ln=True)
    
    # ===== GÜN SONU NOTU =====
    if daily_note_text:
        if pdf.get_y() > 220:
            pdf.add_page()
        
        pdf.ln(10)
        pdf.set_font("DejaVu", "B", 14)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 10, "SATIŞ TEMSİLCİSİ GÜN SONU NOTU", ln=True)
        
        pdf.set_fill_color(254, 252, 232)
        pdf.set_draw_color(250, 204, 21)
        pdf.rect(10, pdf.get_y(), 190, 25, "DF")
        
        pdf.set_font("DejaVu", "", 10)
        pdf.set_text_color(113, 63, 18)
        pdf.set_xy(15, pdf.get_y() + 5)
        pdf.multi_cell(180, 6, daily_note_text[:300])
    
    # ===== FOOTER =====
    pdf.ln(15)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 5, f"Rapor oluşturma tarihi: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M')} UTC", ln=True, align="C")
    pdf.cell(0, 5, "Bu rapor otomatik olarak oluşturulmuştur.", ln=True, align="C")
    
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
