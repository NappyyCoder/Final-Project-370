// Global configurations
const margin = { top: 80, right: 100, bottom: 80, left: 90 };
const width = 1100 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Global tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Utility function to create responsive chart base
function createResponsiveChart(selector) {
    const svg = d3.select(selector)
        .select(".chart-container")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    return svg;
}

// Utility function to add axes labels
function addAxesLabels(svg, xLabel, yLabel) {
    // X-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text(xLabel)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Y-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .text(yLabel)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
}

// Create publisher chart with animations
function createPublisherChart(data) {
    const svg = createResponsiveChart("#visualization-1");

    // Add chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Global Sales by Publisher")
        .style("font-size", "24px")
        .style("font-weight", "bold");

    // Process data for publishers
    const publisherData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Publisher
    );

    const sortedData = Array.from(publisherData, ([key, value]) => ({
        publisher: key,
        sales: value
    })).sort((a, b) => b.sales - a.sales).slice(0, 15);

    // Create scales
    const x = d3.scaleBand()
        .range([0, width])
        .domain(sortedData.map(d => d.publisher))
        .padding(0.2);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(sortedData, d => d.sales)]);

    // Add axes with animations
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    svg.append("g")
        .call(d3.axisLeft(y))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Add axes labels
    addAxesLabels(svg, "Publishers", "Global Sales (millions)");

    // Enhanced bars with new animations and interactions
    svg.selectAll("rect")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.publisher))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "#8B0000")
        .attr("rx", 5)
        .attr("ry", 5)
        .on("mouseover", function (event, d) {
            // Enhanced bar animation
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "#FF4444")
                .attr("transform", "scale(1, 1.05)");

            // Enhanced tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>${d.publisher}</strong><br>
                <hr>
                <div class="tooltip-grid">
                    <div class="tooltip-stat">
                        <span class="stat-label">Global Sales:</span>
                        <span class="stat-value">${d.sales.toFixed(2)}M</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Market Share:</span>
                        <span class="stat-value">${(d.sales / totalSales * 100).toFixed(1)}%</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Total Games:</span>
                        <span class="stat-value">${d.gameCount}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Avg Sales/Game:</span>
                        <span class="stat-value">${(d.sales / d.gameCount).toFixed(2)}M</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Top Game:</span>
                        <span class="stat-value">${d.topGame}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Peak Year:</span>
                        <span class="stat-value">${d.peakYear || 'N/A'}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Best Genre:</span>
                        <span class="stat-value">${d.bestGenre || 'N/A'}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Regional Performance:</span>
                        <span class="stat-value">
                            NA: ${d.naSales?.toFixed(2)}M<br>
                            EU: ${d.euSales?.toFixed(2)}M<br>
                            JP: ${d.jpSales?.toFixed(2)}M
                        </span>
                    </div>
                </div>
                <div class="tooltip-footer">
                    <span class="tooltip-hint">Click for detailed breakdown</span>
                </div>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "#8B0000")
                .attr("transform", "scale(1, 1)");

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            // Add click interaction
            alert(`Publisher Details:\n${d.publisher}\nGlobal Sales: ${d.sales.toFixed(2)}M`);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("y", d => y(d.sales))
        .attr("height", d => height - y(d.sales));

    // Add value labels on top of bars
    svg.selectAll(".value-label")
        .data(sortedData)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.publisher) + x.bandwidth() / 2)
        .attr("y", d => y(d.sales) - 5)
        .attr("text-anchor", "middle")
        .style("opacity", 0)
        .text(d => d.sales.toFixed(1))
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100 + 500)
        .style("opacity", 1);
}

// Create timeline chart with animations
function createTimelineChart(data) {
    const svg = createResponsiveChart("#visualization-3");

    // Add gradient for area
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#8B0000")
        .attr("stop-opacity", 0.6);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#8B0000")
        .attr("stop-opacity", 0.1);

    // Process data by year with additional metrics
    const yearlyData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            gameCount: v.length,
            topGame: v.sort((a, b) => b.Global_Sales - a.Global_Sales)[0],
            avgSales: d3.mean(v, d => d.Global_Sales),
            genres: d3.rollup(v, games => games.length, d => d.Genre)
        }),
        d => d.Year
    );

    const timelineData = Array.from(yearlyData, ([year, stats]) => ({
        year: year,
        sales: stats.sales,
        gameCount: stats.gameCount,
        topGame: stats.topGame,
        avgSales: stats.avgSales,
        topGenre: Array.from(stats.genres.entries())
            .sort((a, b) => b[1] - a[1])[0][0]
    }))
        .filter(d => d.year !== null && !isNaN(d.year))
        .sort((a, b) => a.year - b.year);

    // Calculate year-over-year growth
    timelineData.forEach((d, i) => {
        if (i > 0) {
            d.growth = ((d.sales - timelineData[i - 1].sales) / timelineData[i - 1].sales * 100).toFixed(1);
        }
    });

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(timelineData, d => d.year))
        .range([0, width])
        .nice();

    const y = d3.scaleLinear()
        .domain([0, d3.max(timelineData, d => d.sales)])
        .range([height, 0])
        .nice();

    // Add gridlines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        );

    // Add area with animation
    const area = d3.area()
        .x(d => x(d.year))
        .y0(height)
        .y1(d => y(d.sales));

    svg.append("path")
        .datum(timelineData)
        .attr("class", "area")
        .attr("fill", "url(#area-gradient)")
        .attr("d", area)
        .style("opacity", 0)
        .transition()
        .duration(1500)
        .style("opacity", 1);

    // Add line with animation
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.sales));

    const path = svg.append("path")
        .datum(timelineData)
        .attr("class", "line")
        .attr("d", line)
        .style("opacity", 0)
        .attr("stroke-dasharray", function () {
            const length = this.getTotalLength();
            return `${length} ${length}`;
        })
        .attr("stroke-dashoffset", function () {
            return this.getTotalLength();
        })
        .transition()
        .duration(2000)
        .style("opacity", 1)
        .attr("stroke-dashoffset", 0);

    // Add interactive dots with animations
    const dots = svg.selectAll(".dot")
        .data(timelineData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.sales))
        .attr("r", 0)
        .attr("fill", "#8B0000")
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100 + 1000)
        .attr("r", 6);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");

    // Enhanced dot interaction
    svg.selectAll(".dot")
        .on("mouseover", function (event, d) {
            const dot = d3.select(this);

            // Enhance dot appearance
            dot.transition()
                .duration(200)
                .attr("r", 8)
                .style("fill", "#FF4444");

            // Calculate tooltip position relative to the dot
            const dotX = parseFloat(dot.attr("cx"));
            const dotY = parseFloat(dot.attr("cy"));
            const tooltipX = x(d.year) + margin.left + 20; // 20px offset from dot
            const tooltipY = y(d.sales) + margin.top - 28; // Position above the dot

            // Show and position tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);

            tooltip.html(`
                <div class="tooltip-header">
                    <strong>${d.year}</strong>
                    <span class="growth ${d.growth > 0 ? 'positive' : 'negative'}">
                        ${d.growth ? (d.growth > 0 ? '↑' : '↓') + Math.abs(d.growth) + '%' : ''}
                    </span>
                </div>
                <hr>
                <div class="tooltip-grid">
                    <div class="tooltip-stat">
                        <span class="stat-label">Total Sales:</span>
                        <span class="stat-value">${d.sales.toFixed(2)}M</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Games Released:</span>
                        <span class="stat-value">${d.gameCount}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Avg Sales/Game:</span>
                        <span class="stat-value">${d.avgSales.toFixed(2)}M</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Top Game:</span>
                        <span class="stat-value">${d.topGame.Name}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Popular Genre:</span>
                        <span class="stat-value">${d.topGenre}</span>
                    </div>
                </div>
            `)
                .style("left", `${tooltipX}px`)
                .style("top", `${tooltipY}px`);

            // Add vertical guide line with animation
            svg.append("line")
                .attr("class", "guide-line")
                .attr("x1", x(d.year))
                .attr("x2", x(d.year))
                .attr("y1", height)
                .attr("y2", height)
                .transition()
                .duration(200)
                .attr("y2", y(d.sales));
        })
        .on("mouseout", function () {
            // Reset dot appearance
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 6)
                .style("fill", "#8B0000");

            // Hide tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);

            // Remove guide line with animation
            svg.selectAll(".guide-line")
                .transition()
                .duration(200)
                .attr("y2", height)
                .remove();
        });

    // Add animated axes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .style("opacity", 0)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .transition()
        .duration(1000)
        .style("opacity", 1);

    svg.append("g")
        .attr("class", "y-axis")
        .style("opacity", 0)
        .call(d3.axisLeft(y))
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Add chart title with animation
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("opacity", 0)
        .text("Video Game Sales Timeline (1980-2020)")
        .transition()
        .duration(1000)
        .style("opacity", 1);
}

// Create genre chart with animations
function createGenreChart(data) {
    const svg = createResponsiveChart("#visualization-2");

    // Add chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Video Game Genres Analysis")
        .style("font-size", "24px")
        .style("font-weight", "bold");

    // Process data for genres
    const genreData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            count: v.length
        }),
        d => d.Genre
    );

    const scatterData = Array.from(genreData, ([genre, values]) => ({
        genre: genre,
        sales: values.sales,
        count: values.count
    }));

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.count)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.sales)])
        .range([height, 0]);

    // Add axes with animations
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    svg.append("g")
        .call(d3.axisLeft(y))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Add axes labels
    addAxesLabels(svg, "Number of Games", "Global Sales (millions)");

    // Add scatter points with animations
    svg.selectAll("circle")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.count))
        .attr("cy", height) // Start from bottom
        .attr("r", 0) // Start with radius 0
        .attr("fill", "#8B0000")
        .attr("opacity", 0.7)
        .on("mouseover", function (event, d) {
            // Enhanced point animation
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 12)
                .attr("fill", "#FF4444")
                .attr("opacity", 1);

            // Calculate genre-specific statistics
            const genreGames = data.filter(game => game.Genre === d.genre);
            const topGame = genreGames.reduce((prev, current) =>
                (prev.Global_Sales > current.Global_Sales) ? prev : current);
            const topPublisher = d3.rollup(genreGames,
                v => d3.sum(v, d => d.Global_Sales),
                d => d.Publisher);
            const bestPublisher = Array.from(topPublisher, ([pub, sales]) => ({ pub, sales }))
                .sort((a, b) => b.sales - a.sales)[0];

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>${d.genre}</strong><br>
                <hr>
                <div class="tooltip-grid">
                    <div class="tooltip-stat">
                        <span class="stat-label">Total Sales:</span>
                        <span class="stat-value">${d.sales.toFixed(2)}M</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Market Share:</span>
                        <span class="stat-value">${(d.sales / totalSales * 100).toFixed(1)}%</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Number of Games:</span>
                        <span class="stat-value">${d.count}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Avg Sales/Game:</span>
                        <span class="stat-value">${(d.sales / d.count).toFixed(2)}M</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Top Game:</span>
                        <span class="stat-value">${topGame.Name}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Best Publisher:</span>
                        <span class="stat-value">${bestPublisher.pub}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Peak Year:</span>
                        <span class="stat-value">${d.peakYear || 'N/A'}</span>
                    </div>
                    <div class="tooltip-stat">
                        <span class="stat-label">Regional Success:</span>
                        <span class="stat-value">
                            NA: ${d.naSales?.toFixed(2)}M<br>
                            EU: ${d.euSales?.toFixed(2)}M<br>
                            JP: ${d.jpSales?.toFixed(2)}M
                        </span>
                    </div>
                </div>
                <div class="tooltip-footer">
                    <span class="tooltip-hint">Click for genre analysis</span>
                </div>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 8)
                .attr("fill", "#8B0000")
                .attr("opacity", 0.7);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("cy", d => y(d.sales))
        .attr("r", 8);

    // Add genre labels
    svg.selectAll(".genre-label")
        .data(scatterData)
        .enter()
        .append("text")
        .attr("class", "genre-label")
        .attr("x", d => x(d.count))
        .attr("y", d => y(d.sales) - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("opacity", 0)
        .text(d => d.genre)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100 + 500)
        .style("opacity", 1);

    // Add trend line
    const line = d3.line()
        .x(d => x(d.count))
        .y(d => y(d.sales));

    const sortedData = scatterData.sort((a, b) => a.count - b.count);

    svg.append("path")
        .datum(sortedData)
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("stroke", "#FF4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", line)
        .style("opacity", 0)
        .transition()
        .duration(1500)
        .style("opacity", 0.5);
}

// Load data and create charts
function getBaseUrl() {
    const ghPagesBase = '/Final-Project-370';
    return window.location.pathname.includes(ghPagesBase)
        ? ghPagesBase
        : '';
}

// Construct the full data path
const dataPath = `${getBaseUrl()}/data/vgsales.csv`;

console.log("Attempting to load data from:", dataPath);

// Load data and create appropriate chart
d3.csv(dataPath)
    .then(data => {
        if (!data || data.length === 0) {
            throw new Error("No data loaded");
        }

        console.log("Data loaded successfully:", data.length, "rows");

        // Convert sales columns to numbers
        data.forEach(d => {
            d.Global_Sales = +d.Global_Sales || 0;
            d.NA_Sales = +d.NA_Sales || 0;
            d.EU_Sales = +d.EU_Sales || 0;
            d.JP_Sales = +d.JP_Sales || 0;
            d.Other_Sales = +d.Other_Sales || 0;
            d.Year = (d.Year === "N/A" || d.Year === "") ? null : +d.Year;
        });

        const path = window.location.pathname;
        console.log("Current URL:", window.location.href);
        console.log("Current path:", path);

        if (path.includes('publishers')) {
            createPublisherChart(data);
        } else if (path.includes('genres')) {
            createGenreChart(data);
        } else if (path.includes('timeline')) {
            createTimelineChart(data);
        }
    })
    .catch(error => {
        console.error("Error loading the data:", error);
        ['visualization-1', 'visualization-2', 'visualization-3'].forEach(vizId => {
            const vizElement = document.getElementById(vizId);
            if (vizElement) {
                vizElement.innerHTML = `
                    <div class="error-message">
                        <h3>Error Loading Visualization</h3>
                        <p>Failed to load data. Please ensure the data file exists and is accessible.</p>
                        <p>Attempted path: ${dataPath}</p>
                    </div>
                `;
            }
        });
    });

// Add CSS for visualization containers
const style = document.createElement('style');
style.textContent = `
    .visualization {
        width: 100%;
        height: 600px;
        margin: 20px 0;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
    }
    .chart-container {
        width: 100%;
        height: 100%;
    }
    .tooltip {
        position: absolute;
        padding: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        pointer-events: none;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);
