from datetime import date, timedelta
from io import BytesIO
from pathlib import Path
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from PIL import Image
from pydantic import BaseModel, Field

app = FastAPI(title='Kisaan Setu ML Service', version='1.0.0')
class ForecastRequest(BaseModel):
    crop_name: str
    quantity_kg: float = Field(gt=0)
    current_price: float = Field(gt=0)

@app.get('/health')
def health(): return {'service': 'kisaan-setu-ml', 'status': 'ok'}
@app.post('/predict-window')
def predict_window(payload: ForecastRequest):
    trend = [round(payload.current_price * (1 + (day - 3) * 0.006), 2) for day in range(1, 15)]
    recommended_day = max(range(14), key=lambda day: trend[day]) + 1
    storage_cost = payload.quantity_kg * 0.35 * recommended_day
    gross = trend[recommended_day - 1] * payload.quantity_kg
    return {'crop_name': payload.crop_name, 'forecast': [{'day': day + 1, 'date': str(date.today() + timedelta(days=day + 1)), 'price': price} for day, price in enumerate(trend)], 'upside_percentage': round((max(trend) / payload.current_price - 1) * 100, 2), 'recommended_action': 'HOLD' if recommended_day > 5 else 'SELL', 'recommended_day': recommended_day, 'net_realization': round(gross - storage_cost, 2), 'estimated_storage_cost': round(storage_cost, 2)}
@app.post('/grade-image')
async def grade_image(image: UploadFile = File(...)):
    data = await image.read(); frame = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if frame is None: return {'error': 'Unsupported image'}
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV); saturation = float(np.mean(hsv[:, :, 1])); brightness = float(np.mean(hsv[:, :, 2])); gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY); uniformity = float(1 - np.std(gray) / 128); blemishes = float(np.mean(gray < max(35, brightness * 0.35)))
    score = max(0, min(100, 0.5 * uniformity * 100 + 0.3 * min(saturation, 140) / 140 * 100 + 0.2 * (1 - blemishes) * 100))
    grade = 'GRADE_A' if score >= 75 else 'GRADE_B' if score >= 52 else 'GRADE_C'
    return {'predicted_grade': grade, 'confidence': round(min(0.99, 0.55 + abs(score - {'GRADE_A':75,'GRADE_B':63,'GRADE_C':45}[grade]) / 100), 3), 'metrics': {'color_distribution': round(saturation, 2), 'surface_uniformity': round(uniformity, 3), 'blemish_ratio': round(blemishes, 3)}}
