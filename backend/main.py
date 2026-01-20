from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from typing import List
import shutil
import os
from pathlib import Path

from database import create_db_and_tables, get_session
from models import Person, PersonCreate, PersonRead, PersonUpdate, Media, MediaCreate

app = FastAPI(
    title="Gene Tree API",
    description="API for Genealogy Tree Project",
    version="0.1.0"
)

# Configurar CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretório para uploads
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Welcome to Gene Tree API"}

# --- Person Endpoints ---

@app.post("/people/", response_model=PersonRead)
def create_person(person: PersonCreate, session: Session = Depends(get_session)):
    db_person = Person.from_orm(person)
    session.add(db_person)
    session.commit()
    session.refresh(db_person)
    return db_person

@app.get("/people/", response_model=List[PersonRead])
def read_people(offset: int = 0, limit: int = 100, search: str = None, session: Session = Depends(get_session)):
    query = select(Person)
    if search:
        # Filtra por nome ou sobrenome (case insensitive simples com like)
        query = query.where(
            (Person.first_name.contains(search)) | 
            (Person.last_name.contains(search))
        )
    people = session.exec(query.offset(offset).limit(limit)).all()
    return people

@app.get("/people/{person_id}", response_model=PersonRead)
def read_person(person_id: int, session: Session = Depends(get_session)):
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person

@app.patch("/people/{person_id}", response_model=PersonRead)
def update_person(person_id: int, person_update: PersonUpdate, session: Session = Depends(get_session)):
    db_person = session.get(Person, person_id)
    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    person_data = person_update.dict(exclude_unset=True)
    for key, value in person_data.items():
        setattr(db_person, key, value)
        
    session.add(db_person)
    session.commit()
    session.refresh(db_person)
    return db_person

# --- Upload Endpoint ---

@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...), 
    person_id: int = Form(...),
    session: Session = Depends(get_session)
):
    # Salvar arquivo
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # URL pública (assumindo rodando localmente)
    url = f"http://localhost:8000/static/uploads/{file.filename}"
    
    # Criar registro de mídia
    media_type = "video" if file.content_type.startswith("video") else "image"
    media = Media(type=media_type, url=url, person_id=person_id, title=file.filename)
    
    session.add(media)
    session.commit()
    
    return {"url": url, "media_id": media.id}

@app.post("/media/{media_id}/tag/{person_id}")
def tag_person_in_media(media_id: int, person_id: int, session: Session = Depends(get_session)):
    media = session.get(Media, media_id)
    person = session.get(Person, person_id)
    
    if not media or not person:
        raise HTTPException(status_code=404, detail="Media or Person not found")
        
    # Check duplicate
    # Simples: apenas adiciona se não existe (SQLModel/SQLAlchemy gerencia se configurado, mas vamos verificar)
    if person in media.tagged_people:
        return {"message": "Person already tagged"}
        
    media.tagged_people.append(person)
    session.add(media)
    session.commit()
    return {"message": "Tag added successfully"}

@app.delete("/media/{media_id}/tag/{person_id}")
def remove_tag(media_id: int, person_id: int, session: Session = Depends(get_session)):
    media = session.get(Media, media_id)
    person = session.get(Person, person_id)
    
    if media and person and person in media.tagged_people:
        media.tagged_people.remove(person)
        session.add(media)
        session.commit()
        
    return {"message": "Tag removed"}

