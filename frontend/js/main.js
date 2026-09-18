// ============================================
// FERTISCAN - MAIN JAVASCRIPT
// Patient Assessment + AI Prediction
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // ============================================
    // ELEMENTS
    // ============================================

    const predictionForm =
        document.getElementById("predictionForm");

    const analyzeBtn =
        document.getElementById("analyzeBtn");

    const predictionLoading =
        document.getElementById("predictionLoading");

    const predictionSection =
        document.getElementById("prediction");

    const thicknessResult =
        document.getElementById("thicknessResult");

    const fertilityResult =
        document.getElementById("fertilityResult");

    const confidenceResult =
        document.getElementById("confidenceResult");

    const cycleResult =
        document.getElementById("cycleResult");

    const patientSummary =
        document.getElementById("patientSummary");


    // ============================================
    // GLOBAL VARIABLES
    // ============================================

    window.currentPatientData = null;
    window.currentPrediction = null;


    // ============================================
    // GLOBAL SECTION NAVIGATION
    // IMPORTANT:
    // Used by onclick="scrollToSection(...)"
    // in index.html
    // ============================================

    window.scrollToSection = function (sectionId) {

        const section =
            document.getElementById(sectionId);

        if (!section) {

            console.warn(
                "Section not found:",
                sectionId
            );

            return;
        }

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    };


    // ============================================
    // NORMAL NAVIGATION LINKS
    // ============================================

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }

                const target =
                    document.querySelector(targetId);

                if (!target) {
                    return;
                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    });


    // ============================================
    // CHECK PREDICTION FORM
    // ============================================

    if (!predictionForm) {

        console.error(
            "Prediction form not found."
        );

        return;
    }


    // ============================================
    // FORM SUBMISSION
    // ============================================

    predictionForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            // ----------------------------------------
            // SHOW LOADING
            // ----------------------------------------

            if (analyzeBtn) {
                analyzeBtn.disabled = true;
            }

            if (predictionLoading) {
                predictionLoading.classList.remove(
                    "hidden"
                );
            }


            // ----------------------------------------
            // COLLECT INPUT DATA
            // ----------------------------------------

            const patientData = {

                age:
                    getNumber("age"),

                bmi:
                    getNumber("bmi"),

                fsh:
                    getNumber("fsh"),

                lh:
                    getNumber("lh"),

                estrogen:
                    getNumber("estrogen"),

                amh:
                    getNumber("amh"),

                progesterone:
                    getNumber("progesterone"),

                cycle_day:
                    getNumber("cycle_day"),

                baseline_thickness:
                    getNumber("baseline_thickness"),

                prp_sessions:
                    getNumber("prp_sessions"),

                prp_dosage:
                    getNumber("prp_dosage")

            };


            console.log(
                "Patient data:",
                patientData
            );


            // ----------------------------------------
            // VALIDATE
            // ----------------------------------------

            const validationError =
                validatePatientData(
                    patientData
                );


            if (validationError) {

                alert(validationError);

                resetPredictionButton();

                return;
            }


            try {

                // ====================================
                // CALL FLASK API
                // ====================================

                const response =
                    await fetch(
                        "/api/predict",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    patientData
                                )
                        }
                    );


                // ------------------------------------
                // READ RESPONSE
                // ------------------------------------

                const result =
                    await response.json();


                console.log(
                    "Prediction API response:",
                    result
                );


                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Prediction request failed."
                    );

                }


                // ====================================
                // STORE DATA
                // ====================================

                window.currentPatientData =
                    patientData;

                window.currentPrediction =
                    result;


                // ====================================
                // DISPLAY RESULT
                // ====================================

                displayPrediction(
                    result,
                    patientData
                );


                // ====================================
                // SHOW PREDICTION SECTION
                // ====================================

                if (predictionSection) {

                    predictionSection.classList.remove(
                        "hidden"
                    );

                    setTimeout(() => {

                        predictionSection.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }, 150);

                }


                // ====================================
                // UPDATE DIGITAL TWIN
                // ====================================

                updateDigitalTwinValues(
                    patientData,
                    result
                );


            } catch (error) {

                console.error(
                    "Prediction error:",
                    error
                );


                alert(
                    "Unable to generate prediction.\n\n" +
                    error.message
                );


            } finally {

                resetPredictionButton();

            }

        }
    );


    // ============================================
    // DISPLAY PREDICTION
    // ============================================

    function displayPrediction(
        result,
        patientData
    ) {

        // ----------------------------------------
        // GET VALUES
        // ----------------------------------------

        const thickness =
            getPredictionThickness(result);

        const fertility =
            getFertilityOutcome(result);

        const confidence =
            getPredictionConfidence(result);


        console.log(
            "Processed prediction:",
            {
                thickness,
                fertility,
                confidence
            }
        );


        // ========================================
        // ENDOMETRIAL THICKNESS
        // ========================================

        if (thicknessResult) {

            if (Number.isFinite(thickness)) {

                thicknessResult.textContent =
                    `${thickness.toFixed(2)} mm`;

            } else {

                thicknessResult.textContent =
                    "Not available";

                console.warn(
                    "Could not find endometrial thickness in API response."
                );

            }

        }


        // ========================================
        // FERTILITY OUTCOME
        // ========================================

        if (fertilityResult) {

            fertilityResult.classList.remove(
                "fertile",
                "infertile"
            );


            if (fertility) {

                fertilityResult.textContent =
                    fertility;


                if (
                    fertility.toLowerCase() ===
                    "fertile"
                ) {

                    fertilityResult.classList.add(
                        "fertile"
                    );

                } else if (
                    fertility.toLowerCase() ===
                    "infertile"
                ) {

                    fertilityResult.classList.add(
                        "infertile"
                    );

                }

            } else {

                fertilityResult.textContent =
                    "Not available";

            }

        }


        // ========================================
        // CONFIDENCE
        // ========================================

        if (confidenceResult) {

            if (Number.isFinite(confidence)) {

                confidenceResult.textContent =
                    `${confidence.toFixed(2)}%`;

            } else {

                confidenceResult.textContent =
                    "Not available";

            }

        }


        // ========================================
        // CYCLE DAY
        // ========================================

        if (cycleResult) {

            cycleResult.textContent =
                `Day ${patientData.cycle_day}`;

        }


        // ========================================
        // PATIENT SUMMARY
        // ========================================

        if (patientSummary) {

            patientSummary.innerHTML = `

                <div class="summary-item">
                    <span>Age</span>
                    <strong>
                        ${patientData.age} years
                    </strong>
                </div>

                <div class="summary-item">
                    <span>BMI</span>
                    <strong>
                        ${patientData.bmi.toFixed(1)}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>FSH</span>
                    <strong>
                        ${patientData.fsh}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>LH</span>
                    <strong>
                        ${patientData.lh}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>Estrogen</span>
                    <strong>
                        ${patientData.estrogen}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>AMH</span>
                    <strong>
                        ${patientData.amh}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>Progesterone</span>
                    <strong>
                        ${patientData.progesterone}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>Baseline Thickness</span>
                    <strong>
                        ${patientData.baseline_thickness} mm
                    </strong>
                </div>

                <div class="summary-item">
                    <span>PRP Sessions</span>
                    <strong>
                        ${patientData.prp_sessions}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>PRP Dosage</span>
                    <strong>
                        ${patientData.prp_dosage}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>Cycle Day</span>
                    <strong>
                        ${patientData.cycle_day}
                    </strong>
                </div>

            `;

        }

    }


    // ============================================
    // GET ENDOMETRIAL THICKNESS
    // Handles multiple possible API field names
    // ============================================

    function getPredictionThickness(result) {

        const possibleValues = [

            result.endometrial_thickness,

            result.predicted_thickness,

            result.predicted_endometrial_thickness,

            result.thickness,

            result.predictedThickness,

            result.endometrium_thickness

        ];


        for (const value of possibleValues) {

            const number =
                Number(value);

            if (Number.isFinite(number)) {
                return number;
            }

        }


        return NaN;

    }


    // ============================================
    // GET FERTILITY OUTCOME
    // ============================================

    function getFertilityOutcome(result) {

        const possibleValues = [

            result.fertility_outcome,

            result.fertility,

            result.fertility_label,

            result.prediction,

            result.label,

            result.outcome

        ];


        for (const value of possibleValues) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                // Handle numeric class
                if (
                    value === 1 ||
                    value === "1"
                ) {
                    return "Fertile";
                }

                if (
                    value === 0 ||
                    value === "0"
                ) {
                    return "Infertile";
                }


                const text =
                    String(value).trim();


                if (
                    text.toLowerCase()
                        .includes("fertile")
                ) {

                    if (
                        text.toLowerCase()
                            .includes("infertile")
                    ) {
                        return "Infertile";
                    }

                    return "Fertile";
                }


                if (
                    text.toLowerCase()
                        .includes("infertile")
                ) {

                    return "Infertile";

                }


                return text;

            }

        }


        return null;

    }


    // ============================================
    // GET CONFIDENCE
    // ============================================

    function getPredictionConfidence(result) {

        const possibleValues = [

            result.confidence,

            result.prediction_confidence,

            result.fertility_confidence,

            result.model_confidence,

            result.confidence_score

        ];


        for (const value of possibleValues) {

            let number =
                Number(value);


            if (!Number.isFinite(number)) {
                continue;
            }


            // If backend sends 0-1 probability,
            // convert to percentage.
            if (
                number >= 0 &&
                number <= 1
            ) {

                number *= 100;

            }


            return number;

        }


        return NaN;

    }


    // ============================================
    // UPDATE DIGITAL TWIN
    // ============================================

    function updateDigitalTwinValues(
        patientData,
        result
    ) {

        const modelThickness =
            document.getElementById(
                "modelThickness"
            );

        const modelCycleDay =
            document.getElementById(
                "modelCycleDay"
            );

        const dynamicThickness =
            document.getElementById(
                "dynamicThickness"
            );


        const thickness =
            getPredictionThickness(result);


        // ----------------------------------------
        // Thickness display
        // ----------------------------------------

        if (modelThickness) {

            if (Number.isFinite(thickness)) {

                modelThickness.textContent =
                    `Endometrium: ${thickness.toFixed(2)} mm`;

            } else {

                modelThickness.textContent =
                    "Endometrium: -- mm";

            }

        }


        // ----------------------------------------
        // Cycle day display
        // ----------------------------------------

        if (modelCycleDay) {

            modelCycleDay.textContent =
                `Cycle Day: ${patientData.cycle_day}`;

        }


        // ----------------------------------------
        // Dynamic schematic
        // ----------------------------------------

        if (dynamicThickness) {

            if (Number.isFinite(thickness)) {

                dynamicThickness.textContent =
                    `${thickness.toFixed(2)} mm`;

            } else {

                dynamicThickness.textContent =
                    "-- mm";

            }

        }


        // ----------------------------------------
        // Connect to viewer.js
        // ----------------------------------------

        if (
            Number.isFinite(thickness) &&
            typeof window.updateEndometriumVisualization ===
            "function"
        ) {

            window.updateEndometriumVisualization(
                thickness
            );

        }


        // Update cycle day in viewer
        if (
            typeof window.updateCycleDay ===
            "function"
        ) {

            window.updateCycleDay(
                patientData.cycle_day
            );

        }

    }


    // ============================================
    // GET NUMBER FROM INPUT
    // ============================================

    function getNumber(id) {

        const element =
            document.getElementById(id);


        if (!element) {

            console.warn(
                `Input not found: ${id}`
            );

            return NaN;

        }


        const value =
            Number(element.value);


        return value;

    }


    // ============================================
    // VALIDATE PATIENT DATA
    // ============================================

    function validatePatientData(data) {

        for (
            const [key, value]
            of Object.entries(data)
        ) {

            if (!Number.isFinite(value)) {

                return (
                    `Please enter a valid value for ` +
                    `${formatLabel(key)}.`
                );

            }

        }


        if (data.age <= 0) {
            return "Age must be greater than 0.";
        }


        if (data.bmi <= 0) {
            return "BMI must be greater than 0.";
        }


        if (data.fsh < 0) {
            return "FSH cannot be negative.";
        }


        if (data.lh < 0) {
            return "LH cannot be negative.";
        }


        if (data.estrogen < 0) {
            return "Estrogen cannot be negative.";
        }


        if (data.amh < 0) {
            return "AMH cannot be negative.";
        }


        if (data.progesterone < 0) {
            return "Progesterone cannot be negative.";
        }


        if (
            data.cycle_day < 1 ||
            data.cycle_day > 28
        ) {

            return (
                "Cycle day must be between 1 and 28."
            );

        }


        if (data.baseline_thickness < 0) {

            return (
                "Baseline endometrial thickness " +
                "cannot be negative."
            );

        }


        if (data.prp_sessions < 0) {

            return (
                "PRP sessions cannot be negative."
            );

        }


        if (data.prp_dosage < 0) {

            return (
                "PRP dosage cannot be negative."
            );

        }


        return null;

    }


    // ============================================
    // FORMAT LABEL
    // ============================================

    function formatLabel(key) {

        return key
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                char => char.toUpperCase()
            );

    }


    // ============================================
    // RESET PREDICTION BUTTON
    // ============================================

    function resetPredictionButton() {

        if (analyzeBtn) {
            analyzeBtn.disabled = false;
        }

        if (predictionLoading) {

            predictionLoading.classList.add(
                "hidden"
            );

        }

    }


    // ============================================
    // FINAL MESSAGE
    // ============================================

    console.log(
        "FertiScan main.js loaded successfully."
    );

    console.log(
        "Global scrollToSection() is available."
    );

});