"""
==========================================================
FertiScan - 28-Day Digital Twin Simulation Engine
==========================================================

Backend simulation module for the female reproductive
Digital Twin.

This module:
    - Simulates endometrial thickness for Cycle Days 1-28
    - Uses the trained Random Forest regression model
    - Keeps patient parameters fixed
    - Changes only Cycle Day
    - Returns JSON-friendly results for the JavaScript
      frontend

IMPORTANT:
    Predictions are independent day-wise predictions.
    No artificial variation is added.
    No recursive feedback is used.
==========================================================
"""

import numpy as np


# ==========================================================
# DIGITAL TWIN SIMULATOR
# ==========================================================

class DigitalTwinSimulator:

    def __init__(self, regressor):

        self.regressor = regressor


    # ======================================================
    # CREATE MODEL INPUT
    # ======================================================

    def create_features(
        self,
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
        Creates the exact 11-feature input structure used
        by the trained Random Forest regression model.
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
            int(cycle_day)
        ]])


    # ======================================================
    # RUN 28-DAY SIMULATION
    # ======================================================

    def run_simulation(
        self,
        age,
        bmi,
        fsh,
        lh,
        estrogen,
        amh,
        progesterone,
        baseline_thickness,
        prp_sessions,
        prp_dosage
    ):
        """
        Runs an independent 28-day simulation.

        Every day uses the same patient parameters.

        Only cycle_day changes:

            Day 1
            Day 2
            ...
            Day 28
        """

        days = []

        thickness = []


        # --------------------------------------------------
        # Predict every cycle day
        # --------------------------------------------------

        for cycle_day in range(1, 29):

            features = self.create_features(

                age=age,

                bmi=bmi,

                fsh=fsh,

                lh=lh,

                estrogen=estrogen,

                amh=amh,

                progesterone=progesterone,

                baseline_thickness=baseline_thickness,

                prp_sessions=prp_sessions,

                prp_dosage=prp_dosage,

                cycle_day=cycle_day
            )


            predicted_value = self.regressor.predict(
                features
            )[0]


            days.append(cycle_day)

            thickness.append(
                float(predicted_value)
            )


        # --------------------------------------------------
        # Summary calculations
        # --------------------------------------------------

        minimum = min(thickness)

        maximum = max(thickness)

        average = float(
            np.mean(thickness)
        )


        peak_index = int(
            np.argmax(thickness)
        )

        peak_day = days[peak_index]


        # --------------------------------------------------
        # Day-to-day variation
        # --------------------------------------------------

        variation = maximum - minimum


        # --------------------------------------------------
        # Return result
        # --------------------------------------------------

        return {

            "days": days,

            "thickness": [
                round(value, 4)
                for value in thickness
            ],

            "start_thickness":
                round(
                    thickness[0],
                    2
                ),

            "end_thickness":
                round(
                    thickness[-1],
                    2
                ),

            "minimum_thickness":
                round(
                    minimum,
                    2
                ),

            "maximum_thickness":
                round(
                    maximum,
                    2
                ),

            "average_thickness":
                round(
                    average,
                    2
                ),

            "peak_day":
                int(peak_day),

            "variation":
                round(
                    variation,
                    4
                )
        }


# ==========================================================
# CYCLE PHASE INFORMATION
# ==========================================================

def get_cycle_phases():
    """
    Returns the menstrual-cycle phase information.

    These are used by the JavaScript frontend to display
    the cycle phases on the Digital Twin graph.
    """

    return [

        {
            "name": "Menstrual Phase",
            "start_day": 1,
            "end_day": 5
        },

        {
            "name": "Proliferative Phase",
            "start_day": 6,
            "end_day": 13
        },

        {
            "name": "Fertile / Ovulatory Window",
            "start_day": 14,
            "end_day": 21
        },

        {
            "name": "Luteal Phase",
            "start_day": 22,
            "end_day": 28
        }

    ]


# ==========================================================
# PRP INFORMATION
# ==========================================================

def get_prp_information(
    prp_sessions,
    prp_dosage
):
    """
    Returns PRP treatment information for the frontend.

    This does NOT artificially modify the model output.

    The actual PRP effect is represented through the
    trained model using PRP session and dosage inputs.
    """

    return {

        "sessions":
            int(prp_sessions),

        "dosage":
            float(prp_dosage),

        "description":
            "PRP parameters are included as model inputs."
    }


# ==========================================================
# DIGITAL TWIN RESULT BUILDER
# ==========================================================

def build_digital_twin_result(
    regressor,
    age,
    bmi,
    fsh,
    lh,
    estrogen,
    amh,
    progesterone,
    baseline_thickness,
    prp_sessions,
    prp_dosage
):
    """
    Convenience function used by Flask.

    Creates the DigitalTwinSimulator and runs the
    complete 28-day simulation.
    """

    simulator = DigitalTwinSimulator(
        regressor=regressor
    )


    # ------------------------------------------------------
    # Run simulation
    # ------------------------------------------------------

    simulation = simulator.run_simulation(

        age=age,

        bmi=bmi,

        fsh=fsh,

        lh=lh,

        estrogen=estrogen,

        amh=amh,

        progesterone=progesterone,

        baseline_thickness=baseline_thickness,

        prp_sessions=prp_sessions,

        prp_dosage=prp_dosage
    )


    # ------------------------------------------------------
    # Add cycle phases
    # ------------------------------------------------------

    simulation["cycle_phases"] = (
        get_cycle_phases()
    )


    # ------------------------------------------------------
    # Add PRP information
    # ------------------------------------------------------

    simulation["prp"] = (
        get_prp_information(
            prp_sessions,
            prp_dosage
        )
    )


    # ------------------------------------------------------
    # Simulation mode
    # ------------------------------------------------------

    simulation["mode"] = (
        "Independent day-wise prediction"
    )


    simulation["recursive"] = False


    return simulation


# ==========================================================
# SIMPLE LOCAL TEST
# ==========================================================

if __name__ == "__main__":

    print("=" * 60)

    print(
        "FertiScan - Digital Twin Simulation Module"
    )

    print("=" * 60)

    print()

    print(
        "This module requires a trained regression model."
    )

    print()

    print(
        "It is designed to be called from Flask."
    )

    print()

    print(
        "Simulation:"
    )

    print(
        "  Cycle Days: 1-28"
    )

    print(
        "  Prediction Mode: Independent"
    )

    print(
        "  Recursive: No"
    )

    print()

    print(
        "✓ Digital Twin simulation module ready."
    )