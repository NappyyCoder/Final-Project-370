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

// Global configurations for chart responsiveness and accessibility
const margin = {
    top: 80,     // Increased from 60
    right: 120,  // Increased from 100
    bottom: 100, // Increased from 80
    left: 100    // Increased from 90
};

/**
 * VISUALIZATION 1: Publisher Analysis Bar Chart
 * - Shows top publishers by global sales
 * - Interactive features:
 *   - Tooltips with detailed sales data
 *   - Hover effects on bars
 *   - Animated bar loading
 * - Accessibility: Clear labels and contrast
 */
function createPublisherChart(data) {
    const { svg, width, height } = createResponsiveChart("#visualization-1");

    if (!svg || !width || !height) {
        console.error("Failed to create chart container");
        return;
    }

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
        .attr("stop-opacity", 0.8);

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

    // Add axes labels with animation
    const labels = [
        { text: "Publishers", x: width / 2, y: height + 60 },
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

    // Enhanced tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "publisher-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");

    // Bar interactions
    bars.on("mouseover", function (event, d) {
        const bar = d3.select(this);

        // Enhance bar appearance
        bar.transition()
            .duration(200)
            .attr("fill", "url(#bar-gradient)")
            .style("filter", "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.2))")
            .attr("transform", "scale(1, 1.02)");

        // Calculate tooltip position relative to the bar
        const barX = parseFloat(bar.attr("x"));
        const barY = parseFloat(bar.attr("y"));
        const tooltipX = x(d.publisher) + margin.left + x.bandwidth() / 2;
        const tooltipY = y(d.sales) + margin.top - 10;

        // Show tooltip with animation
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.98);

        tooltip.html(`
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
        `)
            .style("left", `${tooltipX}px`)
            .style("top", `${tooltipY}px`)
            .style("transform", "translate(-50%, -100%)");
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
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        });

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

/**
 * VISUALIZATION 2: Genre Scatter Plot
 * - Displays relationship between number of games and sales
 * - Interactive features:
 *   - Tooltips with genre details
 *   - Point enlargement on hover
 *   - Color transitions
 * - Accessibility: Color-blind friendly palette
 */
function createGenreChart(data) {
    const { svg, width, height } = createResponsiveChart("#visualization-2");

    // Process data for genres
    const genreData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            count: v.length,
            naSales: d3.sum(v, d => d.NA_Sales),
            euSales: d3.sum(v, d => d.EU_Sales),
            jpSales: d3.sum(v, d => d.JP_Sales),
            topGame: v.reduce((prev, current) =>
                (prev.Global_Sales > current.Global_Sales) ? prev : current),
            avgSales: d3.sum(v, d => d.Global_Sales) / v.length,
            yearlyData: Array.from(d3.rollup(v,
                w => d3.sum(w, x => x.Global_Sales),
                w => w.Year
            )).sort((a, b) => b[1] - a[1])
        }),
        d => d.Genre
    );

    const totalSales = d3.sum(data, d => d.Global_Sales);
    const scatterData = Array.from(genreData, ([genre, values]) => ({
        genre: genre,
        sales: values.sales,
        count: values.count,
        naSales: values.naSales,
        euSales: values.euSales,
        jpSales: values.jpSales,
        topGame: values.topGame,
        avgSales: values.avgSales,
        peakYear: values.yearlyData[0]?.[0]
    }));

    // Create scales with padding
    const x = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.count) * 1.1])
        .range([0, width])
        .nice();

    const y = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.sales) * 1.1])
        .range([height, 0])
        .nice();

    // Add gridlines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        );

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickSize(-height)
            .tickFormat("")
        );

    // Add axes with labels
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", 40)
        .style("text-anchor", "middle")
        .text("Number of Games Released");

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .style("text-anchor", "middle")
        .text("Global Sales (Millions)");

    // Enhanced tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "genre-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");

    // Add scatter points with enhanced interactivity
    const points = svg.selectAll(".point")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("class", "genre-point")
        .attr("cx", d => x(d.count))
        .attr("cy", d => y(d.sales))
        .attr("r", 8)
        .attr("fill", "#8B0000")
        .attr("opacity", 0.7)
        .on("mouseover", function (event, d) {
            const point = d3.select(this);

            // Enhance point appearance
            point.transition()
                .duration(200)
                .attr("r", 12)
                .attr("fill", "#FF4444")
                .attr("opacity", 1);

            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.95);

            tooltip.html(`
                <div class="tooltip-header">
                    <strong>${d.genre}</strong>
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
                            <span class="stat-value">${d.count}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Avg Sales/Game:</span>
                            <span class="stat-value">${d.avgSales.toFixed(2)}M</span>
                        </div>
                    </div>
                    <div class="tooltip-section">
                        <div class="stat-row">
                            <span class="stat-label">Regional Sales:</span>
                            <span class="stat-value">
                                NA: ${d.naSales.toFixed(1)}M<br>
                                EU: ${d.euSales.toFixed(1)}M<br>
                                JP: ${d.jpSales.toFixed(1)}M
                            </span>
                        </div>
                    </div>
                    <div class="tooltip-section">
                        <div class="stat-row">
                            <span class="stat-label">Top Game:</span>
                            <span class="stat-value">${d.topGame.Name}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Peak Year:</span>
                            <span class="stat-value">${d.peakYear || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            `)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 28}px`);
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
        });

    // Add genre labels with better positioning and collision detection
    const labels = svg.selectAll(".genre-label")
        .data(scatterData)
        .enter()
        .append("text")
        .attr("class", "genre-label")
        .attr("x", d => x(d.count))
        .attr("y", d => y(d.sales) - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text(d => d.genre);

    // Implement basic label collision detection
    const padding = 20;
    labels.each(function () {
        const thisLabel = d3.select(this);
        const thisY = parseFloat(thisLabel.attr("y"));

        labels.each(function () {
            const otherLabel = d3.select(this);
            const otherY = parseFloat(otherLabel.attr("y"));

            if (thisLabel.node() !== otherLabel.node() &&
                Math.abs(thisY - otherY) < padding) {
                thisLabel.attr("y", thisY + padding);
            }
        });
    });

    // Add chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Video Game Genres: Sales vs. Number of Games");
}

/**
 * VISUALIZATION 3: Sales Timeline
 * - Shows sales trends over time
 * - Interactive features:
 *   - Animated line drawing
 *   - Year-specific tooltips
 *   - Gradient area fill
 * - Accessibility: Clear time series progression
 */
function createTimelineChart(data) {
    // Filter out years after 2016 (as data becomes incomplete)
    const filteredData = data.filter(d => d.Year !== null && d.Year <= 2016);

    // Process data by year with additional metrics
    const yearlyData = d3.rollup(filteredData,
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
        .filter(d => d.year !== null)
        .sort((a, b) => a.year - b.year);

    // Calculate year-over-year growth
    timelineData.forEach((d, i) => {
        if (i > 0) {
            d.growth = ((d.sales - timelineData[i - 1].sales) / timelineData[i - 1].sales * 100).toFixed(1);
        }
    });

    // Update chart title to reflect actual data range
    const yearRange = `${d3.min(timelineData, d => d.year)}-${d3.max(timelineData, d => d.year)}`;

    const { svg, width, height } = createResponsiveChart("#visualization-3");

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
        .attr("r", 6)
        .attr("fill", "#8B0000")
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .style("filter", "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2))");

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");

    // Enhanced dot interaction
    dots.on("mouseover", function (event, d) {
        const dot = d3.select(this);

        // Enhance dot appearance
        dot.transition()
            .duration(200)
            .attr("r", 8)
            .attr("fill", "#FF4444")
            .attr("opacity", 1)
            .style("filter", "drop-shadow(0 4px 4px rgba(0, 0, 0, 0.3))");

        // Calculate tooltip position
        const tooltipX = x(d.year) + margin.left + 20;
        const tooltipY = y(d.sales) + margin.top - 28;

        // Show tooltip
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
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY - 28}px`);

        // Add vertical guide line
        svg.append("line")
            .attr("class", "guide-line")
            .attr("x1", x(d.year))
            .attr("x2", x(d.year))
            .attr("y1", height)
            .attr("y2", y(d.sales))
            .style("stroke", "rgba(139, 0, 0, 0.5)")
            .style("stroke-width", "1px")
            .style("stroke-dasharray", "5,5");
    })
        .on("mouseout", function () {
            // Reset dot appearance
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 6)
                .attr("fill", "#8B0000")
                .attr("opacity", 0.7)
                .style("filter", "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2))");

            // Hide tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);

            // Remove guide line
            svg.selectAll(".guide-line").remove();
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

    // Update chart title with actual date range
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text(`Video Game Sales Timeline (${yearRange})`);
}

/**
 * Responsive Design Implementation
 * - Fluid SVG sizing
 * - Flexible margins and padding
 * - Mobile-friendly interactions
 * - Screen size adaptations
 */
function createResponsiveChart(selector) {
    // Remove any existing SVG first
    d3.select(selector).select(".chart-container svg").remove();

    const containerWidth = Math.min(1200, window.innerWidth - 40);
    const containerHeight = Math.min(700, window.innerHeight * 0.7);

    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .select(".chart-container")
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return { svg, width, height };
}

/**
 * Animation Implementations:
 * 1. Data Loading Transitions
 *    - Smooth fade-ins
 *    - Progressive reveals
 *    - Elastic easing
 */
function animateChartElements() {
    // Bar animation with elastic easing
    bars.transition()
        .duration(1200)
        .delay((d, i) => i * 100)
        .ease(d3.easeElastic.amplitude(0.5))
        .attr("y", d => y(d.sales))
        .attr("height", d => height - y(d.sales));
}

/**
 * Interactive Features:
 * 1. Enhanced Tooltips
 *    - Rich HTML content
 *    - Smooth transitions
 *    - Positioned intelligently
 */
function createEnhancedTooltip() {
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    // ... existing tooltip code ...
}

/**
 * Narrative Structure:
 * - Homepage introduces dataset context
 * - Each visualization tells specific story:
 *   1. Publisher dominance in industry
 *   2. Genre popularity and success
 *   3. Historical industry trends
 */

/**
 * UX Design Considerations:
 * - Consistent color scheme
 * - Clear visual hierarchy
 * - Intuitive interactions
 * - Readable typography
 * - Proper spacing and alignment
 */

// Data loading and initialization
function getBaseUrl() {
    const ghPagesBase = '/Final-Project-370';
    return window.location.pathname.includes(ghPagesBase)
        ? ghPagesBase
        : '';
}

/**
 * Error Handling:
 * - Graceful fallbacks
 * - User-friendly error messages
 * - Console logging for debugging
 */
const dataPath = `${getBaseUrl()}/data/vgsales.csv`;

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
        document.querySelectorAll('.visualization').forEach(vizElement => {
            vizElement.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Visualization</h3>
                    <p>Failed to load data. Please ensure the data file exists and is accessible.</p>
                    <p>Error details: ${error.message}</p>
                </div>
            `;
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
