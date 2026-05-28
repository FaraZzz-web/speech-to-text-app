from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())