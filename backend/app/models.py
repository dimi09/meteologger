from sqlalchemy import Column, Integer, Float, DateTime

from app.database import Base


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    # Μοναδικό: πρόκειται για χρονοσειρά -> καμία διπλοεγγραφή
    timestamp = Column(DateTime, unique=True, nullable=False, index=True)

    temp = Column(Float)
    humidity = Column(Float)
    barometer = Column(Float)
    pressure = Column(Float)
    windspeed = Column(Float)
    winddirection = Column(Float)
    windgust = Column(Float)
    windgustdir = Column(Float)
    rain = Column(Float)
    rainrate = Column(Float)
    dewpoint = Column(Float)
    windchill = Column(Float)
    radiation = Column(Float)
    uv = Column(Float)
