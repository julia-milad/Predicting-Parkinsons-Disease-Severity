import pandas as pd # Import pandas
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the model safely
model = joblib.load("model/xgb_model.pkl")

# Define the exact 12 features in order
EXPECTED_FEATURES = [
    'age', 'sex', 'test_time',
    'Jitter(%)', 'Jitter:PPQ5',
    'Shimmer(dB)', 'Shimmer:APQ5',
    'NHR', 'HNR', 'RPDE', 'DFA', 'PPE'
]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        # Convert to DataFrame
        df = pd.DataFrame([data], columns=EXPECTED_COLUMNS)

        # Predict
        prediction = model.predict(df)[0]

        return jsonify({"prediction": float(prediction)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)