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
        console.log("Attempting to load data from:", dataPath);

        d3.csv(dataPath)
            .then(data => {
                if (!data || data.length === 0) {
                    throw new Error("No data loaded");
                }

                console.log("Data loaded successfully:", data.length, "rows");

                // Process data
                data.forEach(d => {
                    d.Global_Sales = +d.Global_Sales || 0;
                    d.NA_Sales = +d.NA_Sales || 0;
                    d.EU_Sales = +d.EU_Sales || 0;
                    d.JP_Sales = +d.JP_Sales || 0;
                    d.Other_Sales = +d.Other_Sales || 0;
                    d.Year = (d.Year === "N/A" || d.Year === "") ? null : +d.Year;
                });

                const currentPath = window.location.pathname;
                console.log("Current path:", currentPath);

                if (currentPath.includes('publishers')) {
                    createPublisherChart(data);
                } else if (currentPath.includes('genres')) {
                    createGenreChart(data);
                } else if (currentPath.includes('timeline')) {
                    createTimelineChart(data);
                }
            })
            .catch(error => {
                console.error("Error loading the data:", error);
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
        const ghPagesBase = '/Final-Project-370';
        return window.location.pathname.includes(ghPagesBase)
            ? ghPagesBase
            : '';
    }

    function showError(error) {
        d3.selectAll('.visualization').html(`
            <div class="error-message">
                <h3>Error Loading Visualization</h3>
                <p>Failed to load data. Please ensure the data file exists and is accessible.</p>
                <p>Error details: ${error.message}</p>
            </div>
        `);
    }

    function createTimelineChart(data) {
        if (!svg) {
            console.error("SVG not initialized");
            return;
        }

        // Process timeline data
        const timelineData = d3.rollup(data,
            v => ({
                sales: d3.sum(v, d => d.Global_Sales),
                gameCount: v.length
            }),
            d => d.Year
        );

        // Convert to array and filter out null years
        const yearData = Array.from(timelineData, ([year, value]) => ({
            year: year,
            sales: value.sales,
            gameCount: value.gameCount
        }))
            .filter(d => d.year !== null)
            .sort((a, b) => a.year - b.year);

        // Create scales
        const x = d3.scaleLinear()
            .domain([d3.min(yearData, d => d.year), d3.max(yearData, d => d.year)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(yearData, d => d.sales) * 1.1])
            .range([height, 0]);

        // Create line generator
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.sales))
            .curve(d3.curveMonotoneX);

        // Add the line
        svg.append("path")
            .datum(yearData)
            .attr("class", "line")
            .attr("d", line);

        // Add dots
        svg.selectAll(".dot")
            .data(yearData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.sales))
            .attr("r", 5)
            .attr("data-year", d => d.year);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.format("d")));

        svg.append("g")
            .call(d3.axisLeft(y)
                .tickFormat(d => d + "M"));

        // Add labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Year");

        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .text("Global Sales (Millions)");

        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add hover interactions
        svg.selectAll(".dot")
            .on("mouseover", function (event, d) {
                // Highlight the dot
                d3.select(this)
                    .attr("r", 8)
                    .style("fill", var(--accent - color));

        // Show tooltip
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
}) ();
