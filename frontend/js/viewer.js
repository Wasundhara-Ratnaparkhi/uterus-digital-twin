// ============================================
// FERTISCAN - 3D DIGITAL TWIN VIEWER
// Female Reproductive System + Dynamic Endometrium
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // ============================================
    // ELEMENTS
    // ============================================

    const reproductiveModel =
        document.getElementById("reproductiveModel");

    const modelThickness =
        document.getElementById("modelThickness");

    const modelCycleDay =
        document.getElementById("modelCycleDay");

    const endometriumLayer =
        document.getElementById("endometriumLayer");

    const dynamicThickness =
        document.getElementById("dynamicThickness");


    // ============================================
    // CURRENT VALUES
    // ============================================

    let currentThickness = null;
    let currentCycleDay = null;


    // ============================================
    // UPDATE ENDOMETRIUM VISUALIZATION
    // ============================================

    window.updateEndometriumVisualization =
        function (thickness) {

            const value = Number(thickness);

            if (!Number.isFinite(value)) {
                console.warn(
                    "Invalid endometrial thickness:",
                    thickness
                );
                return;
            }


            currentThickness = value;


            // ========================================
            // UPDATE TEXT VALUES
            // ========================================

            if (dynamicThickness) {

                dynamicThickness.textContent =
                    `${value.toFixed(2)} mm`;

            }


            if (modelThickness) {

                modelThickness.textContent =
                    `Endometrium: ${value.toFixed(2)} mm`;

            }


            // ========================================
            // DYNAMIC ENDOMETRIUM SCHEMATIC
            // ========================================

            if (endometriumLayer) {

                /*
                 * IMPORTANT
                 *
                 * The actual GLB uterus is NOT being
                 * physically deformed.
                 *
                 * This layer is a visual cross-section
                 * representing the predicted
                 * endometrial thickness.
                 */


                // ------------------------------------
                // Thickness range
                // ------------------------------------

                const minThickness = 3;
                const maxThickness = 15;


                // ------------------------------------
                // Clamp model value
                // ------------------------------------

                const clampedValue =
                    Math.max(
                        minThickness,
                        Math.min(
                            maxThickness,
                            value
                        )
                    );


                // ------------------------------------
                // Convert thickness to visual
                // thickness
                //
                // IMPORTANT:
                // We use BORDER WIDTH rather than
                // increasing the whole oval height.
                // This keeps the endometrium
                // anatomically centered around
                // the cavity.
                // ------------------------------------

                const normalized =
                    (
                        clampedValue -
                        minThickness
                    ) /
                    (
                        maxThickness -
                        minThickness
                    );


                const borderWidth =
                    3 +
                    normalized * 8;


                // ====================================
                // FORCE CORRECT POSITION
                // ====================================

                endometriumLayer.style.position =
                    "absolute";

                endometriumLayer.style.left =
                    "50%";

                endometriumLayer.style.top =
                    "50%";

                endometriumLayer.style.transform =
                    "translate(-50%, -50%)";


                // ====================================
                // FORCE CORRECT SIZE
                // ====================================

                /*
                 * The layer surrounds the uterine
                 * cavity instead of sitting on the
                 * right side.
                 */

                endometriumLayer.style.width =
                    "42%";

                endometriumLayer.style.height =
                    "58%";


                // ====================================
                // MAKE IT A CONCENTRIC LAYER
                // ====================================

                endometriumLayer.style.boxSizing =
                    "border-box";

                endometriumLayer.style.border =
                    `${borderWidth}px solid rgba(185, 119, 70, 0.85)`;


                // Transparent center = uterine cavity
                endometriumLayer.style.background =
                    "rgba(205, 155, 112, 0.12)";


                // Smooth anatomical shape
                endometriumLayer.style.borderRadius =
                    "46% 46% 44% 44% / 42% 42% 50% 50%";


                // ====================================
                // REMOVE OLD CONFLICTING STYLES
                // ====================================

                endometriumLayer.style.margin =
                    "0";

                endometriumLayer.style.bottom =
                    "auto";

                endometriumLayer.style.right =
                    "auto";

                endometriumLayer.style.zIndex =
                    "3";

                endometriumLayer.style.pointerEvents =
                    "none";


                // ====================================
                // DATA ATTRIBUTE
                // ====================================

                endometriumLayer.setAttribute(
                    "data-thickness",
                    `${value.toFixed(2)} mm`
                );


                // ====================================
                // VISUAL UPDATE ANIMATION
                // ====================================

                endometriumLayer.style.transition =
                    "border-width 0.5s ease, " +
                    "background 0.5s ease, " +
                    "width 0.5s ease, " +
                    "height 0.5s ease";


                console.log(
                    `Dynamic endometrium updated: ${value.toFixed(2)} mm`
                );

            }

        };


    // ============================================
    // UPDATE CYCLE DAY
    // ============================================

    window.updateCycleDay =
        function (cycleDay) {

            const day = Number(cycleDay);


            if (
                !Number.isFinite(day) ||
                day < 1 ||
                day > 28
            ) {

                console.warn(
                    "Invalid cycle day:",
                    cycleDay
                );

                return;

            }


            currentCycleDay = day;


            if (modelCycleDay) {

                modelCycleDay.textContent =
                    `Cycle Day: ${day}`;

            }


            console.log(
                `Digital Twin cycle day updated: ${day}`
            );

        };


    // ============================================
    // MODEL LOAD EVENT
    // ============================================

    if (reproductiveModel) {

        reproductiveModel.addEventListener(
            "load",
            () => {

                console.log(
                    "3D reproductive system model loaded."
                );


                reproductiveModel.cameraOrbit =
                    "0deg 75deg auto";

            }
        );


        reproductiveModel.addEventListener(
            "error",
            event => {

                console.error(
                    "Unable to load 3D model:",
                    event
                );

            }
        );

    }


    // ============================================
    // GET THICKNESS FROM PREDICTION
    // ============================================

    function getPredictionThickness(
        prediction
    ) {

        if (!prediction) {
            return NaN;
        }


        /*
         * Supports BOTH:
         *
         * currentPrediction.endometrial_thickness
         *
         * AND:
         *
         * currentPrediction.result
         *     .endometrial_thickness
         */


        const possibleValues = [

            prediction.endometrial_thickness,

            prediction.predicted_thickness,

            prediction.predicted_endometrial_thickness,

            prediction.thickness,

            prediction.result?.endometrial_thickness,

            prediction.result?.predicted_thickness,

            prediction.result?.predicted_endometrial_thickness,

            prediction.result?.thickness

        ];


        for (
            const value
            of possibleValues
        ) {

            const number =
                Number(value);


            if (
                Number.isFinite(number)
            ) {

                return number;

            }

        }


        return NaN;

    }


    // ============================================
    // CONNECT WITH CURRENT PATIENT DATA
    // ============================================

    function syncWithPatientData() {

        // ----------------------------------------
        // Patient data
        // ----------------------------------------

        if (
            window.currentPatientData
        ) {

            const cycleDay =
                Number(
                    window.currentPatientData
                        .cycle_day
                );


            if (
                Number.isFinite(cycleDay)
            ) {

                window.updateCycleDay(
                    cycleDay
                );

            }

        }


        // ----------------------------------------
        // Prediction
        // ----------------------------------------

        if (
            window.currentPrediction
        ) {

            const thickness =
                getPredictionThickness(
                    window.currentPrediction
                );


            if (
                Number.isFinite(thickness)
            ) {

                window.updateEndometriumVisualization(
                    thickness
                );

            }

        }

    }


    // ============================================
    // INITIAL SYNC
    // ============================================

    setTimeout(
        syncWithPatientData,
        500
    );


    // ============================================
    // CONTINUOUS SYNC
    // ============================================

    setInterval(
        syncWithPatientData,
        1000
    );


    // ============================================
    // RESET VIEW
    // ============================================

    window.resetViewer =
        function () {

            currentThickness = null;
            currentCycleDay = null;


            // ----------------------------------------
            // Reset thickness
            // ----------------------------------------

            if (dynamicThickness) {

                dynamicThickness.textContent =
                    "-- mm";

            }


            if (modelThickness) {

                modelThickness.textContent =
                    "Endometrium: -- mm";

            }


            // ----------------------------------------
            // Reset cycle
            // ----------------------------------------

            if (modelCycleDay) {

                modelCycleDay.textContent =
                    "Cycle Day: --";

            }


            // ----------------------------------------
            // Reset visual layer
            // ----------------------------------------

            if (endometriumLayer) {

                endometriumLayer.style.position =
                    "absolute";

                endometriumLayer.style.left =
                    "50%";

                endometriumLayer.style.top =
                    "50%";

                endometriumLayer.style.transform =
                    "translate(-50%, -50%)";

                endometriumLayer.style.width =
                    "42%";

                endometriumLayer.style.height =
                    "58%";

                endometriumLayer.style.border =
                    "3px solid rgba(185, 119, 70, 0.65)";

                endometriumLayer.style.background =
                    "rgba(205, 155, 112, 0.12)";

                endometriumLayer.style.borderRadius =
                    "46% 46% 44% 44% / 42% 42% 50% 50%";

                endometriumLayer.removeAttribute(
                    "data-thickness"
                );

            }

        };


    // ============================================
    // INITIALIZATION
    // ============================================

    console.log(
        "FertiScan viewer.js loaded successfully."
    );

});