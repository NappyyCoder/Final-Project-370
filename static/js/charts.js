// Chart configurations
const margin = { top: 80, right: 100, bottom: 80, left: 90 };  // Increased right margin
const width = 1100 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Global state for filtered data
let globalData = [];

// Add at the top with other configurations
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Create responsive chart wrapper
function createResponsiveChart(containerId) {
    const container = d3.select(containerId);
    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return svg;
}

// Update chart colors and styles
const chartColors = {
    primary: '#8B0000',      // Dark Red
    secondary: '#FF3333',    // Bright Red
    accent: '#CC0000',       // Medium Red
    neutral: '#FFE5E5'       // Light Red
};

// Add this helper function at the top of your file
function positionTooltip(event, tooltip) {
    const tooltipWidth = 200;  // Approximate width of tooltip
    const tooltipHeight = 100; // Approximate height of tooltip
    const padding = 10;        // Padding from cursor

    // Get the current viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate tooltip position
    let left = event.pageX + padding;
    let top = event.pageY - tooltipHeight - padding;

    // If tooltip would extend beyond right edge of viewport
    if (left + tooltipWidth > viewportWidth) {
        left = event.pageX - tooltipWidth - padding;
    }

    // If tooltip would extend beyond top of viewport
    if (top < 0) {
        top = event.pageY + padding;
    }

    return { left, top };
}

// Chart 1: Top Publishers Bar Chart
function createPublisherChart(data) {
    const svg = createResponsiveChart("#visualization-1");

    // Aggregate sales by publisher
    const publisherData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Publisher
    );

    // Convert to array and sort
    const topPublishers = Array.from(publisherData, ([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(topPublishers.map(d => d.name))
        .padding(0.2);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(topPublishers, d => d.value)]);

    // Add axes with labels
    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .style("font-size", "12px");

    // X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .text("Publisher")
        .style("font-size", "14px")
        .style("font-weight", "600");

    // Y axis
    svg.append("g")
        .call(d3.axisLeft(y)
            .ticks(8)
            .tickFormat(d => d + "M"))
        .style("font-size", "12px");

    // Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .text("Global Sales (Millions)")
        .style("font-size", "14px")
        .style("font-weight", "600");

    // Add title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Top 10 Publishers by Global Sales");

    // Add interactive bars
    svg.selectAll("rect")
        .data(topPublishers)
        .enter()
        .append("rect")
        .attr("x", d => x(d.name))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("fill", chartColors.primary)
        .attr("rx", 4) // Rounded corners
        .style("filter", "drop-shadow(0 2px 2px rgba(0,0,0,0.1))")
        .on("mouseover", function (event, d) {
            const position = positionTooltip(event, tooltip);

            d3.select(this)
                .attr("fill", "#CC0000")
                .style("cursor", "pointer");

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>${d.name}</strong><br/>
                Global Sales: ${d.value.toFixed(2)}M<br/>
                Market Share: ${(d.value / d3.sum(topPublishers, p => p.value) * 100).toFixed(1)}%
            `)
                .style("left", `${position.left}px`)
                .style("top", `${position.top}px`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", chartColors.primary);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(800)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value));
}

// Chart 2: Genre Distribution Scatter Plot
function createGenreChart(data) {
    const svg = createResponsiveChart("#visualization-2");

    // Aggregate data by genre
    const genreData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            count: v.length,
            avgSales: d3.mean(v, d => d.Global_Sales)
        }),
        d => d.Genre
    );

    // Convert to array format
    const genreArray = Array.from(genreData, ([name, values]) => ({
        name,
        sales: values.sales,
        count: values.count,
        avgSales: values.avgSales
    }));

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(genreArray, d => d.count) * 1.1]) // Add 10% padding
        .range([0, width])
        .nice();

    const y = d3.scaleLinear()
        .domain([0, d3.max(genreArray, d => d.sales) * 1.1]) // Add 10% padding
        .range([height, 0])
        .nice();

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(5))
        .style("font-size", "12px");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => d + "M"))
        .style("font-size", "12px");

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Number of Games")
        .style("font-size", "14px")
        .style("font-weight", "600");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .text("Global Sales (Millions)")
        .style("font-size", "14px")
        .style("font-weight", "600");

    // Add grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        )
        .style("stroke-dasharray", "3,3")
        .style("stroke-opacity", 0.2);

    // Add clipping path to ensure points don't overflow
    svg.append("defs")
        .append("clipPath")
        .attr("id", "chart-area")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    // Apply clipping path to the plot area
    const plotArea = svg.append("g")
        .attr("clip-path", "url(#chart-area)");

    // Move the points into the clipped plot area
    plotArea.selectAll("circle")
        .data(genreArray)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.count))
        .attr("cy", d => y(d.sales))
        .attr("r", 8)
        .style("fill", "#CC0000")
        .style("opacity", 0.7)
        .style("stroke", "#8B0000")
        .style("stroke-width", 1)
        .on("mouseover", function (event, d) {
            const position = positionTooltip(event, tooltip);

            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 10)
                .style("opacity", 1);

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>${d.name}</strong><br/>
                Total Sales: ${d.sales.toFixed(2)}M<br/>
                Number of Games: ${d.count}<br/>
                Avg Sales/Game: ${d.avgSales.toFixed(2)}M<br/>
                Market Share: ${(d.sales / d3.sum(genreArray, g => g.sales) * 100).toFixed(1)}%
            `)
                .style("left", `${position.left}px`)
                .style("top", `${position.top}px`);
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 8)
                .style("opacity", 0.7);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add labels for each point
    svg.selectAll("text.genre-label")
        .data(genreArray)
        .enter()
        .append("text")
        .attr("class", "genre-label")
        .attr("x", d => x(d.count))
        .attr("y", d => y(d.sales) - 15)
        .attr("text-anchor", function (d) {
            // Adjust text anchor based on position to prevent cutoff
            const xPos = x(d.count);
            if (xPos < width * 0.1) return "start";
            if (xPos > width * 0.9) return "end";
            return "middle";
        })
        .attr("dx", function (d) {
            // Add horizontal offset based on position
            const xPos = x(d.count);
            if (xPos < width * 0.1) return "5";
            if (xPos > width * 0.9) return "-5";
            return "0";
        })
        .style("font-size", "12px")
        .style("fill", "#666")
        .text(d => d.name);

    // Add title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Video Game Genre Distribution");
}

// Chart 3: Sales Trend Over Time
function createTimelineChart(data) {
    const svg = createResponsiveChart("#visualization-3");

    // Aggregate sales and count by year
    const yearData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            count: v.length,  // Count of games per year
            avgSales: d3.sum(v, d => d.Global_Sales) / v.length  // Average sales per game
        }),
        d => d.Year
    );

    const timelineData = Array.from(yearData, ([year, values]) => ({
        year,
        sales: values.sales,
        count: values.count,
        avgSales: values.avgSales
    }))
        .sort((a, b) => a.year - b.year)
        .filter(d => d.year != "N/A");

    const x = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(timelineData, d => +d.year));

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(timelineData, d => d.sales)]);

    // Add axes with labels
    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d3.format("d"))
            .ticks(10))
        .selectAll("text")
        .style("font-size", "12px");

    // X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Release Year")
        .style("font-size", "14px")
        .style("font-weight", "600");

    // Y axis
    svg.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => d + "M")
            .ticks(8))
        .style("font-size", "12px");

    // Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .text("Global Sales (Millions)")
        .style("font-size", "14px")
        .style("font-weight", "600");

    // Add title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Video Game Sales Trend Over Time");

    // Add grid lines for better readability
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
            .ticks(8))
        .style("stroke-dasharray", "3,3")
        .style("stroke-opacity", 0.2);

    // Add gradient
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", height)
        .attr("x2", 0)
        .attr("y2", 0);

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", chartColors.primary)
        .attr("stop-opacity", 0.1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", chartColors.primary)
        .attr("stop-opacity", 1);

    // Add area under the line
    const area = d3.area()
        .x(d => x(+d.year))
        .y0(height)
        .y1(d => y(d.sales));

    svg.append("path")
        .datum(timelineData)
        .attr("fill", "url(#line-gradient)")
        .attr("d", area);

    // Create line
    const line = d3.line()
        .x(d => x(+d.year))
        .y(d => y(d.sales));

    // Add line with animation
    const path = svg.append("path")
        .datum(timelineData)
        .attr("fill", "none")
        .attr("stroke", chartColors.primary)
        .attr("stroke-width", 2)
        .attr("d", line);

    const totalLength = path.node().getTotalLength();

    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .attr("stroke-dashoffset", 0);

    // Add hover effects to the area
    const hoverArea = svg.append("path")
        .attr("class", "hover-area")
        .style("fill", "none")
        .style("pointer-events", "all");

    // Create the hover line
    const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", height)
        .style("opacity", 0);

    // Create hover effects
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => {
            hoverLine.style("opacity", 1);
            tooltip.style("opacity", 0.9);
        })
        .on("mouseout", () => {
            hoverLine.style("opacity", 0);
            tooltip.style("opacity", 0);
        })
        .on("mousemove", function (event) {
            const mouseX = d3.pointer(event)[0];
            const x0 = x.invert(mouseX);

            // Find the closest data point
            const bisect = d3.bisector(d => +d.year).left;
            const i = bisect(timelineData, x0);
            const d0 = timelineData[i - 1];
            const d1 = timelineData[i];
            const d = x0 - d0?.year > d1?.year - x0 ? d1 : d0;

            if (d) {
                hoverLine
                    .attr("x1", x(+d.year))
                    .attr("x2", x(+d.year))
                    .style("stroke", "#8B0000")
                    .style("stroke-width", "1px")
                    .style("stroke-dasharray", "5,5");

                const position = positionTooltip(event, tooltip);

                tooltip.html(`
                    <strong>Year: ${d.year}</strong><br/>
                    Total Sales: ${d.sales.toFixed(2)}M<br/>
                    Games Released: ${d.count}<br/>
                    Avg Sales/Game: ${d.avgSales.toFixed(2)}M
                `)
                    .style("left", `${position.left}px`)
                    .style("top", `${position.top}px`);
            }
        });

    // Update the line style
    svg.append("path")
        .datum(timelineData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", chartColors.primary)
        .attr("stroke-width", 3)
        .attr("d", line);
}

// Load data with relative path
d3.csv("./data/vgsales.csv")
    .then(data => {
        console.log("Data loaded successfully:", data.length, "rows");
        globalData = data;

        // Convert sales columns to numbers
        data.forEach(d => {
            d.Global_Sales = +d.Global_Sales;
            d.NA_Sales = +d.NA_Sales;
            d.EU_Sales = +d.EU_Sales;
            d.JP_Sales = +d.JP_Sales;
            d.Other_Sales = +d.Other_Sales;
        });

        createPublisherChart(data);
        createGenreChart(data);
        createTimelineChart(data);
    })
    .catch(error => {
        console.error("Error loading the data:", error);
        console.log("Current URL:", window.location.href);
        console.log("Current path:", window.location.pathname);
    });

// Add event listeners for responsiveness
window.addEventListener('resize', function () {
    createPublisherChart(globalData);
    createGenreChart(globalData);
    createTimelineChart(globalData);
});

// Add filter controls
function addFilterControls() {
    const filterDiv = d3.select("#filters")
        .append("div")
        .attr("class", "filter-controls");

    filterDiv.append("label")
        .text("Filter by Year: ");

    filterDiv.append("select")
        .attr("id", "yearFilter")
        .on("change", function () {
            const selectedYear = this.value;
            const filteredData = selectedYear === "all"
                ? globalData
                : globalData.filter(d => d.Year === selectedYear);

            createPublisherChart(filteredData);
            createGenreChart(filteredData);
            createTimelineChart(filteredData);
        });
}
