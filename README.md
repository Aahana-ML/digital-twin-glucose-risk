# 🩺 Meet Your Digital Twin
### Personalized Glucose Risk Prediction 🧠

An experimental machine-learning prototype that explores whether recent physiological data and patient characteristics can help estimate the risk of an upcoming high-glucose event.

**Developed for the Digital Twin Challenge 2026 — Happiest Health**

🌐 **Live Demo:** [Open the Application](https://digital-twin-glucose-risk-cef3z27v3-aahana-ml.vercel.app/)

💻 **Source Code:** [GitHub Repository](https://github.com/Aahana-ML/digital-twin-glucose-risk)

---

## 🎯 Problem Statement

Glucose levels can fluctuate throughout the day, and identifying patterns that precede high-glucose events is a challenging time-series prediction problem.

This project explores whether machine learning can use the previous two hours of physiological measurements to estimate whether a qualifying high-glucose event may begin within the next 30 minutes.

The goal is to demonstrate a personalized, data-driven approach to glucose-risk estimation through an interactive digital twin prototype.

## 💡 Healthcare Use Case

The prototype combines recent physiological measurements with static patient characteristics to estimate the probability of an upcoming qualifying high-glucose event.

It demonstrates how time-series modeling and patient-specific information can be integrated into an experimental healthcare AI application.

## 📊 Dataset & Features

This project uses the **HUPA-UCM Diabetes Dataset**, published on Mendeley Data.

- **Participants:** 25 people with Type 1 diabetes
- **Sampling interval:** 5 minutes
- **Data type:** Physiological time-series measurements

### Features used

**Dynamic features**
- Glucose
- Calories
- Heart rate
- Steps
- Basal insulin rate
- Bolus insulin volume delivered
- Carbohydrate input

**Static patient characteristics**
- Age
- Gender
- Height and weight
- BMI
- HbA1c
- Diabetes duration
- Treatment

### 📚 Dataset Attribution

Hidalgo, J. Ignacio; Alvarado, Jorge; Botella, Marta; Aramendi, Aranzazu; Velasco, J. Manuel; Garnica, Oscar (2024). *HUPA-UCM Diabetes Dataset*. Mendeley Data, Version 1.

[https://doi.org/10.17632/3hbcscwz44.1](https://doi.org/10.17632/3hbcscwz44.1)

## ⚙️ Methodology

The prediction task is formulated as a binary classification problem.

| Component | Description |
|---|---|
| Historical input | Previous 2 hours |
| Sampling interval | 5 minutes |
| Prediction horizon | Next 30 minutes |
| Event threshold | Glucose strictly above 180 mg/dL |
| Event duration | Six consecutive readings above the threshold |
| Task | Predict whether a qualifying event begins within the prediction horizon |

Prediction windows that fall inside an already active qualifying event are excluded from evaluation.

### 🔒 Preventing Data Leakage

To evaluate generalization to unseen participants, the dataset was split by participant rather than randomly splitting individual time windows.

- **Training:** 17 participants
- **Validation:** 4 participants
- **Testing:** 4 participants

Preprocessing transformations were fitted using training data only. The classification threshold was selected on the validation set and then held fixed for the final test evaluation.

## 🧠 Model Experiments

Several approaches were explored and compared:

- Logistic Regression
- Convolutional Neural Network (CNN)
- CNN with engineered features
- Long Short-Term Memory (LSTM)
- Gated Recurrent Unit (GRU)

The experiments investigated how different sequence models performed and whether adding static patient characteristics improved prediction.

The selected prototype uses a **GRU model with static patient characteristics** to explore a digital-twin approach that combines recent physiological patterns with patient-specific information.

## 📈 Results & Evaluation

The selected model was evaluated on a held-out test set containing participants not used during training or validation.

| Metric | Test result |
|---|---:|
| ROC-AUC | 0.856 |
| PR-AUC | 0.331 |
| Recall | 67.7% |
| Precision | 26.6% |
| F1-score | 0.382 |

### What do these results mean?

- **Recall of 67.7%:** The model detected approximately 68% of the positive test windows.
- **Precision of 26.6%:** Approximately 27% of the windows classified as positive were actually positive.
- **ROC-AUC of 0.856:** The model showed an ability to distinguish positive from negative examples across different thresholds.

The results also reveal a substantial false-alarm rate. Performance varied across held-out participants, highlighting the challenges of generalizing across individuals.

These findings are experimental and do not establish clinical effectiveness.

## 🌐 Live Demo

Try the deployed prototype:

**[Meet Your Digital Twin — Open App](https://digital-twin-glucose-risk-cef3z27v3-aahana-ml.vercel.app/)**

The application allows users to provide a compatible physiological CSV file and patient characteristics, run the model, and view the resulting risk estimate alongside glucose-history visualizations.

The uploaded data must satisfy the input format and sampling requirements expected by the application.

## 🏗️ System Architecture

The application uses a frontend-backend architecture:

1. **Frontend:** React application deployed on Vercel.
2. **Backend:** FastAPI service deployed on Render.
3. **Inference:** The trained GRU model processes the input history and patient characteristics.
4. **Results:** The application returns a risk estimate for display in the interface.

**API documentation:** [Open FastAPI Docs](https://digital-twin-glucose-risk.onrender.com/docs#/default/predict_csv_predict_csv_post)

*The architecture diagram will be added here.*

## 🛠️ Tech Stack

- **Language:** Python
- **Data processing:** NumPy, Pandas
- **Machine learning:** scikit-learn
- **Deep learning:** TensorFlow / Keras
- **Backend:** FastAPI
- **Frontend:** React
- **Frontend deployment:** Vercel
- **Backend deployment:** Render
- **Experimentation:** Jupyter Notebook

## 📁 Repository Structure

```text
digital-twin-glucose-risk/
├── api/              # Backend API
├── frontend/         # Web application
├── models/           # Model-related components
├── notebooks/        # Experiments and analysis
├── reports/          # Project reports
├── tests/            # Tests
└── requirements.txt  # Python dependencies
```

## 🚀 Setup

The application is deployed and can be accessed through the live demo link above.

Local installation and execution instructions will be documented after the repository's dependency files, model artifacts, environment configuration, and startup commands have been verified.

## 🎥 Demo Video

*Coming soon — a demonstration of the deployed application and its prediction workflow.*

## 📑 Project Documents

 **[System Architecture (PDF)](Architecture.pdf)**

## 📑 Project Presentation

Explore the project presentation created in Canva:

🎨 **[View the Presentation on Canva](https://canva.link/5dfqz51b7bhdexf)**
📄  **[View or download the presentation (PDF)](Meet_Your_Digital_Twin_Challenge_2026 (1).pdf)**

## 🚧 Limitations & Future Work

- The evaluation uses only four held-out participants, limiting the conclusions that can be drawn about generalization.
- The relatively low precision indicates a substantial number of false-positive predictions.
- Performance differs across participants.
- The model has not been clinically validated.
- The prediction threshold and event definition are operational choices for this experiment, not universal medical thresholds.

### Future improvements

- Evaluate performance on more independent participants.
- Investigate methods to reduce false alarms while maintaining useful recall.
- Explore calibration and alternative classification thresholds.
- Conduct further validation before considering any real-world healthcare application.

## ⚠️ Medical Disclaimer

This project is an experimental proof of concept developed for educational and research purposes. It is not a clinically validated medical device and must not be used for diagnosis, treatment decisions, insulin dosing, or emergency assessment.

Its predictions do not replace glucose monitoring, medical guidance, or advice from qualified healthcare professionals.

## 📄 License

The project license will be specified here once selected. See the dataset attribution above for the separate dataset citation and applicable usage terms.

