from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Person
from datetime import date

def seed_data():
    create_db_and_tables()
    with Session(engine) as session:
        # Verificar se já existem dados
        if session.exec(select(Person)).first():
            print("Database already seeded.")
            return

        # Dados da Familia Beppler (Mock equivalents)
        # ID 3 - Mãe
        eliane = Person(id=3, first_name="Eliane", last_name="Beppler", gender="female", birth_date=date(1972, 5, 13))
        
        # ID 2 - Pai
        jose_emerson = Person(id=2, first_name="José Emerson", last_name="Beppler", gender="male", birth_date=date(1972, 10, 21))
        
        # ID 1 - Murilo (Foco)
        murilo = Person(
            id=1, 
            first_name="Murilo", 
            last_name="Beppler", 
            gender="male", 
            birth_date=date(2003, 11, 13),
            father_id=2,
            mother_id=3,
            bio="Entusiasta de tecnologia e criador deste projeto."
        )
        
        # Avós (Paternos)
        lino = Person(id=4, first_name="Lino", last_name="Beppler", gender="male", birth_date=date(1940, 2, 10))
        nilsa = Person(id=5, first_name="Nilsa", last_name="...", gender="female", birth_date=date(1942, 7, 22), death_date=date(2010, 11, 5))

        session.add(jose_emerson)
        session.add(eliane)
        session.commit() # Commit parents first

        session.add(murilo)
        session.add(lino)
        session.add(nilsa)
        
        session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()
