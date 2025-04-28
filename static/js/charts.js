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

// Create a global namespace for our visualization
window.VideoGameViz = {};

(function () {
    const CHART_COLORS = {
        primary: '#8B0000',
        hover: '#FF3333',
        accent: '#B22222',
        background: '#fff5f5'
    };

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    let width, height, svg;

    async function loadData() {
        try {
            console.log('Attempting to load data from: /Final-Project-370/data/vgsales.csv');
            const response = await d3.csv('/Final-Project-370/data/vgsales.csv');
            console.log(`Successfully loaded ${response.length} records`);
            return response;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    function createPublisherChart(data) {
        // Process data for publishers
        const publisherData = d3.rollup(data,
            v => ({
                sales: d3.sum(v, d => +d.Global_Sales),
                gameCount: v.length,
                topGame: v.sort((a, b) => +b.Global_Sales - +a.Global_Sales)[0].Name
            }),
            d => d.Publisher
        );

        const processedData = Array.from(publisherData, ([publisher, values]) => ({
            publisher,
            sales: values.sales,
            gameCount: values.gameCount,
            topGame: values.topGame
        }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 15);

        // Set up scales
        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .range([height, 0]);

        x.domain(processedData.map(d => d.publisher));
        y.domain([0, d3.max(processedData, d => d.sales)]);

        // Add gradient definition
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "bar-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", CHART_COLORS.accent);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", CHART_COLORS.primary);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(y));

        // Add bars with animation indices
        const bars = svg.selectAll(".bar")
            .data(processedData)
            .enter().append("rect")
            .attr("class", "bar")
            .style("--index", (d, i) => i) // Add index for staggered animation
            .attr("x", d => x(d.publisher))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.sales))
            .attr("height", d => height - y(d.sales))
            .attr("fill", "url(#bar-gradient)")
            .attr("rx", 4)
            .attr("ry", 4);

        // Add tooltips
        const tooltip = d3.select("body").append("div")
            .attr("class", "publisher-tooltip")
            .style("opacity", 0);

        bars.on("mouseover", function (event, d) {
            // Highlight bar
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", CHART_COLORS.hover);

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            tooltip.html(`
                <div class="tooltip-header">
                    <strong>${d.publisher}</strong>
                    <span class="market-share">${(d.sales / d3.sum(processedData, d => d.sales) * 100).toFixed(1)}% Market Share</span>
                </div>
                <div class="tooltip-content">
                    <div class="tooltip-section">
                        <div class="stat-row">
                            <span class="stat-label">Global Sales:</span>
                            <span class="stat-value">${d.sales.toFixed(2)}M</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Games Published:</span>
                            <span class="stat-value">${d.gameCount}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Top Game:</span>
                            <span class="stat-value">${d.topGame}</span>
                        </div>
                    </div>
                </div>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
            .on("mouseout", function () {
                // Reset bar color
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", "url(#bar-gradient)");

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-40},${height / 2}) rotate(-90)`)
            .text("Global Sales (Millions)");

        svg.append("text")
            .attr("class", "chart-title")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2},${-10})`)
            .text("Top 15 Game Publishers by Global Sales");
    }

    function createTimelineChart(data) {
        // Process data by year
        const yearData = Array.from(d3.rollup(data,
            v => ({
                sales: d3.sum(v, d => +d.Global_Sales),
                gameCount: v.length
            }),
            d => d.Year
        ), ([year, values]) => ({
            year: +year,
            sales: values.sales,
            gameCount: values.gameCount
        }))
            .filter(d => !isNaN(d.year) && d.year >= 1980 && d.year <= 2020)
            .sort((a, b) => a.year - b.year);

        // Set up scales
        const x = d3.scaleLinear()
            .domain(d3.extent(yearData, d => d.year))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(yearData, d => d.sales)])
            .range([height, 0]);

        // Add gradient definitions
        const areaGradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "area-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        areaGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", CHART_COLORS.primary)
            .attr("stop-opacity", 0.3);

        areaGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", CHART_COLORS.primary)
            .attr("stop-opacity", 0.1);

        // Add axes with grid lines
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat("")
            );

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g")
            .call(d3.axisLeft(y));

        // Create the area
        const area = d3.area()
            .x(d => x(d.year))
            .y0(height)
            .y1(d => y(d.sales))
            .curve(d3.curveMonotoneX);

        // Add the area with animation
        svg.append("path")
            .datum(yearData)
            .attr("class", "area")
            .attr("d", area);

        // Create the line
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.sales))
            .curve(d3.curveMonotoneX);

        // Add the line with animation
        svg.append("path")
            .datum(yearData)
            .attr("class", "line")
            .attr("d", line);

        // Add dots with animation
        svg.selectAll(".dot")
            .data(yearData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .style("--index", (d, i) => i) // Add index for staggered animation
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.sales))
            .attr("r", 5);

        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add interactive elements
        const guideLine = svg.append("line")
            .attr("class", "guide-line")
            .style("opacity", 0);

        const overlay = svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

        // Mouse events for dots
        svg.selectAll(".dot")
            .on("mouseover", function (event, d) {
                const growth = d.year > 1980 ?
                    ((d.sales - yearData[yearData.findIndex(y => y.year === d.year) - 1].sales) /
                        yearData[yearData.findIndex(y => y.year === d.year) - 1].sales * 100).toFixed(1) : null;

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8)
                    .style("fill", CHART_COLORS.hover);

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip.html(`
                    <div class="tooltip-header">
                        <strong>${d.year}</strong>
                    </div>
                    <div class="tooltip-content">
                        <div class="tooltip-section">
                            <div class="stat-row">
                                <span class="stat-label">Global Sales:</span>
                                <span class="stat-value">${d.sales.toFixed(2)}M</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Games Released:</span>
                                <span class="stat-value">${d.gameCount}</span>
                            </div>
                            ${growth ? `
                            <div class="stat-row">
                                <span class="stat-label">YoY Growth:</span>
                                <span class="growth ${growth > 0 ? 'positive' : 'negative'}">
                                    ${growth > 0 ? '+' : ''}${growth}%
                                </span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                guideLine
                    .attr("x1", x(d.year))
                    .attr("x2", x(d.year))
                    .attr("y1", 0)
                    .attr("y2", height)
                    .style("opacity", 1);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 5)
                    .style("fill", CHART_COLORS.primary);

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                guideLine.style("opacity", 0);
            });

        // Add labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-40},${height / 2}) rotate(-90)`)
            .text("Global Sales (Millions)");

        svg.append("text")
            .attr("class", "chart-title")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2},${-10})`)
            .text("Video Game Sales Timeline (1980-2020)");
    }

    function createGenreChart(data) {
        // Process data for genres
        const genreData = d3.rollup(data,
            v => ({
                sales: d3.sum(v, d => +d.Global_Sales),
                count: v.length,
                avgSale: d3.mean(v, d => +d.Global_Sales)
            }),
            d => d.Genre
        );

        const processedData = Array.from(genreData, ([genre, values]) => ({
            genre,
            sales: values.sales,
            count: values.count,
            avgSale: values.avgSale
        }));

        // Set up scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.count)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(processedData, d => d.sales)])
            .range([height, 0]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", 40)
            .text("Number of Games");

        svg.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .text("Global Sales (Millions)");

        // Add dots with animation
        const dots = svg.selectAll(".genre-point")
            .data(processedData)
            .enter()
            .append("circle")
            .attr("class", "genre-point")
            .style("--index", (d, i) => i)
            .attr("cx", d => x(d.count))
            .attr("cy", d => y(d.sales))
            .attr("r", d => Math.sqrt(d.avgSale) * 5)
            .attr("fill", CHART_COLORS.primary)
            .attr("opacity", 0.7);

        // Add tooltips
        const tooltip = d3.select("body").append("div")
            .attr("class", "genre-tooltip tooltip")
            .style("opacity", 0);

        dots.on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", CHART_COLORS.hover)
                .attr("r", d => Math.sqrt(d.avgSale) * 6);

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            tooltip.html(`
                <div class="tooltip-header">
                    <strong>${d.genre}</strong>
                    <span class="market-share">${(d.sales / d3.sum(processedData, d => d.sales) * 100).toFixed(1)}% market share</span>
                </div>
                <div class="tooltip-section">
                    <div class="stat-row">
                        <span class="stat-label">Total Sales:</span>
                        <span class="stat-value">$${d.sales.toFixed(2)}M</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Games:</span>
                        <span class="stat-value">${d.count}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Avg Sales:</span>
                        <span class="stat-value">$${d.avgSale.toFixed(2)}M</span>
                    </div>
                </div>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
            .on("mouseout", function (d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", CHART_COLORS.primary)
                    .attr("r", d => Math.sqrt(d.avgSale) * 5);

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

    // Expose the initialization function to the global namespace
    window.VideoGameViz.initialize = async function () {
        try {
            // Clear any existing visualizations first
            d3.select('#visualization-container').selectAll('*').remove();
            d3.selectAll('.tooltip').remove();

            let container = document.getElementById('visualization-container');
            if (!container) {
                console.log('Visualization container not found, creating one');
                // Create the container if it doesn't exist
                container = document.createElement('div');
                container.id = 'visualization-container';
                container.className = 'chart-container';

                // Find the visualization div and append the container
                const vizDiv = document.querySelector('.visualization');
                if (!vizDiv) {
                    throw new Error('No .visualization div found');
                }
                vizDiv.appendChild(container);
            }

            const data = await loadData();

            // Set up SVG
            width = container.clientWidth - margin.left - margin.right;
            height = 600 - margin.top - margin.bottom;

            svg = d3.select('#visualization-container')
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .attr('class', 'chart-animation')
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Determine which chart to create based on the current page
            const currentPage = window.location.pathname;
            if (currentPage.includes('publishers.html')) {
                createPublisherChart(data);
            } else if (currentPage.includes('timeline.html')) {
                createTimelineChart(data);
            } else if (currentPage.includes('genres.html')) {
                createGenreChart(data);
            }
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
        }
    };

    // Clean up event listeners
    const initializeViz = () => {
        if (window.VideoGameViz && window.VideoGameViz.initialize) {
            window.VideoGameViz.initialize();
        }
    };

    // Handle resize events
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(initializeViz, 250);
    });

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeViz);
    } else {
        initializeViz();
    }
})();
