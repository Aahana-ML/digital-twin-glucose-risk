# Meet Your Digital Twin: Precision Analytics for Glucose Homeostasis

## Project Overview

Meet Your Digital Twin is an experimental AI-powered prototype that estimates the risk of an upcoming qualifying high-glucose event using recent physiological time-series data and patient characteristics.

Developed for the Digital Twin Challenge 2026.

## Problem Statement

Glucose levels can fluctuate over time. This project explores whether machine learning can use recent glucose readings and related physiological signals to estimate whether a qualifying high-glucose event may begin within the next 30 minutes.

## Healthcare Use Case

The prototype demonstrates how historical physiological data and patient characteristics can be combined to explore personalized glucose-risk estimation. It is a research and educational proof of concept, not a clinically validated medical device.

## Methodology

- **Input history:** Previous 2 hours of data sampled at 5-minute intervals.
- **Event definition:** Glucose above 180 mg/dL for six consecutive readings.
- **Prediction horizon:** Next 30 minutes.
- **Selected model:** GRU with static patient characteristics.
- **Evaluation:** Patient-wise train, validation, and held-out test sets.

## Technical Stack

- Python
- TensorFlow / Keras
- NumPy, Pandas, scikit-learn
- FastAPI
- React and the frontend tools used in this project

## Model Evaluation

On the held-out test set, the selected model achieved:

- ROC-AUC: 0.856
- PR-AUC: 0.331
- Recall: 67.7%
- Precision: 26.6%

These results reflect the experimental evaluation and should not be interpreted as evidence of clinical effectiveness.

## Repository Structure

- `api/` — API and backend components
- `frontend/` — Web interface
- `models/` — Model-related files
- `notebooks/` — Experiments and analysis
- `reports/` — Project reports
- `tests/` — Tests
- `requirements.txt` — Python dependencies

## Setup

Installation and execution instructions will be added after deployment configuration is verified.

## Demo Video

*To be added: unlisted YouTube demo video.*

## Architecture Diagram

*To be added: architecture diagram in PDF or PPT format.*

## Presentation

*To be added: final project presentation in PDF or PPT format.*

## Team Details

*Add required team-member details.*

## College / Incubator Information

*Add the affiliation information required by the challenge organizers.*

## License

*Add the selected open-source license and include the corresponding `LICENSE` file.*

## Disclaimer

This project is an experimental proof of concept. It is not intended for diagnosis, treatment decisions, or replacement of glucose monitoring or professional medical advice.
