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
    // Constants for colors
    const CHART_COLORS = {
        primary: '#8B0000',
        hover: '#ff4444',
        tooltip: 'rgba(255, 255, 255, 0.95)',
        border: '#8B0000'
    };

    // Data loading configuration
    const DATA_CONFIG = {
        local: '/data/vgsales.csv',
        production: '/Final-Project-370/data/vgsales.csv'
    };

    function getDataPath() {
        // Check if we're on GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            return DATA_CONFIG.production;
        }
        return DATA_CONFIG.local;
    }

    async function loadData() {
        const dataPath = getDataPath();
        console.log('Attempting to load data from:', dataPath);

        try {
            const data = await d3.csv(dataPath);
            if (!data || data.length === 0) {
                throw new Error('No data loaded');
            }
            console.log('Successfully loaded', data.length, 'records');
            return data;
        } catch (error) {
            console.error('Error loading data:', error);
            // Display error to user
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.innerHTML = `
                    <div class="error-message" style="color: #8B0000; padding: 20px; text-align: center;">
                        <h2>Error Loading Data</h2>
                        <p>Unable to load the dataset. Please try refreshing the page.</p>
                        <p>Technical details: ${error.message}</p>
                    </div>
                `;
            }
            throw error;
        }
    }

    async function initializeVisualization() {
        try {
            const data = await loadData();

            // Get the container dimensions
            const container = document.getElementById('visualization-container');
            if (!container) {
                throw new Error('Visualization container not found');
            }

            // Clear any existing content
            container.innerHTML = '';

            // Set up SVG
            width = container.clientWidth - margin.left - margin.right;
            height = 600 - margin.top - margin.bottom;

            svg = d3.select('#visualization-container')
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Determine which chart to create based on the current page
            const currentPage = window.location.pathname;
            if (currentPage.includes('publishers.html')) {
                createPublisherChart(data);
            } else if (currentPage.includes('timeline.html')) {
                createTimelineChart(data);
            }
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
        }
    }

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
            .attr("fill", CHART_COLORS.primary);

        // Add tooltips
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
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
                <strong>${d.publisher}</strong><br/>
                Global Sales: ${d.sales.toFixed(2)}M<br/>
                Games: ${d.gameCount}<br/>
                Top Game: ${d.topGame}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
            .on("mouseout", function () {
                // Reset bar color
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", CHART_COLORS.primary);

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
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

        const yearData = Array.from(timelineData, ([year, value]) => ({
            year: year,
            sales: value.sales,
            gameCount: value.gameCount
        }))
            .filter(d => d.year !== null)
            .sort((a, b) => a.year - b.year);

        // Create scales and line generator here...

        // Add dots with updated styling
        svg.selectAll(".dot")
            .data(yearData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.sales))
            .attr("r", 5)
            .style("fill", CHART_COLORS.primary)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("r", 8)
                    .style("fill", CHART_COLORS.hover);

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
                d3.select(this)
                    .attr("r", 5)
                    .style("fill", CHART_COLORS.primary);

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
