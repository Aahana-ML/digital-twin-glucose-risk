from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import pandas as pd
import numpy as np
from app.inference import predict_risk, dynamic_features
import io
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Digital Twin API is running!"
    }


def validate_data(df):

    required_columns = [
        "time",
        "glucose",
        "calories",
        "heart_rate",
        "steps",
        "basal_rate",
        "bolus_volume_delivered",
        "carb_input"
    ]

    # 1. Check required columns
    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Missing required columns",
                "missing_columns": missing_columns
            }
        )

    # 2. Check minimum number of readings
    if len(df) < 25:
        raise HTTPException(
            status_code=400,
            detail="At least 25 readings are required."
        )

    # 3. Convert timestamps
    df["time"] = pd.to_datetime(
        df["time"],
        errors="coerce"
    )

    if df["time"].isna().any():
        raise HTTPException(
            status_code=400,
            detail="CSV contains invalid timestamps."
        )

    # 4. Sort chronologically
    df = df.sort_values("time").reset_index(drop=True)

    # 5. Check numeric columns
    numeric_columns = [
        "glucose",
        "calories",
        "heart_rate",
        "steps",
        "basal_rate",
        "bolus_volume_delivered",
        "carb_input"
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    numeric_data = df[numeric_columns]

    if numeric_data.isna().any().any():
        raise HTTPException(
            status_code=400,
            detail="CSV contains missing or non-numeric values."
        )

    if not np.isfinite(numeric_data.to_numpy()).all():
        raise HTTPException(
            status_code=400,
            detail="CSV contains infinite values."
        )

    # 6. Take latest 25 readings
    window = df.tail(25).copy()

    # 7. Check sampling interval
    time_differences = window["time"].diff().dropna()

    expected_interval = pd.Timedelta(minutes=5)

    if not (time_differences == expected_interval).all():
        raise HTTPException(
            status_code=400,
            detail="The latest 25 readings must be sampled exactly every 5 minutes."
        )

    # 8. Check 2-hour history span
    time_span = (
        window["time"].iloc[-1]
        - window["time"].iloc[0]
    )

    expected_span = pd.Timedelta(hours=2)

    if time_span != expected_span:
        raise HTTPException(
            status_code=400,
            detail="The latest 25 readings must span exactly 2 hours."
        )

    return df


@app.post("/predict-csv")
async def predict_csv(
    file: UploadFile = File(...),

    gender: str = Form(...),
    hba1c_percent: float = Form(...),
    age_years: float = Form(...),
    diabetes_duration_years: float = Form(...),
    weight_kg: float = Form(...),
    height_cm: float = Form(...),
    treatment: str = Form(...),
    bmi: float = Form(...)
):

    # -------------------------
    # 1. Read uploaded CSV
    # -------------------------
    contents = await file.read()

    try:
        df = pd.read_csv(
            io.BytesIO(contents),
            sep=";"
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded CSV file."
        )

    # -------------------------
    # 2. Validate data
    # -------------------------
    df = validate_data(df)

    # -------------------------
    # 3. Take latest 25 readings
    # -------------------------
    window = df.tail(25).copy()

    # Keep only model features
    window = window[dynamic_features]

    # -------------------------
    # 4. Create patient profile
    # -------------------------
    patient = pd.Series({
        "gender": gender,
        "hba1c_percent": hba1c_percent,
        "age_years": age_years,
        "diabetes_duration_years": diabetes_duration_years,
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "treatment": treatment,
        "bmi": bmi
    })

    # -------------------------
    # 5. Make prediction
    # -------------------------
    result = predict_risk(
        window,
        patient
    )

    # -------------------------
    # 6. Create prediction message
    # -------------------------
    if result["prediction"] == 1:
        prediction_label = (
            "Hyperglycemic event predicted within the next 30 minutes."
        )
    else:
        prediction_label = (
            "No hyperglycemic event predicted within the next 30 minutes."
        )

    # -------------------------
    # 7. Return result
    # -------------------------
    return {
    "filename": file.filename,

    "prediction": result["prediction"],

    "prediction_label": prediction_label,

    "risk_probability": round(
        result["risk_probability"],
        4
    ),

    "decision_threshold": result["threshold"],

    "history_window_minutes": 120,

    "prediction_horizon_minutes": 30,

    "window_start": str(
        df["time"].iloc[-25]
    ),

    "window_end": str(
        df["time"].iloc[-1]
    ),

    "glucose_history": window["glucose"].tolist(),

    "time_history": [
        str(time)
        for time in df["time"].tail(25)
    ]
}