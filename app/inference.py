from pathlib import Path
import json

import joblib
import numpy as np
from tensorflow.keras.models import load_model

ARTIFACTS_DIR = Path("notebooks")/"artifacts"

model = load_model(
    ARTIFACTS_DIR/'gru_static_model.keras'
)

dynamic_scaler = joblib.load(
    ARTIFACTS_DIR/'dynamic_scaler.pkl'
)

encoder = joblib.load(
    ARTIFACTS_DIR/'static_encoder.pkl'
)

static_scaler = joblib.load(
    ARTIFACTS_DIR/'static_scaler.pkl'
)

with open(ARTIFACTS_DIR/"config.json") as f:
    config = json.load(f)

dynamic_features = config["dynamic_features"]

categorical_features = [
    "gender",
    "treatment"
]

numerical_features = [
    "hba1c_percent",
    "age_years",
    "diabetes_duration_years",
    "weight_kg",
    "height_cm",
    "bmi"
]

def preprocess_static(patient):
    categorical_data = encoder.transform(
        patient[categorical_features].to_frame().T
    )

    numerical_data = static_scaler.transform(
        patient[numerical_features].to_frame().T
    )

    static_data = np.concatenate(
        [categorical_data, numerical_data],
        axis=1
    )

    return static_data

def predict_risk(window, patient):

    window_scaled = dynamic_scaler.transform(window)
    window_scaled = window_scaled[np.newaxis, :, :]

    static_data = preprocess_static(patient)

    probability = model.predict(
        [window_scaled, static_data],
        verbose=0
    )

    risk_probability = float(probability[0][0])

    prediction = int(
        risk_probability >= config["threshold"]
    )

    return {
    "risk_probability": risk_probability,
    "prediction": prediction,
    "threshold": config["threshold"]
}

