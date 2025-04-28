/**
 * VIDEO GAME SALES VISUALIZATION PROJECT
 * 
 * Dataset Choice & Analysis:
 * - Using Video Game Sales dataset (vgsales.csv) containing:
 *   - Global and regional sales data
 *   - Publisher information
 *   - Genre categorization
 *   - Release years
 * - Data processed using Python (see analysis/data_processing.py):
 *   - Pandas for data cleaning and aggregation
 *   - NumPy for numerical computations
 *   - Seaborn for initial exploratory analysis
 */

// Use IIFE to avoid global namespace pollution
(function () {
    // Declare variables in local scope
    const margin = {
        top: 80,
        right: 120,
        bottom: 100,
        left: 100
    };

    let svg = null;
    let width = 0;
    let height = 0;

    function initializeVisualization() {
        const containerWidth = Math.min(1200, window.innerWidth - 40);
        const containerHeight = Math.min(700, window.innerHeight * 0.7);

        width = containerWidth - margin.left - margin.right;
        height = containerHeight - margin.top - margin.bottom;

        // Clear any existing SVG
        d3.select(".chart-container svg").remove();

        // Create new SVG
        svg = d3.select(".chart-container")
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Load data
        loadData();
    }

    function loadData() {
        const baseUrl = getBaseUrl();
        const dataPath = `${baseUrl}/data/vgsales.csv`;

        console.log("Loading data from:", dataPath);

        d3.csv(dataPath)
            .then(data => {
                if (!data || data.length === 0) {
                    throw new Error("No data loaded");
                }
                console.log("Data loaded successfully:", data.length, "rows");
                // ... rest of the code
            })
            .catch(error => {
                console.error("Error loading data:", error);
                showError(error);
            });
    }

    function createPublisherChart(data) {
        if (!svg) {
            console.error("SVG not initialized");
            return;
        }

        // Process publisher data
        const publisherData = d3.rollup(data,
            v => ({
                sales: d3.sum(v, d => d.Global_Sales),
                gameCount: v.length,
                topGame: v.reduce((a, b) => a.Global_Sales > b.Global_Sales ? a : b),
                naSales: d3.sum(v, d => d.NA_Sales),
                euSales: d3.sum(v, d => d.EU_Sales),
                jpSales: d3.sum(v, d => d.JP_Sales)
            }),
            d => d.Publisher
        );

        const sortedData = Array.from(publisherData, ([key, value]) => ({
            publisher: key,
            sales: value.sales,
            gameCount: value.gameCount,
            topGame: value.topGame.Name,
            naSales: value.naSales,
            euSales: value.euSales,
            jpSales: value.jpSales
        }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 15);

        // Create scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(sortedData.map(d => d.publisher))
            .padding(0.3);

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(sortedData, d => d.sales) * 1.1]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(y));

        // Add bars
        const bars = svg.selectAll(".bar")
            .data(sortedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.publisher))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.sales))
            .attr("height", d => height - y(d.sales))
            .attr("fill", "#8B0000");

        // Add tooltips
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        bars.on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>${d.publisher}</strong><br/>
                Global Sales: ${d.sales.toFixed(2)}M<br/>
                Games: ${d.gameCount}<br/>
                Top Game: ${d.topGame}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

    function getBaseUrl() {
        // For GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            return '/Final-Project-370';
        }
        // For local development
        return '';
    }

    function showError(error) {
        const errorHtml = `
            <div class="error-message" style="
                padding: 20px;
                margin: 20px;
                border: 1px solid #ff0000;
                border-radius: 5px;
                background-color: #fff5f5;">
                <h3 style="color: #ff0000;">Error Loading Visualization</h3>
                <p>Failed to load data. Please check:</p>
                <ul>
                    <li>Data file exists at correct location</li>
                    <li>File permissions are correct</li>
                    <li>File path is correct</li>
                </ul>
                <p>Error details: ${error.message}</p>
                <p>Current path: ${window.location.pathname}</p>
                <p>Attempted data path: ${getBaseUrl()}/data/vgsales.csv</p>
            </div>
        `;

        // Display error in all visualization containers
        document.querySelectorAll('.visualization').forEach(container => {
            container.innerHTML = errorHtml;
        });
    }

    function createTimelineChart(data) {
        // Check if SVG container exists to prevent errors
        if (!svg) {
            console.error("SVG not initialized");
            return;
        }

        // STEP 1: DATA PROCESSING
        // Group data by year and calculate total sales and game count
        const timelineData = d3.rollup(data,
            v => ({
                sales: d3.sum(v, d => d.Global_Sales), // Sum all sales for each year
                gameCount: v.length                     // Count number of games per year
            }),
            d => d.Year
        );

        // Convert Map to Array format and clean the data
        const yearData = Array.from(timelineData, ([year, value]) => ({
            year: year,
            sales: value.sales,
            gameCount: value.gameCount
        }))
            .filter(d => d.year !== null)  // Remove entries with null years
            .sort((a, b) => a.year - b.year);  // Sort by year ascending

        // STEP 2: SCALES SETUP
        // Create X scale (Years)
        const x = d3.scaleLinear()
            .domain([d3.min(yearData, d => d.year), d3.max(yearData, d => d.year)])
            .range([0, width]);

        // Create Y scale (Sales)
        const y = d3.scaleLinear()
            .domain([0, d3.max(yearData, d => d.sales) * 1.1])  // Add 10% padding at top
            .range([height, 0]);

        // STEP 3: CREATE LINE CHART
        // Define line generator with smooth curve
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.sales))
            .curve(d3.curveMonotoneX);  // Creates smooth curve between points

        // Add the line path to the chart
        svg.append("path")
            .datum(yearData)
            .attr("class", "line")
            .attr("d", line);

        // STEP 4: ADD DATA POINTS
        // Create interactive dots for each data point
        svg.selectAll(".dot")
            .data(yearData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.sales))
            .attr("r", 5)
            .attr("data-year", d => d.year);

        // STEP 5: ADD AXES
        // Add X-axis with year format
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.format("d"))); // Format as integer year

        // Add Y-axis with millions format
        svg.append("g")
            .call(d3.axisLeft(y)
                .tickFormat(d => d + "M"));

        // STEP 6: ADD AXIS LABELS
        // X-axis label (Year)
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Year");

        // Y-axis label (Sales)
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .text("Global Sales (Millions)");

        // STEP 7: INTERACTIVE ELEMENTS
        // Create tooltip container
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add hover interactions to dots
        svg.selectAll(".dot")
            .on("mouseover", function (event, d) {
                // Enhance dot appearance on hover
                d3.select(this)
                    .attr("r", 8)
                    .style("fill", "#ff4444"); // Changed from var(--accent-color) to direct color

                // Show and position tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>${d.year}</strong><br/>
                    Global Sales: ${d.sales.toFixed(2)}M<br/>
                    Games Released: ${d.gameCount}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                // Reset dot appearance
                d3.select(this)
                    .attr("r", 5)
                    .style("fill", "#8B0000");

                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initializeVisualization);

    // Add window resize handler
    window.addEventListener('resize', initializeVisualization);
})();
