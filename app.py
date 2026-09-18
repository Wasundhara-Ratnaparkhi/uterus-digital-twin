# ============================================================
# FERTISCAN - AI REPRODUCTIVE DIGITAL TWIN
# Flask Backend
# ============================================================

from flask import Flask, request, jsonify, send_from_directory
import os
import joblib
import numpy as np


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FRONTEND_DIR = os.path.join(
    BASE_DIR,
    "frontend"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

ASSETS_DIR = os.path.join(
    BASE_DIR,
    "assets"
)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(
    __name__,
    static_folder=FRONTEND_DIR,
    static_url_path=""
)


# ============================================================
# MODEL PATHS
# ============================================================

REGRESSION_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "reg_model.pkl"
)

CLASSIFICATION_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "clf_model.pkl"
)


# ============================================================
# LOAD ML MODELS
# ============================================================

try:

    regressor = joblib.load(
        REGRESSION_MODEL_PATH
    )

    print("✓ Regression model loaded")

except Exception as error:

    regressor = None

    print(
        "✗ Regression model failed:",
        error
    )


try:

    classifier = joblib.load(
        CLASSIFICATION_MODEL_PATH
    )

    print("✓ Classification model loaded")

except Exception as error:

    classifier = None

    print(
        "✗ Classification model failed:",
        error
    )


# ============================================================
# FEATURE CREATION
# EXACT ORDER USED DURING MODEL TRAINING
# ============================================================

def create_features(data, cycle_day=None):

    if cycle_day is None:
        cycle_day = data["cycle_day"]

    return np.array([[
        float(data["age"]),
        float(data["bmi"]),
        float(data["fsh"]),
        float(data["lh"]),
        float(data["estrogen"]),
        float(data["amh"]),
        float(data["progesterone"]),
        float(data["baseline_thickness"]),
        float(data["prp_sessions"]),
        float(data["prp_dosage"]),
        float(cycle_day)
    ]])


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return send_from_directory(
        FRONTEND_DIR,
        "index.html"
    )


# ============================================================
# CSS
# ============================================================

@app.route("/css/<path:filename>")
def css_files(filename):

    return send_from_directory(
        os.path.join(
            FRONTEND_DIR,
            "css"
        ),
        filename
    )


# ============================================================
# JAVASCRIPT
# ============================================================

@app.route("/js/<path:filename>")
def js_files(filename):

    return send_from_directory(
        os.path.join(
            FRONTEND_DIR,
            "js"
        ),
        filename
    )


# ============================================================
# 1. AI PREDICTION
# ============================================================

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict():

    try:

        # --------------------------------------------
        # Check model
        # --------------------------------------------

        if regressor is None:

            return jsonify({
                "success": False,
                "error":
                    "Regression model is not loaded."
            }), 500


        if classifier is None:

            return jsonify({
                "success": False,
                "error":
                    "Classification model is not loaded."
            }), 500


        # --------------------------------------------
        # Get JSON
        # --------------------------------------------

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({
                "success": False,
                "error":
                    "No patient data received."
            }), 400


        print(
            "\nReceived prediction request:"
        )

        print(data)


        # --------------------------------------------
        # Validate required fields
        # --------------------------------------------

        required_fields = [
            "age",
            "bmi",
            "fsh",
            "lh",
            "estrogen",
            "amh",
            "progesterone",
            "cycle_day",
            "baseline_thickness",
            "prp_sessions",
            "prp_dosage"
        ]


        missing_fields = [
            field
            for field in required_fields
            if field not in data
        ]


        if missing_fields:

            return jsonify({
                "success": False,
                "error":
                    "Missing fields: " +
                    ", ".join(missing_fields)
            }), 400


        # --------------------------------------------
        # Create feature vector
        # --------------------------------------------

        features = create_features(
            data
        )


        print(
            "Prediction features:",
            features
        )


        # --------------------------------------------
        # Regression
        # --------------------------------------------

        predicted_thickness = float(
            regressor.predict(
                features
            )[0]
        )


        # --------------------------------------------
        # Classification
        # --------------------------------------------

        predicted_class = int(
            classifier.predict(
                features
            )[0]
        )


        # --------------------------------------------
        # Probability
        # --------------------------------------------

        probabilities = (
            classifier.predict_proba(
                features
            )[0]
        )


        confidence = float(
            np.max(probabilities) * 100
        )


        # --------------------------------------------
        # Fertility label
        # --------------------------------------------

        fertility_label = (
            "Fertile"
            if predicted_class == 1
            else "Infertile"
        )


        # --------------------------------------------
        # Result object
        # --------------------------------------------

        prediction_result = {

            "endometrial_thickness":
                predicted_thickness,

            "predicted_thickness":
                predicted_thickness,

            "fertility_outcome":
                fertility_label,

            "fertility_class":
                predicted_class,

            "confidence":
                confidence,

            "cycle_day":
                int(data["cycle_day"])

        }


        print(
            "Prediction result:",
            prediction_result
        )


        # ====================================================
        # IMPORTANT
        #
        # We return BOTH:
        #
        # 1. result object
        # 2. top-level values
        #
        # This keeps frontend compatibility.
        # ====================================================

        return jsonify({

            "success": True,

            "result":
                prediction_result,

            "endometrial_thickness":
                predicted_thickness,

            "predicted_thickness":
                predicted_thickness,

            "fertility_outcome":
                fertility_label,

            "confidence":
                confidence,

            "cycle_day":
                int(data["cycle_day"])

        })


    except Exception as error:

        print(
            "\n!!! PREDICTION ERROR !!!"
        )

        print(
            repr(error)
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# ============================================================
# 2. 28-DAY DIGITAL TWIN SIMULATION
# ============================================================

@app.route(
    "/api/simulate",
    methods=["POST"]
)
def simulate():

    try:

        if regressor is None:

            return jsonify({
                "success": False,
                "error":
                    "Regression model is not loaded."
            }), 500


        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({
                "success": False,
                "error":
                    "No patient data received."
            }), 400


        print(
            "\nStarting 28-day simulation..."
        )


        days = list(
            range(1, 29)
        )


        thickness_values = []


        # --------------------------------------------
        # Predict each cycle day
        # --------------------------------------------

        for day in days:

            features = create_features(
                data,
                cycle_day=day
            )


            prediction = float(
                regressor.predict(
                    features
                )[0]
            )


            thickness_values.append(
                prediction
            )


        # --------------------------------------------
        # Statistics
        # --------------------------------------------

        start_thickness = float(
            thickness_values[0]
        )

        end_thickness = float(
            thickness_values[-1]
        )

        maximum_thickness = float(
            max(thickness_values)
        )

        minimum_thickness = float(
            min(thickness_values)
        )

        average_thickness = float(
            np.mean(thickness_values)
        )


        peak_index = int(
            np.argmax(
                thickness_values
            )
        )


        peak_day = int(
            days[peak_index]
        )


        variation = float(
            maximum_thickness -
            minimum_thickness
        )


        # --------------------------------------------
        # Simulation result
        # --------------------------------------------

        simulation_result = {

            "days":
                days,

            "thickness":
                thickness_values,

            "start_thickness":
                start_thickness,

            "end_thickness":
                end_thickness,

            "maximum_thickness":
                maximum_thickness,

            "minimum_thickness":
                minimum_thickness,

            "average_thickness":
                average_thickness,

            "peak_day":
                peak_day,

            "variation":
                variation

        }


        print(
            "Simulation completed successfully."
        )


        # --------------------------------------------
        # Return both result and flat values
        # --------------------------------------------

        return jsonify({

            "success": True,

            "result":
                simulation_result,

            "days":
                days,

            "thickness":
                thickness_values,

            "start_thickness":
                start_thickness,

            "end_thickness":
                end_thickness,

            "maximum_thickness":
                maximum_thickness,

            "minimum_thickness":
                minimum_thickness,

            "average_thickness":
                average_thickness,

            "peak_day":
                peak_day,

            "variation":
                variation

        })


    except Exception as error:

        print(
            "\n!!! SIMULATION ERROR !!!"
        )

        print(
            repr(error)
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# ============================================================
# 3. HSG TUBE PATENCY
# ============================================================

@app.route(
    "/api/hsg",
    methods=["POST"]
)
def hsg_analysis():

    try:

        print(
            "\nHSG request received."
        )


        # --------------------------------------------
        # Check image
        # --------------------------------------------

        if "image" not in request.files:

            return jsonify({

                "success": False,

                "error":
                    "No HSG image uploaded."

            }), 400


        uploaded_file = request.files["image"]


        if uploaded_file.filename == "":

            return jsonify({

                "success": False,

                "error":
                    "No HSG image selected."

            }), 400


        print(
            "HSG image:",
            uploaded_file.filename
        )


        # --------------------------------------------
        # Import HSG engine
        # --------------------------------------------

        from tube_patency_engine import (
            predict_tube_patency
        )


        # --------------------------------------------
        # Run model
        # --------------------------------------------

        status, confidence = (
            predict_tube_patency(
                uploaded_file
            )
        )


        status = str(status)

        confidence = float(
            confidence
        )


        print(
            "HSG result:",
            status,
            confidence
        )


        hsg_result = {

            "status":
                status,

            "confidence":
                confidence

        }


        return jsonify({

            "success": True,

            "result":
                hsg_result,

            "status":
                status,

            "confidence":
                confidence

        })


    except Exception as error:

        print(
            "\n!!! HSG ERROR !!!"
        )

        print(
            repr(error)
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# ============================================================
# 3D MODEL / ASSETS
# ============================================================

@app.route(
    "/assets/<path:filename>"
)
def assets(filename):

    return send_from_directory(
        ASSETS_DIR,
        filename
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "success": True,

        "regression_model":
            regressor is not None,

        "classification_model":
            classifier is not None,

        "status":
            "FertiScan backend is running"

    })


# ============================================================
# ERROR HANDLER
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "success": False,

        "error":
            "Endpoint not found."

    }), 404


@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "success": False,

        "error":
            "Internal server error."

    }), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print(" FertiScan - AI Reproductive Digital Twin")
    print("=" * 60)
    print()

    print(
        "Regression model:",
        "READY"
        if regressor is not None
        else "FAILED"
    )

    print(
        "Classification model:",
        "READY"
        if classifier is not None
        else "FAILED"
    )

    print()
    print(
        "Website:"
    )
    print(
        "http://127.0.0.1:5000"
    )

    print()
    print(
        "API endpoints:"
    )
    print(
        "POST /api/predict"
    )
    print(
        "POST /api/simulate"
    )
    print(
        "POST /api/hsg"
    )

    print()
    print("=" * 60)
    print()


    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
        threaded=True
    )