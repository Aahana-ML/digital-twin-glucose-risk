import { useRef, useState } from 'react'
import './App.css'


function generateTwinInsight(result) {
  const glucose = result.glucose_history

  const current = glucose[glucose.length - 1]
  const starting = glucose[0]
  const peak = Math.max(...glucose)

  const probability = result.risk_probability * 100
  const threshold = result.decision_threshold * 100

  let trendMessage

  if (current < peak - 5) {
    trendMessage =
      `Recent glucose peaked at ${peak.toFixed(0)} mg/dL and has since declined to ${current.toFixed(0)} mg/dL.`
  } else if (current > starting + 10) {
    trendMessage =
      `Recent glucose increased from ${starting.toFixed(0)} to ${current.toFixed(0)} mg/dL during the observed window.`
  } else {
    trendMessage =
      `Recent glucose is currently ${current.toFixed(0)} mg/dL within the observed 2-hour window.`
  }

  const decisionMessage =
    probability >= threshold
      ? `The model-estimated probability of a qualifying hyperglycemic event within the next 30 minutes is above its ${threshold.toFixed(1)}% decision threshold.`
      : `The model-estimated probability of a qualifying hyperglycemic event within the next 30 minutes is below its ${threshold.toFixed(1)}% decision threshold.`

  return `${trendMessage} ${decisionMessage}`
}


function GlucoseChart({ glucoseHistory, timeHistory }) {
  const width = 760
  const height = 280

  const left = 45
  const right = 20
  const top = 20
  const bottom = 45

  const chartWidth = width - left - right
  const chartHeight = height - top - bottom

  const minGlucose = Math.min(...glucoseHistory)
  const maxGlucose = Math.max(...glucoseHistory, 180)

  const yMin = Math.max(
    0,
    Math.floor((minGlucose - 20) / 20) * 20
  )

  const yMax = Math.ceil(
    (maxGlucose + 20) / 20
  ) * 20

  const getX = (index) =>
    left +
    (index / (glucoseHistory.length - 1)) *
      chartWidth

  const getY = (value) =>
    top +
    ((yMax - value) / (yMax - yMin)) *
      chartHeight

  const points = glucoseHistory
    .map(
      (value, index) =>
        `${getX(index)},${getY(value)}`
    )
    .join(' ')

  const thresholdY = getY(180)

  const startTime =
    timeHistory[0]?.slice(11, 16)

  const endTime =
    timeHistory[timeHistory.length - 1]?.slice(
      11,
      16
    )

  return (
    <div className="glucose-chart">

      <div className="chart-header">

        <div>
          <span className="chart-label">
            OBSERVED GLUCOSE
          </span>

          <h3>
            2-hour physiological trajectory
          </h3>
        </div>

        <div className="current-glucose">

          <span>CURRENT</span>

          <strong>
            {glucoseHistory[
              glucoseHistory.length - 1
            ].toFixed(0)}

            <small> mg/dL</small>
          </strong>

        </div>

      </div>


      <div className="chart-wrapper">

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="glucose-svg"
        >

          <defs>

            <linearGradient
              id="glucoseGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >

              <stop
                offset="0%"
                stopColor="rgba(158,140,255,0.28)"
              />

              <stop
                offset="100%"
                stopColor="rgba(158,140,255,0)"
              />

            </linearGradient>

          </defs>


          {[yMin, (yMin + yMax) / 2, yMax].map(
            (value, index) => {

              const y = getY(value)

              return (
                <g key={index}>

                  <line
                    x1={left}
                    x2={width - right}
                    y1={y}
                    y2={y}
                    className="chart-grid"
                  />

                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="chart-axis"
                  >
                    {Math.round(value)}
                  </text>

                </g>
              )
            }
          )}


          {180 >= yMin && 180 <= yMax && (
            <g>

              <line
                x1={left}
                x2={width - right}
                y1={thresholdY}
                y2={thresholdY}
                className="threshold-line"
              />

              <text
                x={width - right}
                y={thresholdY - 7}
                textAnchor="end"
                className="threshold-label"
              >
                180 mg/dL
              </text>

            </g>
          )}


          <polygon
            points={`
              ${left},${top + chartHeight}
              ${points}
              ${width - right},${top + chartHeight}
            `}
            className="glucose-area"
          />


          <polyline
            points={points}
            className="glucose-line"
          />


          <circle
            cx={getX(glucoseHistory.length - 1)}
            cy={getY(
              glucoseHistory[
                glucoseHistory.length - 1
              ]
            )}
            r="5"
            className="current-point"
          />

        </svg>

      </div>


      <div className="chart-time">

        <span>{startTime}</span>

        <span>NOW</span>

        <span>{endTime}</span>

      </div>

    </div>
  )
}


function App() {

  const [showSetup, setShowSetup] =
    useState(false)

  const [file, setFile] =
    useState(null)

  const [patient, setPatient] =
    useState({
      gender: '',
      treatment: '',
      hba1c_percent: '',
      age_years: '',
      diabetes_duration_years: '',
      weight_kg: '',
      height_cm: '',
      bmi: ''
    })

  const [loading, setLoading] =
    useState(false)

  const [result, setResult] =
    useState(null)

  const [error, setError] =
    useState('')

  const fileInputRef =
    useRef(null)


  const handlePatientChange = (event) => {

    const {
      name,
      value
    } = event.target

    setPatient({
      ...patient,
      [name]: value
    })
  }


  const handlePrediction = async () => {

    setError('')

    if (!file) {

      setError(
        'Please upload a patient CSV file.'
      )

      return
    }


    const missingFields =
      Object.entries(patient)
        .filter(
          ([_, value]) => value === ''
        )
        .map(
          ([key]) => key
        )


    if (missingFields.length > 0) {

      setError(
        'Please complete all patient profile fields.'
      )

      return
    }

    const numericLimits = {
      hba1c_percent: [3, 20],
      age_years: [1, 120],
      diabetes_duration_years: [0, 120],
      weight_kg: [1, 500],
      height_cm: [30, 250],
      bmi: [1, 100]
    }
    
    for (const [field, [min, max]] of Object.entries(numericLimits)) {
      const value = Number(patient[field])
      
      if (!Number.isFinite(value) || value < min || value > max) {
        setError(
          `${field.replaceAll('_', ' ')} must be between ${min} and ${max}.`
        )
        return
       }
      }
    if (
      Number(patient.diabetes_duration_years) >
      Number(patient.age_years)
    ) {
      setError('Diabetes duration cannot exceed age.')
      return
    }


    setLoading(true)


    try {

      const formData =
        new FormData()


      formData.append(
        'file',
        file
      )

      formData.append(
        'gender',
        patient.gender
      )

      formData.append(
        'treatment',
        patient.treatment
      )

      formData.append(
        'hba1c_percent',
        patient.hba1c_percent
      )

      formData.append(
        'age_years',
        patient.age_years
      )

      formData.append(
        'diabetes_duration_years',
        patient.diabetes_duration_years
      )

      formData.append(
        'weight_kg',
        patient.weight_kg
      )

      formData.append(
        'height_cm',
        patient.height_cm
      )

      formData.append(
        'bmi',
        patient.bmi
      )


      const response =
        await fetch(
          'https://digital-twin-glucose-risk.onrender.com/predict_csv',
          {
            method: 'POST',
            body: formData
          }
        )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Prediction request failed.'
        )
      }
    
      

      setResult(data)

    } catch (err) {

      console.error('Prediction request failed:', err)

      if (err instanceof TypeError) {
        setError(
          'Unable to connect to the prediction server. Please make sure the backend is running and try again.'
    )
  }   else {
    setError(
      err.message || 'Something went wrong while generating the prediction. Please try again.'
    )
  }  

} finally {

      setLoading(false)

    }
  }



  /* ========================================
     RESULT SCREEN
     ======================================== */

  if (result) {

    return (

      <main className="result-screen">

        <div className="status">

          <span className="status-dot"></span>

          DIGITAL TWIN ACTIVE

        </div>


        <section className="result-content">


          <p className="eyebrow">

            DIGITAL TWIN ANALYSIS COMPLETE

          </p>


          <h1>

            Your Twin's

            <span>
              Prediction
            </span>

          </h1>


          <p className="description">

            The Digital Twin analyzed recent
            physiological history together with
            the patient profile.

          </p>


          {/* ========================================
             MAIN PREDICTION
             ======================================== */}

          <section className="prediction-card">


            <div className="prediction-main">


              <div className="prediction-icon">

                {result.prediction === 1
                  ? '!'
                  : '✓'
                }

              </div>


              <div className="prediction-copy">


                <span className="prediction-label">

                  NEXT 30-MINUTE EVENT RISK

                </span>


                <div className="risk-number">

                  {(
                    result.risk_probability *
                    100
                  ).toFixed(1)}

                  <small>%</small>

                </div>


                <h2>

                  {result.prediction === 1
                    ? 'Qualifying Event Predicted'
                    : 'No Qualifying Event Predicted'
                  }

                </h2>


                <p>

                  Model-estimated probability
                  of a qualifying hyperglycemic
                  event beginning within the next
                  30 minutes.

                </p>


              </div>

            </div>


            {/* Risk meter */}

            <div className="risk-meter">


              <div className="risk-meter-track">


                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${Math.min(
                      result.risk_probability *
                        100,
                      100
                    )}%`
                  }}
                />


                <div
                  className="risk-threshold"
                  style={{
                    left: `${result.decision_threshold *
                      100}%`
                  }}
                />


              </div>


              <div className="risk-meter-labels">

                <span>
                  0%
                </span>

                <span>
                  Threshold&nbsp;
                  {(
                    result.decision_threshold *
                    100
                  ).toFixed(0)}
                  %
                </span>

                <span>
                  100%
                </span>

              </div>


            </div>

          </section>
          
          <div className="model-disclaimer">

            <span>ⓘ</span>

            <p>
              This result is an experimental prediction generated by our
              machine learning model and is not a medical diagnosis. It
              should not replace professional medical advice or glucose
              monitoring.
            </p>

          </div>



          {/* ========================================
             TWIN INSIGHT
             ======================================== */}

          <section className="twin-insight-card">


            <div className="section-label">

              TWIN INSIGHT

            </div>


            <div className="insight-content">


              <div className="insight-icon">

                ✦

              </div>


              <div>

                <h3>

                  What the model sees

                </h3>


                <p>

                  {generateTwinInsight(
                    result
                  )}

                </p>

              </div>


            </div>

          </section>


          {/* ========================================
             GLUCOSE HISTORY
             ======================================== */}

          <GlucoseChart
            glucoseHistory={
              result.glucose_history
            }
            timeHistory={
              result.time_history
            }
          />


          {/* ========================================
             PATIENT + MODEL INFORMATION
             ======================================== */}

          <section className="twin-info-grid">


            <div className="info-card">


              <div className="section-label">

                PATIENT TWIN

              </div>


              <div className="info-grid">


                <div>

                  <span>
                    GENDER
                  </span>

                  <strong>
                    {patient.gender}
                  </strong>

                </div>


                <div>

                  <span>
                    TREATMENT
                  </span>

                  <strong>
                    {patient.treatment}
                  </strong>

                </div>


                <div>

                  <span>
                    HbA1c
                  </span>

                  <strong>
                    {patient.hba1c_percent}%
                  </strong>

                </div>


                <div>

                  <span>
                    AGE
                  </span>

                  <strong>
                    {patient.age_years} yrs
                  </strong>

                </div>


                <div>

                  <span>
                    DIABETES DURATION
                  </span>

                  <strong>
                    {patient.diabetes_duration_years} yrs
                  </strong>

                </div>


                <div>

                  <span>
                    BMI
                  </span>

                  <strong>
                    {patient.bmi}
                  </strong>

                </div>


              </div>

            </div>


            <div className="info-card">


              <div className="section-label">

                MODEL CONTEXT

              </div>


              <div className="info-grid">


                <div>

                  <span>
                    HISTORY
                  </span>

                  <strong>
                    {result.history_window_minutes}
                    {' '}min
                  </strong>

                </div>


                <div>

                  <span>
                    FORECAST
                  </span>

                  <strong>
                    {result.prediction_horizon_minutes}
                    {' '}min
                  </strong>

                </div>


                <div>

                  <span>
                    DECISION THRESHOLD
                  </span>

                  <strong>
                    {(
                      result.decision_threshold *
                      100
                    ).toFixed(1)}
                    %
                  </strong>

                </div>


                <div>

                  <span>
                    WINDOW END
                  </span>

                  <strong>
                    {result.window_end.slice(
                      11,
                      16
                    )}
                  </strong>

                </div>


              </div>

            </div>


          </section>


          {/* ========================================
             TIMELINE
             ======================================== */}

          <section className="timeline-card">


            <div className="timeline-item">


              <div className="timeline-dot observed"></div>


              <div>

                <span>
                  OBSERVED
                </span>

                <strong>
                  2 HOURS OF HISTORY
                </strong>

              </div>


            </div>


            <div className="timeline-line"></div>


            <div className="timeline-item">


              <div className="timeline-dot now"></div>


              <div>

                <span>
                  NOW
                </span>

                <strong>
                  {result.window_end.slice(
                    11,
                    16
                  )}
                </strong>

              </div>


            </div>


            <div className="timeline-line"></div>


            <div className="timeline-item">


              <div className="timeline-dot future"></div>


              <div>

                <span>
                  FORECAST
                </span>

                <strong>
                  NEXT 30 MINUTES
                </strong>

              </div>


            </div>


          </section>


          {/* ========================================
             RUN AGAIN
             ======================================== */}

          

          
          <button
            className="create-button"
            onClick={() => {
              setResult(null)
              setError('')
              setFile(null)
              setPatient({
                gender: '',
                treatment: '',
                hba1c_percent: '',
                age_years: '',
                diabetes_duration_years: '',
                weight_kg: '',
                height_cm: '',
                bmi: ''
             })
             setShowSetup(true)
             if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
          }}
        >
          Run Another Prediction
          <span>→</span>
          
        </button>


        </section>

      </main>

    )
  }


  /* ========================================
     SETUP SCREEN
     ======================================== */

  if (showSetup) {

    return (

      <main className="setup-screen">


        <div className="status">

          <span className="status-dot"></span>

          SYSTEM READY

        </div>


        <section className="setup-content">


          <p className="eyebrow">

            DIGITAL TWIN INITIALIZATION

          </p>


          <h1>

            Initialize Your

            <span>
              Digital Twin
            </span>

          </h1>


          <p className="description">

            Connect recent physiological history
            with patient context to create a
            personalized glucose risk model.

          </p>


          <div className="setup-panel">


            {/* ========================================
               CSV UPLOAD
               ======================================== */}

            <div className="upload-area">


              <div className="upload-icon">

                ↑

              </div>


              <h2>

                {file
                  ? 'Patient Data Ready'
                  : 'Upload Patient Data'
                }

              </h2>


              <p>

                {file
                  ? file.name
                  : 'Upload your physiological history as a CSV file.'
                }

              </p>


              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{
                  display: 'none'
                }}
                onChange={(event) => {

                  const selectedFile =
                    event.target.files[0]

                  if (selectedFile) {

                    setFile(
                      selectedFile
                    )

                  }

                }}
              />


              <button
                className="upload-button"
                onClick={() =>
                  fileInputRef.current.click()
                }
              >

                {file
                  ? 'Choose Different CSV'
                  : 'Choose CSV File'
                }

              </button>


              <span className="file-hint">

                2-hour history ·
                5-minute sampling

              </span>


            </div>


            {/* ========================================
               PATIENT PROFILE
               ======================================== */}

            <div className="profile-section">


              <div className="section-label">

                PATIENT PROFILE

              </div>


              <div className="profile-grid">


                <div className="field">

                  <label>
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={patient.gender}
                    onChange={
                      handlePatientChange
                    }
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>

                  </select>
                  

                </div>


                <div className="field">

                  <label>
                    Insulin Treatment
                  </label>

                  <select
                    name="treatment"
                    value={patient.treatment}
                    onChange={
                      handlePatientChange
                    }
                    required
                    >
                      <option value="">Select treatment</option>
                      <option value="CSII">CSII (Insulin Pump)</option>
                      <option value="MDI">MDI (Multiple Daily Injections)</option>

                    </select>
                </div>


                <div className="field">

                  <label>
                    HbA1c (%)
                  </label>

                  <input
                    type="number"
                    name="hba1c_percent"
                    value={
                      patient.hba1c_percent
                    }
                    onChange={
                      handlePatientChange
                    }
                    placeholder="7.2"
                  />

                </div>


                <div className="field">

                  <label>
                    Age (years)
                  </label>

                  <input
                    type="number"
                    name="age_years"
                    value={
                      patient.age_years
                    }
                    onChange={
                      handlePatientChange
                    }
                    placeholder="24"
                  />

                </div>


                <div className="field">

                  <label>
                    Diabetes Duration (years)
                  </label>

                  <input
                    type="number"
                    name="diabetes_duration_years"
                    value={
                      patient.diabetes_duration_years
                    }
                    onChange={
                      handlePatientChange
                    }
                    placeholder="10"
                  />

                </div>


                <div className="field">

                  <label>
                    Weight (kg)
                  </label>

                  <input
                    type="number"
                    name="weight_kg"
                    value={
                      patient.weight_kg
                    }
                    onChange={
                      handlePatientChange
                    }
                    placeholder="65"
                  />

                </div>


                <div className="field">

                  <label>
                    Height (cm)
                  </label>

                  <input
                    type="number"
                    name="height_cm"
                    value={
                      patient.height_cm
                    }
                    onChange={
                      handlePatientChange
                    }
                    placeholder="165"
                  />

                </div>


                <div className="field">

                  <label>
                    BMI
                  </label>

                  <input
                    type="number"
                    name="bmi"
                    value={
                      patient.bmi
                    }
                    onChange={
                      handlePatientChange
                    }
                    placeholder="23.9"
                  />

                </div>


              </div>


              {error && (

                <div className="error-message">

                  {error}

                </div>

              )}


              <button
                className="create-button"
                onClick={
                  handlePrediction
                }
                disabled={loading}
              >

                {loading
                  ? 'Initializing Twin...'
                  : 'Initialize Twin'
                }


                <span>

                  {loading
                    ? '...'
                    : '→'
                  }

                </span>

              </button>


            </div>


          </div>


        </section>


        <button
          className="back-button"
          onClick={() =>
            setShowSetup(false)
          }
        >

          ← Back

        </button>


      </main>

    )
  }


  /* ========================================
     LANDING SCREEN
     ======================================== */

  return (

    <main className="landing">


      <div className="status">

        <span className="status-dot"></span>

        SYSTEM READY

      </div>


      <section className="hero-content">


        <p className="eyebrow">

          PERSONALIZED HEALTH INTELLIGENCE

        </p>


        <h1>

          Meet Your

          <span>
            Digital Twin
          </span>

        </h1>


        <p className="description">

          A personalized model that learns from
          recent physiological patterns and patient
          context to anticipate near-term glucose risk.

        </p>


        <button
          className="initialize-button"
          onClick={() =>
            setShowSetup(true)
          }
        >

          Initialize Twin

          <span>
            →
          </span>

        </button>


      </section>


      <div className="twin-orbit">

        <div className="orbit orbit-one"></div>

        <div className="orbit orbit-two"></div>


        <div className="twin-core">

          <div className="core-pulse"></div>

          <span>
            DT
          </span>

        </div>

      </div>


      <div className="bottom-info">


        <div>

          <span>
            HISTORY
          </span>

          <strong>
            2 HOURS
          </strong>

        </div>


        <div>

          <span>
            FORECAST
          </span>

          <strong>
            30 MIN
          </strong>

        </div>


        <div>

          <span>
            MODEL
          </span>

          <strong>
            GRU + PROFILE
          </strong>

        </div>


      </div>


    </main>

  )
}


export default App