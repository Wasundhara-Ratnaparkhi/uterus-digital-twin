import os
import joblib
import numpy as np


# ==========================================================
# MODEL PATHS
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

REGRESSION_MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "reg_model.pkl"
)

CLASSIFICATION_MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "clf_model.pkl"
)


# ==========================================================
# LOAD MODELS
# ==========================================================

_regressor = None
_classifier = None


def load_models():
    """
    Loads the trained Random Forest models.

    Regression model:
        Predicts endometrial thickness.

    Classification model:
        Predicts fertility outcome.
    """

    global _regressor
    global _classifier

    if _regressor is None:

        _regressor = joblib.load(
            REGRESSION_MODEL_PATH
        )

    if _classifier is None:

        _classifier = joblib.load(
            CLASSIFICATION_MODEL_PATH
        )

    return _regressor, _classifier


# ==========================================================
# CREATE FEATURE VECTOR
# ==========================================================

def create_features(
    age,
    bmi,
    fsh,
    lh,
    estrogen,
    amh,
    progesterone,
    baseline_thickness,
    prp_sessions,
    prp_dosage,
    cycle_day
):
    """
    Creates the exact 11-feature input structure
    used by the trained models.

    Feature order MUST remain unchanged.
    """

    return np.array([[
        float(age),
        float(bmi),
        float(fsh),
        float(lh),
        float(estrogen),
        float(amh),
        float(progesterone),
        float(baseline_thickness),
        float(prp_sessions),
        float(prp_dosage),
        float(cycle_day)
    ]])


# ==========================================================
# PREDICT ENDOMETRIAL THICKNESS
# ==========================================================

def predict_endometrial_thickness(
    age,
    bmi,
    fsh,
    lh,
    estrogen,
    amh,
    progesterone,
    baseline_thickness,
    prp_sessions,
    prp_dosage,
    cycle_day
):
    """
    Predicts endometrial thickness using
    the trained Random Forest regression model.
    """

    regressor, _ = load_models()

    features = create_features(
        age,
        bmi,
        fsh,
        lh,
        estrogen,
        amh,
        progesterone,
        baseline_thickness,
        prp_sessions,
        prp_dosage,
        cycle_day
    )

    prediction = regressor.predict(
        features
    )[0]

    return float(prediction)


# ==========================================================
# PREDICT FERTILITY OUTCOME
# ==========================================================

def predict_fertility(
    age,
    bmi,
    fsh,
    lh,
    estrogen,
    amh,
    progesterone,
    baseline_thickness,
    prp_sessions,
    prp_dosage,
    cycle_day
):
    """
    Predicts fertility outcome using the trained
    Random Forest classification model.

    Class mapping:
        0 → Infertile
        1 → Fertile
    """

    _, classifier = load_models()

    features = create_features(
        age,
        bmi,
        fsh,
        lh,
        estrogen,
        amh,
        progesterone,
        baseline_thickness,
        prp_sessions,
        prp_dosage,
        cycle_day
    )

    predicted_class = int(
        classifier.predict(features)[0]
    )

    # ------------------------------------------------------
    # Convert numerical class to readable label
    # ------------------------------------------------------

    if predicted_class == 1:

        label = "Fertile"

    else:

        label = "Infertile"


    # ------------------------------------------------------
    # Calculate model probability
    # ------------------------------------------------------

    confidence = None

    if hasattr(
        classifier,
        "predict_proba"
    ):

        probabilities = (
            classifier.predict_proba(
                features
            )[0]
        )

        confidence = float(
            max(probabilities) * 100
        )


    return {
        "class": predicted_class,
        "label": label,
        "confidence": confidence
    }


# ==========================================================
# COMPLETE PATIENT PREDICTION
# ==========================================================

def predict_patient(
    age,
    bmi,
    fsh,
    lh,
    estrogen,
    amh,
    progesterone,
    baseline_thickness,
    prp_sessions,
    prp_dosage,
    cycle_day
):
    """
    Runs both AI models for one patient.

    Returns:
        Endometrial thickness
        Fertility outcome
        Classification confidence
    """

    # ------------------------------------------------------
    # Load models
    # ------------------------------------------------------

    regressor, classifier = load_models()


    # ------------------------------------------------------
    # Create features
    # ------------------------------------------------------

    features = create_features(
        age,
        bmi,
        fsh,
        lh,
        estrogen,
        amh,
        progesterone,
        baseline_thickness,
        prp_sessions,
        prp_dosage,
        cycle_day
    )


    # ------------------------------------------------------
    # Regression prediction
    # ------------------------------------------------------

    thickness = float(
        regressor.predict(
            features
        )[0]
    )


    # ------------------------------------------------------
    # Classification prediction
    # ------------------------------------------------------

    predicted_class = int(
        classifier.predict(
            features
        )[0]
    )


    # ------------------------------------------------------
    # Fertility label
    # ------------------------------------------------------

    label = (
        "Fertile"
        if predicted_class == 1
        else "Infertile"
    )


    # ------------------------------------------------------
    # Classification confidence
    # ------------------------------------------------------

    confidence = None

    if hasattr(
        classifier,
        "predict_proba"
    ):

        probabilities = (
            classifier.predict_proba(
                features
            )[0]
        )

        confidence = float(
            max(probabilities) * 100
        )


    # ------------------------------------------------------
    # Return result
    # ------------------------------------------------------

    return {

        "endometrial_thickness":
            round(
                thickness,
                2
            ),

        "fertility_outcome":
            label,

        "fertility_class":
            predicted_class,

        "confidence":
            round(
                confidence,
                2
            ) if confidence is not None else None
    }


# ==========================================================
# TESTING
# ==========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("Testing FertiScan Prediction Engine")
    print("=" * 60)

    result = predict_patient(

        age=27,

        bmi=21.5,

        fsh=6.2,

        lh=5.5,

        estrogen=150,

        amh=3.2,

        progesterone=1.5,

        baseline_thickness=6.5,

        prp_sessions=3,

        prp_dosage=2.5,

        cycle_day=14
    )

    print()
    print(
        "Predicted Endometrial Thickness:",
        result["endometrial_thickness"],
        "mm"
    )

    print(
        "Fertility Outcome:",
        result["fertility_outcome"]
    )

    print(
        "Confidence:",
        result["confidence"],
        "%"
    )

    print()
    print("✓ Prediction engine working")