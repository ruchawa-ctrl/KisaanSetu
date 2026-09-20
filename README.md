# Kisaan Setu

A Smart India Hackathon MVP for strengthening market linkages and price discovery for farmers in Maharashtra.

## Architecture

- `backend`: Express + TypeScript + Prisma + PostgreSQL API.
- `frontend`: Vite + React + Tailwind CSS dashboard for farmer, FPO, and buyer workflows.
- `ml-service`: FastAPI service for a price-window forecast and OpenCV crop grading.

## Run locally

Prerequisites: Node.js 20+, Python 3.11+, Docker Desktop, and PostgreSQL (or Docker).

```powershell
git clone <repository-url>
cd KisaanSetu
Copy-Item backend/.env.example backend/.env
npm install
docker compose up -d postgres
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate -- --name init
npm --workspace backend run prisma:seed
npm run dev:backend
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

In a third terminal:

```powershell
cd ml-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:5173`. The development OTP is `123456` for seeded phone numbers such as `9000000001`. The frontend is also usable as a UI demo when the API is offline; set `VITE_API_URL` to point it at another API.

## Docker Compose

For the complete stack in one command:

```powershell
docker compose up --build
```

### Live mandi prices

The dashboard prefers the Government of India's data.gov.in mandi-price API. Create an API key on [data.gov.in](https://data.gov.in/), set it before starting Compose, and the Prices tab will show the latest published government records:

```powershell
$env:DATA_GOV_API_KEY = "your-data-gov-api-key"
docker compose up -d
```

Without `DATA_GOV_API_KEY`, the app labels the local seeded records as `DEMO MARKET DATA`; it does not present them as live prices.

Available services:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- ML service: http://localhost:8000
- PostgreSQL: localhost:5432

## API surface

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `POST /api/v1/auth/otp`, `POST /api/v1/auth/verify`
- `POST /api/v1/lots/create`, `GET /api/v1/lots`
- `POST /api/v1/fpo/aggregate`
- `POST /api/v1/demands/create`, `GET /api/v1/demands/matches`
- `POST /api/v1/transactions/lock-escrow`, `POST /api/v1/transactions/verify-delivery`
- `GET /api/v1/dashboard/prices` - authenticated mandi price history
- `GET /api/v1/dashboard/activity` - authenticated lots, demands, and transactions
- `POST /api/v1/demands/:demandId/offers` - farmer offers a compatible lot to a buyer request
- `GET /api/v1/demands/:demandId/offers` - buyer views provider and lot details
- `POST /api/v1/demands/offers/:offerId/accept` - buyer accepts a farmer offer and matches the request
- `POST http://localhost:8000/predict-window`
- `POST http://localhost:8000/grade-image`

## Train AI models

Price model training accepts an Agmarknet-compatible CSV through the `make_data(csv_path)` function, or generates reproducible synthetic data:

```powershell
cd ml-service
python train_price_model.py
```

The script engineers lags, rolling averages, and annual seasonality, evaluates a ten-day forecast with MAPE, and writes `price_forecaster.joblib`.

Farmer passwords are never stored as plaintext. Registration stores a bcrypt hash in PostgreSQL and login returns a seven-day JWT. Run `npm --workspace backend run prisma:migrate -- --name add-password-auth-and-demand-offers` after setting `DATABASE_URL` to apply the password and buyer-offer tables.

For grading, put an ImageFolder dataset under `data/grading/GRADE_A`, `data/grading/GRADE_B`, and `data/grading/GRADE_C`, then run:

```powershell
python train_grading_model.py
```

This fine-tunes MobileNetV3 with outdoor-lighting and angle augmentation, stops early on validation accuracy, and exports `crop_grader.onnx`. Both scripts expose reusable training/inference helpers for a later model registry integration.
