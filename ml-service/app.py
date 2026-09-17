from datetime import date, timedelta
from io import BytesIO
from pathlib import Path
import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

app = FastAPI(title='Kisaan Setu ML Service', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
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
    data = await image.read()
    if len(data) > 10 * 1024 * 1024: raise HTTPException(status_code=413, detail='Image must be smaller than 10 MB')
    try:
        decoded = Image.open(BytesIO(data)).convert('RGB')
        frame = cv2.cvtColor(np.array(decoded), cv2.COLOR_RGB2BGR)
    except Exception as error:
        raise HTTPException(status_code=415, detail='Could not read this image. Use a JPG or PNG file.') from error
    frame = cv2.resize(frame, (512, 512), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    saturation = float(np.mean(hsv[:, :, 1]))
    brightness = float(np.mean(hsv[:, :, 2]))
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    brightness_spread = float(np.std(gray))
    uniformity = max(0.0, min(1.0, 1 - brightness_spread / 110))
    dark_mask = cv2.inRange(hsv, np.array([0, 25, 0]), np.array([180, 255, max(35, int(brightness * 0.42))]))
    dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    blemishes = float(np.mean(dark_mask > 0))
    color_score = max(0.0, min(100.0, saturation / 140 * 100))
    uniformity_score = uniformity * 100
    blemish_score = max(0.0, (1 - blemishes * 4) * 100)
    score = round(max(0, min(100, 0.45 * color_score + 0.35 * uniformity_score + 0.20 * blemish_score)), 1)
    grade = 'GRADE_A' if score >= 75 else 'GRADE_B' if score >= 52 else 'GRADE_C'
    confidence = round(min(0.99, 0.55 + abs(score - {'GRADE_A':75,'GRADE_B':63,'GRADE_C':45}[grade]) / 100), 3)
    conclusion = {'GRADE_A': 'Premium quality. Suitable for direct institutional sale.', 'GRADE_B': 'Good market quality. Suitable for standard trade.', 'GRADE_C': 'Lower trade quality. Consider sorting or selling quickly.'}[grade]
    return {'predicted_grade': grade, 'confidence': confidence, 'quality_score': score, 'conclusion': conclusion, 'report': {'summary': f'{grade} based on color, surface uniformity, and visible blemish analysis.', 'recommendation': 'List now for premium buyers.' if grade == 'GRADE_A' else 'Sort and photograph again in even daylight before listing.' if grade == 'GRADE_B' else 'Separate damaged produce and sell the lot quickly.'}, 'metrics': {'color_score': round(color_score, 1), 'surface_uniformity': round(uniformity_score, 1), 'blemish_free_score': round(blemish_score, 1), 'brightness': round(brightness, 1)}}
