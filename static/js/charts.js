// Global configurations
const margin = { top: 80, right: 100, bottom: 150, left: 90 }; // Significantly increased bottom margin
const width = 1100 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Global tooltip setup - use this instead of creating multiple tooltips
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none");

// Utility function to create tooltips for any chart
function showTooltip(event, d, content, offsetX = 10, offsetY = -28) {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0.98);

    tooltip.html(content)
        .style("left", (event.pageX + offsetX) + "px")
        .style("top", (event.pageY + offsetY) + "px");
}

function hideTooltip() {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0);
}

// Example usage for a bar chart
function addBarTooltip(selection, getContent) {
    selection
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "url(#bar-gradient)")
                .style("filter", "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.2))")
                .attr("transform", "scale(1, 1.02)");

            showTooltip(event, d, getContent(d));
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "url(#bar-gradient)")
                .style("filter", "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))")
                .attr("transform", "scale(1, 1)");

            hideTooltip();
        });
}

// Function to add tooltips to line chart points
function addLinePointTooltip(selection, getContent) {
    selection
        .on("mouseover", function (event, d) {
            // Visual feedback on hover
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 8)
                .attr("fill", "#8B0000")
                .attr("opacity", 1)
                .style("filter", "drop-shadow(0 0 3px rgba(139, 0, 0, 0.6))");

            // Show tooltip
            showTooltip(event, d, getContent(d));
        })
        .on("mouseout", function () {
            // Reset visual state
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 6)
                .attr("fill", "#8B0000")
                .attr("opacity", 0.7)
                .style("filter", "none");

            // Hide tooltip
            hideTooltip();
        })
        .on("mousemove", function (event, d) {
            // Update tooltip position on mouse move
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        });
}

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
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + 50)  // Increased y position to avoid being cut off
        .attr("text-anchor", "middle")
        .text(xLabel)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Y-axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)  // Increased space on the left to prevent cutting off
        .attr("text-anchor", "middle")
        .text(yLabel)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
}

// Create publisher chart with animations
function createPublisherChart(data) {
    const svg = createResponsiveChart("#visualization-1");

    // Add gradient definitions for bars
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "bar-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#FF4444")
        .attr("stop-opacity", 0.8);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#8B0000")
        .attr("stop-opacity", 1);

    // Add chart title with animation
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Global Sales by Publisher")
        .style("font-size", "28px")
        .style("font-weight", "bold")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Process data for publishers
    const publisherData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            gameCount: v.length,
            topGame: v.reduce((a, b) => a.Global_Sales > b.Global_Sales ? a : b),
            naSales: d3.sum(v, d => d.NA_Sales),
            euSales: d3.sum(v, d => d.EU_Sales),
            jpSales: d3.sum(v, d => d.JP_Sales),
            bestGenre: Array.from(d3.rollup(v, w => d3.sum(w, x => x.Global_Sales), d => d.Genre))
                .sort((a, b) => b[1] - a[1])[0][0],
            yearlyData: Array.from(d3.rollup(v, w => d3.sum(w, x => x.Global_Sales), d => d.Year))
                .sort((a, b) => b[1] - a[1])
        }),
        d => d.Publisher
    );

    const totalSales = d3.sum(data, d => d.Global_Sales);

    const sortedData = Array.from(publisherData, ([key, value]) => ({
        publisher: key,
        sales: value.sales,
        gameCount: value.gameCount,
        topGame: value.topGame.Name,
        naSales: value.naSales,
        euSales: value.euSales,
        jpSales: value.jpSales,
        bestGenre: value.bestGenre,
        avgSales: value.sales / value.gameCount,
        peakYear: value.yearlyData[0][0]
    })).sort((a, b) => b.sales - a.sales).slice(0, 15);

    // Create scales
    const x = d3.scaleBand()
        .range([0, width])
        .domain(sortedData.map(d => d.publisher))
        .padding(0.3);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(sortedData, d => d.sales) * 1.1]);

    // Add animated axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
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

    // Add axes labels with animation
    const labels = [
        { text: "Publishers", x: width / 2, y: height + 120 }, // Much larger y position
        { text: "Global Sales (millions)", x: -height / 2, y: -60, rotate: -90 }
    ];

    labels.forEach(label => {
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", label.x)
            .attr("y", label.y)
            .attr("text-anchor", "middle")
            .attr("transform", label.rotate ? `rotate(${label.rotate})` : null)
            .text(label.text)
            .style("font-size", "14px")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);
    });

    // Enhanced bars with animations and interactions
    const bars = svg.selectAll(".bar")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.publisher))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("fill", "url(#bar-gradient)")
        .attr("rx", 6)
        .attr("ry", 6)
        .style("filter", "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))");

    // Bar animation
    bars.transition()
        .duration(1200)
        .delay((d, i) => i * 100)
        .ease(d3.easeElastic.amplitude(0.5))
        .attr("y", d => y(d.sales))
        .attr("height", d => height - y(d.sales));

    // Bar interactions
    bars.on("mouseover", function (event, d) {
        const bar = d3.select(this);

        // Enhance bar appearance
        bar.transition()
            .duration(200)
            .attr("fill", "url(#bar-gradient)")
            .style("filter", "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.2))")
            .attr("transform", "scale(1, 1.02)");

        // Show tooltip with animation
        showTooltip(event, d, `
            <div class="tooltip-header">
                <strong>${d.publisher}</strong>
                <span class="market-share">${(d.sales / totalSales * 100).toFixed(1)}% Market Share</span>
            </div>
            <div class="tooltip-content">
                <div class="tooltip-section">
                    <div class="stat-row">
                        <span class="stat-label">Global Sales:</span>
                        <span class="stat-value">${d.sales.toFixed(1)}M</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Games Released:</span>
                        <span class="stat-value">${d.gameCount}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Avg Sales/Game:</span>
                        <span class="stat-value">${d.avgSales.toFixed(2)}M</span>
                    </div>
                </div>
                <div class="tooltip-section">
                    <div class="stat-row">
                        <span class="stat-label">Best Genre:</span>
                        <span class="stat-value">${d.bestGenre}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Peak Year:</span>
                        <span class="stat-value">${d.peakYear}</span>
                    </div>
                </div>
                <div class="tooltip-section regional-sales">
                    <div class="region">
                        <span class="region-label">NA</span>
                        <div class="region-bar" style="width: ${(d.naSales / d.sales * 100)}%"></div>
                        <span class="region-value">${d.naSales.toFixed(1)}M</span>
                    </div>
                    <div class="region">
                        <span class="region-label">EU</span>
                        <div class="region-bar" style="width: ${(d.euSales / d.sales * 100)}%"></div>
                        <span class="region-value">${d.euSales.toFixed(1)}M</span>
                    </div>
                    <div class="region">
                        <span class="region-label">JP</span>
                        <div class="region-bar" style="width: ${(d.jpSales / d.sales * 100)}%"></div>
                        <span class="region-value">${d.jpSales.toFixed(1)}M</span>
                    </div>
                </div>
            </div>
        `);
    })
        .on("mouseout", function () {
            // Reset bar appearance
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "url(#bar-gradient)")
                .style("filter", "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))")
                .attr("transform", "scale(1, 1)");

            // Hide tooltip
            hideTooltip();
        });

    // Remove the publisher-specific tooltip that was created earlier
    d3.select(".publisher-tooltip").remove();

    // Add value labels on top of bars with animation
    svg.selectAll(".value-label")
        .data(sortedData)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.publisher) + x.bandwidth() / 2)
        .attr("y", d => y(d.sales) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.sales.toFixed(1))
        .style("font-size", "12px")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100 + 500)
        .style("opacity", 1);
}

// Create timeline chart with animations
function createTimelineChart(data) {
    console.log("Creating timeline chart with", data.length, "data points");

    // Filter out entries with null/undefined years
    const filteredData = data.filter(d => d.Year !== null && d.Year !== undefined);

    // Process data for timeline
    const timelineData = [];
    const yearGroups = d3.group(filteredData, d => d.Year);

    // Process data by year
    yearGroups.forEach((yearGames, year) => {
        const totalSales = d3.sum(yearGames, d => d.Global_Sales);
        const prevYear = year - 1;
        let growth = 0;

        if (yearGroups.has(prevYear)) {
            const prevYearGames = yearGroups.get(prevYear);
            const prevTotalSales = d3.sum(prevYearGames, d => d.Global_Sales);
            growth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
        }

        timelineData.push({
            year: +year,
            sales: totalSales,
            growth: growth,
            gameCount: yearGames.length
        });
    });

    // Sort by year
    timelineData.sort((a, b) => a.year - b.year);

    console.log("Processed timeline data:", timelineData);

    // Clear any existing chart
    const vizContainer = document.getElementById('visualization-3');
    if (!vizContainer) {
        console.error("Visualization container not found");
        return;
    }

    vizContainer.innerHTML = '<div id="timeline-chart" class="chart-container"></div>';

    // Use global margin settings
    const width = 1100 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG with proper dimensions
    const svg = d3.select("#timeline-chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales with padding
    const yearMin = d3.min(timelineData, d => d.year);
    const yearMax = d3.max(timelineData, d => d.year);
    const yearPadding = (yearMax - yearMin) * 0.05; // 5% padding

    const x = d3.scaleLinear()
        .domain([yearMin - yearPadding, yearMax + yearPadding])
        .range([0, width]);

    const salesMax = d3.max(timelineData, d => d.sales);
    const y = d3.scaleLinear()
        .domain([0, salesMax * 1.2]) // 20% padding at the top
        .range([height, 0]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add X axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .text("Number of Games")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Add Y axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .text("Global Sales (millions)")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Video Game Sales Timeline");

    // Add line
    svg.append("path")
        .datum(timelineData)
        .attr("fill", "none")
        .attr("stroke", "#8B0000")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x(d => x(d.year))
            .y(d => y(d.sales))
        );

    // Add dots with absolutely fixed positioning
    svg.selectAll(".timeline-dot")
        .data(timelineData)
        .enter()
        .append("circle")
        .attr("class", "timeline-dot")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.sales))
        .attr("r", 6)
        .attr("fill", "#8B0000")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        // Add invisible larger hit area for better hover detection
        .each(function (d, i) {
            const cx = x(d.year);
            const cy = y(d.sales);

            // Calculate percent increase from previous year
            const prevYearData = i > 0 ? timelineData[i - 1] : null;
            const percentIncrease = prevYearData ?
                ((d.sales - prevYearData.sales) / prevYearData.sales * 100).toFixed(1) : "N/A";

            // Calculate industry trends
            const industryTrend = getIndustryTrend(d.year);

            // Calculate market share distribution
            const platformDistribution = getPlatformDistribution(d.year);

            // Calculate top publishers for this year
            const topPublishers = getTopPublishers(d.year);

            // Add invisible hit area
            svg.append("circle")
                .attr("class", "hit-area")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", 15)
                .attr("fill", "transparent")
                .attr("pointer-events", "all")
                .on("mouseover", function (event) {
                    // Find the actual dot that corresponds to this hit area
                    const dot = d3.select(`.timeline-dot[cx="${cx}"][cy="${cy}"]`);

                    // Change only appearance properties
                    dot.attr("r", 9)
                        .attr("fill", "#FF4444")
                        .attr("opacity", 1)
                        .attr("stroke-width", 3)
                        .attr("stroke", "#FFFFFF");

                    // Determine growth arrow and color
                    const growthArrow = d.growth >= 0 ? '▲' : '▼';
                    const growthClass = d.growth >= 0 ? 'positive' : 'negative';

                    // Show tooltip with detailed information
                    showTooltip(event, d, `
                        <div class="timeline-tooltip">
                            <div class="tooltip-header">
                                <h3>${d.year}</h3>
                                <span class="sales-value">Video Game Industry</span>
                            </div>
                            <div class="tooltip-body">
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Total Market Size:</span>
                                    <span class="tooltip-value">${d.sales.toFixed(1)}M Units</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Year-over-Year Growth:</span>
                                    <span class="tooltip-value growth ${growthClass}">
                                        ${growthArrow} ${Math.abs(d.growth).toFixed(1)}%
                                    </span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Games Released:</span>
                                    <span class="tooltip-value">${d.gameCount}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Market Context:</span>
                                    <span class="tooltip-value">${getMarketContext(d.year)}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Industry Phase:</span>
                                    <span class="tooltip-value">${getIndustryTrend(d.year).phase}</span>
                                </div>
                            </div>
                            <div class="tooltip-footer">
                                <div class="tooltip-hint">Historical Significance: ${getHistoricalSignificance(d.year)}</div>
                            </div>
                        </div>
                    `);
                })
                .on("mouseout", function () {
                    // Find the actual dot that corresponds to this hit area
                    const dot = d3.select(`.timeline-dot[cx="${cx}"][cy="${cy}"]`);

                    // Reset to original appearance
                    dot.attr("r", 6)
                        .attr("fill", "#8B0000")
                        .attr("opacity", 0.7)
                        .attr("stroke-width", 2);

                    // Hide tooltip
                    hideTooltip();
                });
        });

    console.log("Timeline chart created successfully");
}

// Create genre chart with animations
function createGenreChart(data) {
    // Clear any existing chart
    d3.select("#visualization-2").html("");

    // Set up dimensions with explicit values - reduced width and height
    const margin = { top: 60, right: 40, bottom: 60, left: 80 };
    const width = 700 - margin.left - margin.right; // Reduced from 900
    const height = 450 - margin.top - margin.bottom; // Reduced from 500

    // Create SVG with proper dimensions and responsive viewBox
    const svg = d3.select("#visualization-2")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("width", "100%") // Make it responsive
        .attr("height", "100%") // Make it responsive
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

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

    // Create scales with proper domains
    const x = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.count) * 1.1])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.sales) * 1.1])
        .range([height, 0]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Video Game Genres Analysis")
        .style("font-size", "24px")
        .style("font-weight", "bold");

    // Add axes labels
    addAxesLabels(svg, "Number of Games", "Global Sales (millions)");

    // Add a direct x-axis label that will definitely show up
    svg.append("text")
        .attr("class", "x-axis-label-fixed")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("text-anchor", "middle")
        .text("Number of Games")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "#333");

    // Define bubble size scale
    const bubbleSize = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.sales)])
        .range([5, 25]);

    // Calculate peak year for each genre
    const genrePeakYears = calculatePeakYears(data);

    // Add interactive bubbles
    svg.selectAll(".bubble")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => x(d.count))  // Position bubbles horizontally based on game count
        .attr("cy", d => y(d.sales))  // Position bubbles vertically based on sales
        .attr("r", d => bubbleSize(d.sales))  // Size bubbles based on sales volume
        .attr("fill", "#8B0000")  // Dark red base color for all bubbles
        .attr("opacity", 0.7)  // Slight transparency for better overlapping visibility
        .on("mouseover", function (event, d) {
            // INTERACTION 1: Visual feedback when user hovers over a bubble
            d3.select(this)
                .transition()
                .duration(200)  // Smooth 200ms animation
                .attr("r", d => bubbleSize(d.sales) * 1.2)  // Increase size by 20%
                .attr("fill", "#FF4444")  // Change to brighter red on hover
                .attr("opacity", 0.9);  // Increase opacity for emphasis

            // INTERACTION 2: Informative tooltip showing genre details
            const tooltipContent = `
                <div class="tooltip-header">
                    <strong>${d.genre}</strong>  <!-- Genre name as header -->
                </div>
                <div class="tooltip-content">
                    <div class="tooltip-section">
                        <div class="stat-row">
                            <span class="stat-label">Total Sales:</span>
                            <span class="stat-value">${d.sales.toFixed(2)}M</span>  <!-- Sales in millions -->
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Number of Games:</span>
                            <span class="stat-value">${d.count}</span>  <!-- Total games in this genre -->
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Avg Sales/Game:</span>
                            <span class="stat-value">${(d.sales / d.count).toFixed(2)}M</span>  <!-- Average performance metric -->
                        </div>
                    </div>
                </div>
            `;

            // Show tooltip with animation
            tooltip.transition()
                .duration(200)  // Fade in over 200ms
                .style("opacity", 0.98);  // Nearly fully opaque

            // Position tooltip near cursor but not covering it
            tooltip.html(tooltipContent)
                .style("left", (event.pageX + 15) + "px")  // 15px right of cursor
                .style("top", (event.pageY - 10) + "px");  // 10px above cursor
        })
        .on("mouseout", function () {
            // INTERACTION 3: Reset visual state when user moves away
            d3.select(this)
                .transition()
                .duration(200)  // Smooth 200ms animation back to normal
                .attr("r", d => bubbleSize(d.sales))  // Return to original size
                .attr("fill", "#8B0000")  // Return to original color
                .attr("opacity", 0.7);  // Return to original opacity

            // Hide tooltip with fade-out animation
            tooltip.transition()
                .duration(200)  // Fade out over 200ms
                .style("opacity", 0);  // Fully transparent
        })
        .on("mousemove", function (event) {
            // INTERACTION 4: Tooltip follows cursor for better user experience
            tooltip
                .style("left", (event.pageX + 15) + "px")  // Keep 15px right of cursor
                .style("top", (event.pageY - 10) + "px");  // Keep 10px above cursor
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("r", d => bubbleSize(d.sales));  // Animate only the radius

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

// Helper function to provide market context based on year
function getMarketContext(year, data) {
    // Define key gaming events by year
    const marketEvents = {
        1983: "Video game crash of 1983",
        1985: "Nintendo NES released in North America",
        1989: "Game Boy released",
        1991: "Super Nintendo (SNES) released in North America",
        1994: "Sony PlayStation released in Japan",
        1995: "PlayStation released in North America",
        1996: "Nintendo 64 released",
        2000: "PlayStation 2 released",
        2001: "Xbox and GameCube released",
        2005: "Xbox 360 released",
        2006: "PlayStation 3 and Nintendo Wii released",
        2007: "Mobile gaming surge begins with iPhone",
        2011: "Rise of free-to-play and mobile gaming",
        2013: "PlayStation 4 and Xbox One released",
        2017: "Nintendo Switch released"
    };

    // Return the event if it exists for this year
    if (marketEvents[year]) {
        return marketEvents[year];
    }

    // Otherwise, analyze the trend
    const yearIndex = data.findIndex(d => d.year === year);
    if (yearIndex > 0 && yearIndex < data.length - 1) {
        const prevYear = data[yearIndex - 1];
        const nextYear = data[yearIndex + 1];
        const currentYear = data[yearIndex];

        if (currentYear.sales > prevYear.sales && currentYear.sales > nextYear.sales) {
            return "Peak year in local market trend";
        } else if (currentYear.sales < prevYear.sales && currentYear.sales < nextYear.sales) {
            return "Trough year in market cycle";
        } else if (currentYear.sales > prevYear.sales) {
            return "Growing market trend";
        } else {
            return "Declining market trend";
        }
    }

    return "No specific market context available";
}

// Helper functions for tooltips
function getMarketContext(year) {
    if (year >= 1985 && year <= 1990) return "NES era, early console market growth";
    if (year >= 1991 && year <= 1995) return "16-bit console wars (SNES vs Genesis)";
    if (year >= 1996 && year <= 2000) return "3D gaming revolution (PS1, N64)";
    if (year >= 2001 && year <= 2005) return "6th generation consoles (PS2, Xbox, GameCube)";
    if (year >= 2006 && year <= 2012) return "HD gaming era (PS3, Xbox 360, Wii)";
    if (year >= 2013 && year <= 2020) return "8th generation consoles and digital distribution";
    return "Limited market data available";
}

function getTopGameForGenre(genre, data) {
    return data
        .filter(d => d.Genre === genre)
        .sort((a, b) => b.Global_Sales - a.Global_Sales)[0] || { Name: 'N/A' };
}

function getBestPublisherForGenre(genre, data) {
    const publishers = d3.rollup(
        data.filter(d => d.Genre === genre),
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Publisher
    );

    const bestPub = Array.from(publishers.entries())
        .sort((a, b) => b[1] - a[1])[0];

    return bestPub ? { pub: bestPub[0], sales: bestPub[1] } : { pub: 'N/A', sales: 0 };
}

// Helper functions for advanced tooltip data
function getIndustryTrend(year) {
    // Map years to industry phases
    if (year < 1985) return { phase: "Early Industry Formation", trend: "Emerging" };
    if (year < 1990) return { phase: "Post-Crash Recovery", trend: "Rebuilding" };
    if (year < 1995) return { phase: "16-bit Console Era", trend: "Competitive" };
    if (year < 2000) return { phase: "3D Revolution", trend: "Innovative" };
    if (year < 2005) return { phase: "6th Generation Consoles", trend: "Expanding" };
    if (year < 2010) return { phase: "7th Generation Consoles", trend: "Mainstream" };
    if (year < 2015) return { phase: "Mobile Disruption", trend: "Diversifying" };
    return { phase: "Modern Gaming Era", trend: "Consolidated" };
}

function getPlatformDistribution(year) {
    // Simplified platform market share data
    if (year < 1985) return { topShare: 65, platforms: ["Atari", "Commodore"] };
    if (year < 1990) return { topShare: 85, platforms: ["NES", "Master System"] };
    if (year < 1995) return { topShare: 60, platforms: ["SNES", "Genesis"] };
    if (year < 2000) return { topShare: 70, platforms: ["PlayStation", "N64"] };
    if (year < 2005) return { topShare: 55, platforms: ["PS2", "Xbox", "GameCube"] };
    if (year < 2010) return { topShare: 45, platforms: ["Wii", "Xbox 360", "PS3"] };
    if (year < 2015) return { topShare: 35, platforms: ["PS3", "Xbox 360", "Mobile"] };
    return { topShare: 30, platforms: ["PS4", "Xbox One", "Switch", "Mobile"] };
}

function getTopPublishers(year) {
    // Simplified top publishers by era
    if (year < 1985) return ["Atari", "Activision"];
    if (year < 1990) return ["Nintendo", "Sega"];
    if (year < 1995) return ["Nintendo", "Sega", "Capcom"];
    if (year < 2000) return ["Nintendo", "Sony", "Electronic Arts"];
    if (year < 2005) return ["Electronic Arts", "Sony", "Nintendo"];
    if (year < 2010) return ["Electronic Arts", "Activision", "Ubisoft"];
    if (year < 2015) return ["Activision Blizzard", "Electronic Arts", "Ubisoft"];
    return ["Activision Blizzard", "Electronic Arts", "Take-Two Interactive"];
}

function getCriticalTitles(year) {
    // Simplified landmark titles by year
    const titles = {
        1985: ["Super Mario Bros.", "Duck Hunt"],
        1986: ["The Legend of Zelda", "Metroid"],
        1991: ["Sonic the Hedgehog", "Street Fighter II"],
        1996: ["Super Mario 64", "Resident Evil"],
        1997: ["Final Fantasy VII", "GoldenEye 007"],
        1998: ["The Legend of Zelda: Ocarina of Time", "Metal Gear Solid"],
        2001: ["Halo: Combat Evolved", "Grand Theft Auto III"],
        2004: ["Half-Life 2", "World of Warcraft"],
        2007: ["Call of Duty 4: Modern Warfare", "BioShock"],
        2011: ["The Elder Scrolls V: Skyrim", "Portal 2"],
        2013: ["Grand Theft Auto V", "The Last of Us"],
        2015: ["The Witcher 3: Wild Hunt", "Bloodborne"],
        2017: ["The Legend of Zelda: Breath of the Wild", "Horizon Zero Dawn"],
        2018: ["Red Dead Redemption 2", "God of War"],
        2020: ["Animal Crossing: New Horizons", "The Last of Us Part II"]
    };

    // Return titles for the exact year or closest previous year with data
    for (let y = year; y >= year - 2; y--) {
        if (titles[y]) return titles[y];
    }
    return ["No landmark titles recorded"];
}

function getHistoricalSignificance(year) {
    // Provide historical context for gaming industry
    const events = {
        1983: "Video game crash in North America",
        1985: "Nintendo revitalized the industry with the NES",
        1989: "Game Boy launched, revolutionizing handheld gaming",
        1991: "Sonic the Hedgehog established Sega as Nintendo's rival",
        1994: "PlayStation entered the market, shifting to CD-ROM format",
        1996: "3D gaming became mainstream with Nintendo 64 and PlayStation",
        2000: "PlayStation 2 launched, eventually becoming best-selling console",
        2001: "Xbox entered the market, intensifying console competition",
        2004: "World of Warcraft launched, defining MMO genre",
        2006: "Nintendo Wii introduced motion controls to mainstream",
        2007: "Mobile gaming began expansion with iPhone",
        2009: "Indie game development surged with digital distribution",
        2011: "Free-to-play and games-as-service models gained prominence",
        2013: "PS4 and Xbox One launched, emphasizing online connectivity",
        2016: "VR gaming entered consumer market",
        2017: "Nintendo Switch blurred lines between home and portable gaming",
        2020: "Next-gen consoles launched during global pandemic"
    };

    // Return event for the exact year or general trend
    if (events[year]) return events[year];

    if (year < 1985) return "Early industry formation period";
    if (year < 1990) return "Post-crash recovery and 8-bit console dominance";
    if (year < 1995) return "16-bit console wars era";
    if (year < 2000) return "Transition to 3D gaming and CD-ROM media";
    if (year < 2005) return "Sixth generation console competition";
    if (year < 2010) return "Casual gaming expansion and HD gaming";
    if (year < 2015) return "Digital distribution and mobile disruption";
    return "Modern gaming era with service-based models";
}

function calculateFiveYearTrend(year, data) {
    // Find data from 5 years ago
    const currentYearData = data.find(d => d.year === year);
    const fiveYearsAgo = data.find(d => d.year === year - 5);

    if (currentYearData && fiveYearsAgo) {
        const growthRate = ((currentYearData.sales - fiveYearsAgo.sales) / fiveYearsAgo.sales * 100).toFixed(1);
        return growthRate;
    }
    return "N/A";
}

function getMarketContext(year) {
    // Provide market context based on year
    if (year < 1985) return "Pre-crash recovery period";
    if (year < 1990) return "Nintendo-dominated market";
    if (year < 1995) return "Nintendo-Sega console war";
    if (year < 2000) return "PlayStation disruption";
    if (year < 2005) return "PS2 dominance era";
    if (year < 2010) return "Three-way console competition";
    if (year < 2015) return "Mobile expansion period";
    return "Digital-first marketplace";
}

// Calculate peak year for each genre
function calculatePeakYears(data) {
    const genrePeakYears = {};

    // Group data by genre and year
    const genreYearData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Genre,
        d => d.Year
    );

    // Find peak year for each genre
    for (const [genre, yearData] of genreYearData.entries()) {
        let maxSales = 0;
        let peakYear = null;

        for (const [year, sales] of yearData.entries()) {
            if (sales > maxSales) {
                maxSales = sales;
                peakYear = year;
            }
        }

        genrePeakYears[genre] = peakYear;
    }

    return genrePeakYears;
}

// Add the getPeakYearForGenre function
function getPeakYearForGenre(genre, data) {
    // Group data by year for the specific genre
    const yearData = d3.rollup(
        data.filter(d => d.Genre === genre && d.Year != null),
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Year
    );

    // Find the year with maximum sales
    let maxSales = 0;
    let peakYear = null;

    for (const [year, sales] of yearData.entries()) {
        if (sales > maxSales) {
            maxSales = sales;
            peakYear = year;
        }
    }

    return peakYear || 'N/A';
}
