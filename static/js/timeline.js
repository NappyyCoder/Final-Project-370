// Timeline visualization
function createTimelineVisualization() {
    // Set up dimensions and margins
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select("#visualization-3 .chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Load and process data
    d3.csv("../data/sales_by_year.csv").then(function (data) {
        // Parse data
        data.forEach(d => {
            d.Year = +d.Year;
            d.Global_Sales = +d.Global_Sales;
        });

        // Filter out any future years or incomplete data
        const currentYear = new Date().getFullYear();
        data = data.filter(d => d.Year <= currentYear && d.Year >= 1950);

        // Sort data by year
        data.sort((a, b) => a.Year - b.Year);

        // Set up scales
        const x = d3.scaleLinear()
            .domain([d3.min(data, d => d.Year), d3.max(data, d => d.Year)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Global_Sales) * 1.1])
            .range([height, 0]);

        // Add X axis with proper ticks
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.format("d"))
                .ticks(10)
            );

        // Add X axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Year")
            .attr("class", "axis-label")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);

        // Add Y axis with animation
        const yAxis = svg.append("g")
            .call(d3.axisLeft(y));

        yAxis.selectAll("text")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);

        // Add Y axis label with animation
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -height / 2)
            .text("Global Sales (millions)")
            .attr("class", "axis-label")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);

        // Add area with animation
        const area = d3.area()
            .x(d => x(d.Year))
            .y0(height)
            .y1(d => y(d.Global_Sales));

        const areaPath = svg.append("path")
            .datum(data)
            .attr("fill", "rgba(139, 0, 0, 0.1)")
            .attr("stroke", "none")
            .attr("d", area);

        // Animate area
        const areaLength = areaPath.node().getTotalLength();
        areaPath
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .attr("stroke-dasharray", `${areaLength} ${areaLength}`)
            .attr("stroke-dashoffset", areaLength)
            .transition()
            .duration(2000)
            .attr("stroke-dashoffset", 0);

        // Add line with animation
        const linePath = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d.Global_Sales));

        const line = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "var(--primary-color)")
            .attr("stroke-width", 3)
            .attr("d", linePath);

        // Animate line drawing
        const lineLength = line.node().getTotalLength();
        line
            .attr("stroke-dasharray", `${lineLength} ${lineLength}`)
            .attr("stroke-dashoffset", lineLength)
            .transition()
            .duration(2000)
            .attr("stroke-dashoffset", 0);

        // Add title with animation
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("class", "visualization-title")
            .text("Global Video Game Sales by Year")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);

        // Add annotations for key events with animation
        const annotations = [
            {
                year: 1985,
                event: "NES Launch",
                sales: data.find(d => d.Year === 1985)?.Global_Sales || 0
            },
            {
                year: 1994,
                event: "PlayStation Launch",
                sales: data.find(d => d.Year === 1994)?.Global_Sales || 0
            },
            {
                year: 2001,
                event: "PS2 Peak",
                sales: data.find(d => d.Year === 2001)?.Global_Sales || 0
            },
            {
                year: 2006,
                event: "Wii Launch",
                sales: data.find(d => d.Year === 2006)?.Global_Sales || 0
            },
            {
                year: 2013,
                event: "PS4/Xbox One",
                sales: data.find(d => d.Year === 2013)?.Global_Sales || 0
            }
        ];

        // Add annotation markers and labels with staggered animation
        annotations.forEach((a, i) => {
            if (a.sales > 0) {
                // Add circle with animation
                svg.append("circle")
                    .attr("cx", x(a.year))
                    .attr("cy", y(a.sales))
                    .attr("r", 0)
                    .attr("fill", "var(--accent-color)")
                    .transition()
                    .delay(2000 + i * 300)
                    .duration(500)
                    .attr("r", 5);

                // Add text with animation
                svg.append("text")
                    .attr("x", x(a.year))
                    .attr("y", y(a.sales) - 15)
                    .attr("text-anchor", "middle")
                    .attr("class", "annotation-label")
                    .text(a.event)
                    .style("opacity", 0)
                    .transition()
                    .delay(2000 + i * 300)
                    .duration(500)
                    .style("opacity", 1);
            }
        });

        // Add grid lines with animation
        svg.append("g")
            .attr("class", "grid")
            .style("opacity", 0)
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat("")
            )
            .transition()
            .duration(1000)
            .style("opacity", 0.2);

        // Add data points with staggered animation
        svg.selectAll(".data-point")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "data-point")
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d.Global_Sales))
            .attr("r", 0)
            .attr("fill", "var(--primary-color)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.7)
            .transition()
            .delay((d, i) => 2000 + i * 50)
            .duration(300)
            .attr("r", 5)
            .on("end", function () {
                // Add hover events after animation completes
                d3.select(this)
                    .on("mouseover", function (event, d) {
                        // Highlight the point
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("r", 8)
                            .attr("opacity", 1);

                        // Calculate growth percentage
                        const prevYear = data.find(item => item.Year === d.Year - 1);
                        const growth = prevYear ? ((d.Global_Sales - prevYear.Global_Sales) / prevYear.Global_Sales * 100) : 0;
                        const growthClass = growth >= 0 ? "positive" : "negative";
                        const growthArrow = growth >= 0 ? "↑" : "↓";

                        // Use the global showTooltip function
                        showTooltip(event, d, `
                            <div class="timeline-tooltip">
                                <div class="tooltip-header">
                                    <h3>${d.Year}</h3>
                                    <span class="sales-value">Video Game Industry</span>
                                </div>
                                <div class="tooltip-body">
                                    <div class="tooltip-row">
                                        <span class="tooltip-label">Total Market Size:</span>
                                        <span class="tooltip-value">${d.Global_Sales.toFixed(1)}M Units</span>
                                    </div>
                                    <div class="tooltip-row">
                                        <span class="tooltip-label">Year-over-Year Growth:</span>
                                        <span class="tooltip-value growth ${growthClass}">
                                            ${growthArrow} ${Math.abs(growth).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div class="tooltip-row">
                                        <span class="tooltip-label">Market Context:</span>
                                        <span class="tooltip-value">${getMarketContext(d.Year)}</span>
                                    </div>
                                    <div class="tooltip-row">
                                        <span class="tooltip-label">Industry Phase:</span>
                                        <span class="tooltip-value">${getIndustryTrend(d.Year).phase}</span>
                                    </div>
                                </div>
                            </div>
                        `);
                    })
                    .on("mouseout", function () {
                        // Reset point appearance
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("r", 5)
                            .attr("opacity", 0.7);

                        // Use the global hideTooltip function
                        hideTooltip();
                    });
            });

        // Add animated drawing line
        const drawingLine = svg.append("path")
            .attr("class", "drawing-line")
            .attr("fill", "none")
            .attr("stroke", "var(--accent-color)")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5")
            .attr("d", d3.line()
                .x(d => x(d.Year))
                .y(d => y(d.Global_Sales))
                (data.slice(0, 1)) // Start with just the first point
            );

        // Animate the drawing line
        function animateDrawingLine(currentIndex = 0) {
            if (currentIndex >= data.length) return;

            // Update the line with one more data point
            drawingLine.attr("d", d3.line()
                .x(d => x(d.Year))
                .y(d => y(d.Global_Sales))
                (data.slice(0, currentIndex + 1))
            );

            // Continue the animation with the next point
            setTimeout(() => {
                animateDrawingLine(currentIndex + 1);
            }, 50); // Speed of the drawing animation
        }

        // Start the drawing animation after a delay
        setTimeout(() => {
            animateDrawingLine();
        }, 500);
    });
}

// Initialize visualization when document is ready
document.addEventListener("DOMContentLoaded", function () {
    createTimelineVisualization();
});
