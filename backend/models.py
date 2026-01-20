from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import date

# 1. Forward References
# Precisamos disto pois Person refere-se a Media e Media a Person
# Mas SQLModel resolve strings bem.

# 2. Association Table (Definida primeiro)
class MediaTag(SQLModel, table=True):
    media_id: Optional[int] = Field(default=None, foreign_key="media.id", primary_key=True)
    person_id: Optional[int] = Field(default=None, foreign_key="person.id", primary_key=True)

# 3. Base Models
class PersonBase(SQLModel):
    first_name: str
    last_name: str
    gender: str = Field(default="other")
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    
    father_id: Optional[int] = Field(default=None, foreign_key="person.id", nullable=True)
    mother_id: Optional[int] = Field(default=None, foreign_key="person.id", nullable=True)

class MediaBase(SQLModel):
    type: str # 'image' | 'video'
    url: str
    title: Optional[str] = None
    person_id: Optional[int] = Field(default=None, foreign_key="person.id")

# 4. Table Models
class Media(MediaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    person: Optional["Person"] = Relationship(back_populates="media_items")
    tagged_people: List["Person"] = Relationship(back_populates="tagged_in_media", link_model=MediaTag)

class Person(PersonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    media_items: List["Media"] = Relationship(back_populates="person")
    tagged_in_media: List["Media"] = Relationship(back_populates="tagged_people", link_model=MediaTag)

# 5. DTOs (Data Transfer Objects) / Schemas
class PersonCreate(PersonBase):
    pass

class MediaCreate(MediaBase):
    pass

# Para leitura, queremos evitar loops infinitos.
# PersonRead mostra MediaReadSimple?
# MediaRead mostra PersonReadSimple?

class PersonReadSimple(PersonBase):
    id: int

class MediaRead(MediaBase):
    id: int
    tagged_people: List[PersonReadSimple] = []

class PersonRead(PersonBase):
    id: int
    media_items: List[MediaRead] = []

class PersonUpdate(SQLModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
