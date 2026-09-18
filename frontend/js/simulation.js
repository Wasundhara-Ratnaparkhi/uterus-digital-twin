// ============================================
// FERTISCAN - DIGITAL TWIN SIMULATION
// 28-Day Endometrial Thickness Simulation
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    const runSimulationBtn =
        document.getElementById("runSimulationBtn");

    const simulationLoading =
        document.getElementById("simulationLoading");

    const simulationChart =
        document.getElementById("simulationChart");

    const simulationSummary =
        document.getElementById("simulationSummary");

    const simStart =
        document.getElementById("simStart");

    const simEnd =
        document.getElementById("simEnd");

    const simMaximum =
        document.getElementById("simMaximum");

    const simAverage =
        document.getElementById("simAverage");

    const simPeak =
        document.getElementById("simPeak");

    const simulationInsight =
        document.getElementById("simulationInsight");


    // ============================================
    // RUN SIMULATION
    // ============================================

    if (runSimulationBtn) {

        runSimulationBtn.addEventListener(
            "click",
            runDigitalTwinSimulation
        );

    }


    async function runDigitalTwinSimulation() {

        // Check whether patient data exists
        if (!window.currentPatientData) {

            alert(
                "Please complete the AI assessment first."
            );

            const assessment =
                document.getElementById("assessment");

            if (assessment) {
                assessment.scrollIntoView({
                    behavior: "smooth"
                });
            }

            return;
        }


        // Disable button
        runSimulationBtn.disabled = true;


        // Show loading
        if (simulationLoading) {
            simulationLoading.classList.remove("hidden");
        }


        try {

            // ========================================
            // SEND PATIENT DATA TO FLASK
            // ========================================

            const response = await fetch(
                "/api/simulate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(
                        window.currentPatientData
                    )
                }
            );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Simulation request failed."
                );

            }


            // ========================================
            // DISPLAY SIMULATION
            // ========================================

            displaySimulation(result);


            // Store globally
            window.currentSimulation = result;


        } catch (error) {

            console.error(
                "Digital Twin simulation error:",
                error
            );

            alert(
                "Unable to run Digital Twin simulation.\n\n" +
                error.message
            );


        } finally {

            runSimulationBtn.disabled = false;

            if (simulationLoading) {
                simulationLoading.classList.add("hidden");
            }

        }

    }


    // ============================================
    // DISPLAY SIMULATION
    // ============================================

    function displaySimulation(result) {

        const days =
            result.days || [];

        const thickness =
            result.thickness || [];


        if (
            days.length === 0 ||
            thickness.length === 0
        ) {

            throw new Error(
                "No simulation data was returned."
            );

        }


        // ========================================
        // UPDATE SUMMARY METRICS
        // ========================================

        if (simStart) {

            simStart.textContent =
                `${Number(result.start_thickness).toFixed(2)} mm`;

        }


        if (simEnd) {

            simEnd.textContent =
                `${Number(result.end_thickness).toFixed(2)} mm`;

        }


        if (simMaximum) {

            simMaximum.textContent =
                `${Number(result.maximum_thickness).toFixed(2)} mm`;

        }


        if (simAverage) {

            simAverage.textContent =
                `${Number(result.average_thickness).toFixed(2)} mm`;

        }


        if (simPeak) {

            simPeak.textContent =
                `Day ${result.peak_day}`;

        }


        // ========================================
        // CREATE GRAPH
        // ========================================

        createSimulationChart(
            days,
            thickness
        );


        // ========================================
        // CREATE SUMMARY
        // ========================================

        createSimulationSummary(result);


        // ========================================
        // CREATE INSIGHT
        // ========================================

        createSimulationInsight(result);


        // ========================================
        // UPDATE DYNAMIC TWIN
        // ========================================

        const currentCycleDay =
            window.currentPatientData.cycle_day;


        const currentIndex =
            days.indexOf(currentCycleDay);


        if (
            currentIndex !== -1 &&
            typeof window.updateEndometriumVisualization ===
            "function"
        ) {

            window.updateEndometriumVisualization(
                thickness[currentIndex]
            );

        }


        // Scroll to graph
        if (simulationChart) {

            setTimeout(() => {

                simulationChart.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }, 200);

        }

    }


    // ============================================
    // PLOTLY GRAPH
    // ============================================

    function createSimulationChart(
        days,
        thickness
    ) {

        if (!simulationChart) {
            return;
        }


        // Find peak
        const maxThickness =
            Math.max(...thickness);


        const peakIndex =
            thickness.indexOf(maxThickness);


        const peakDay =
            days[peakIndex];


        const trace = {

            x: days,

            y: thickness,

            mode: "lines+markers",

            type: "scatter",

            name: "Endometrial Thickness",

            line: {
                width: 3
            },

            marker: {
                size: 7
            },

            hovertemplate:
                "Cycle Day: %{x}" +
                "<br>" +
                "Thickness: %{y:.2f} mm" +
                "<extra></extra>"

        };


        // Peak marker
        const peakTrace = {

            x: [peakDay],

            y: [maxThickness],

            mode: "markers",

            type: "scatter",

            name: "Peak",

            marker: {
                size: 13,
                symbol: "star"
            },

            hovertemplate:
                "Peak Day: %{x}" +
                "<br>" +
                "Thickness: %{y:.2f} mm" +
                "<extra></extra>"

        };


        const layout = {

            title: {
                text:
                    "28-Day Digital Twin Simulation"
            },

            xaxis: {

                title: "Cycle Day",

                dtick: 1,

                gridcolor:
                    "rgba(120, 120, 120, 0.15)"

            },

            yaxis: {

                title:
                    "Predicted Endometrial Thickness (mm)",

                gridcolor:
                    "rgba(120, 120, 120, 0.15)"

            },

            hovermode: "x unified",

            margin: {

                l: 65,

                r: 25,

                t: 65,

                b: 55

            },

            paper_bgcolor: "rgba(0,0,0,0)",

            plot_bgcolor: "rgba(0,0,0,0)",

            font: {
                family: "Outfit, Arial, sans-serif"
            },

            legend: {
                orientation: "h",
                y: 1.08
            },

            responsive: true

        };


        const config = {

            responsive: true,

            displayModeBar: false

        };


        Plotly.newPlot(

            simulationChart,

            [
                trace,
                peakTrace
            ],

            layout,

            config

        );

    }


    // ============================================
    // SIMULATION SUMMARY
    // ============================================

    function createSimulationSummary(result) {

        if (!simulationSummary) {
            return;
        }


        const variation =
            Number(result.variation);


        simulationSummary.innerHTML = `

            <div class="simulation-summary-content">

                <h3>Simulation Summary</h3>

                <p>
                    The Digital Twin simulated the
                    predicted endometrial thickness
                    across cycle days 1–28 using the
                    current patient parameters.
                </p>

                <div class="summary-grid">

                    <div class="summary-item">

                        <span>Starting Thickness</span>

                        <strong>
                            ${Number(
                                result.start_thickness
                            ).toFixed(2)} mm
                        </strong>

                    </div>


                    <div class="summary-item">

                        <span>Ending Thickness</span>

                        <strong>
                            ${Number(
                                result.end_thickness
                            ).toFixed(2)} mm
                        </strong>

                    </div>


                    <div class="summary-item">

                        <span>Maximum Thickness</span>

                        <strong>
                            ${Number(
                                result.maximum_thickness
                            ).toFixed(2)} mm
                        </strong>

                    </div>


                    <div class="summary-item">

                        <span>Minimum Thickness</span>

                        <strong>
                            ${Number(
                                result.minimum_thickness
                            ).toFixed(2)} mm
                        </strong>

                    </div>


                    <div class="summary-item">

                        <span>Average Thickness</span>

                        <strong>
                            ${Number(
                                result.average_thickness
                            ).toFixed(2)} mm
                        </strong>

                    </div>


                    <div class="summary-item">

                        <span>Peak Day</span>

                        <strong>
                            Day ${result.peak_day}
                        </strong>

                    </div>


                    <div class="summary-item">

                        <span>Overall Variation</span>

                        <strong>
                            ${variation.toFixed(2)} mm
                        </strong>

                    </div>

                </div>

            </div>

        `;

    }


    // ============================================
    // SIMULATION INSIGHT
    // ============================================

    function createSimulationInsight(result) {

        if (!simulationInsight) {
            return;
        }


        const variation =
            Number(result.variation);


        let message;


        if (variation < 0.1) {

            message =
                "The simulation shows relatively stable " +
                "predicted endometrial thickness across " +
                "the 28-day cycle.";

        } else {

            message =
                "The simulation shows variation in the " +
                "predicted endometrial thickness across " +
                "the 28-day cycle.";

        }


        simulationInsight.innerHTML = `

            <div class="insight-content">

                <strong>
                    Digital Twin Insight
                </strong>

                <p>
                    ${message}
                </p>

                <small>
                    This is a model-based simulation
                    generated from the provided patient
                    parameters. It is intended for
                    research and demonstration purposes,
                    not clinical diagnosis.
                </small>

            </div>

        `;

    }


    // ============================================
    // RESIZE PLOT WHEN WINDOW CHANGES
    // ============================================

    window.addEventListener(
        "resize",
        () => {

            if (
                simulationChart &&
                typeof Plotly !== "undefined"
            ) {

                Plotly.Plots.resize(
                    simulationChart
                );

            }

        }
    );


    // ============================================
    // INITIAL STATE
    // ============================================

    window.currentSimulation = null;

    console.log(
        "FertiScan simulation.js loaded successfully."
    );

});