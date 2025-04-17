// Chart configurations
const margin = { top: 60, right: 40, bottom: 80, left: 90 };
const width = 1100 - margin.left - margin.right;  // Increased from 900
const height = 600 - margin.top - margin.bottom;  // Increased from 500

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
            d3.select(this).attr("fill", "#CC0000");  // Medium Red
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Publisher: ${d.name}<br/>Sales: ${d.value.toFixed(2)}M`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
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

// Chart 2: Genre Distribution Scatter Plot with Animation
function createGenreChart(data) {
    const svg = createResponsiveChart("#visualization-2");

    // Aggregate sales by genre
    const genreData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            count: v.length,
            avgRating: d3.mean(v, d => d.Global_Sales)
        }),
        d => d.Genre
    );

    // Convert to array and calculate percentages
    const total = d3.sum(Array.from(genreData.values()), d => d.sales);
    const genreArray = Array.from(genreData, ([name, values]) => ({
        name,
        sales: values.sales,
        count: values.count,
        percentage: (values.sales / total) * 100,
        radius: Math.sqrt(values.sales) * 3 // Scale radius based on sales
    })).sort((a, b) => b.sales - a.sales);

    // Scales
    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(genreArray, d => d.count)]);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(genreArray, d => d.sales)]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(d => d))
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
            .ticks(8))
        .style("stroke-dasharray", "3,3")
        .style("stroke-opacity", 0.2);

    // Create gradient for circles
    const gradient = svg.append("defs")
        .append("radialGradient")
        .attr("id", "genre-gradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#FF3333");

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#8B0000");

    // Add bubbles with animation
    const circles = svg.selectAll("circle")
        .data(genreArray)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.count))
        .attr("cy", height) // Start from bottom
        .attr("r", 0) // Start with radius 0
        .style("fill", "url(#genre-gradient)")
        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
        .style("opacity", 0.8);

    // Add labels
    const labels = svg.selectAll(".genre-label")
        .data(genreArray)
        .enter()
        .append("text")
        .attr("class", "genre-label")
        .attr("x", d => x(d.count))
        .attr("y", height)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#666")
        .style("opacity", 0)
        .text(d => d.name);

    // Animate bubbles
    circles.transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("cy", d => y(d.sales))
        .attr("r", d => d.radius)
        .ease(d3.easeBounceOut);

    // Animate labels
    labels.transition()
        .duration(1000)
        .delay((d, i) => i * 100 + 500)
        .attr("y", d => y(d.sales) - d.radius - 5)
        .style("opacity", 1);

    // Add hover effects
    circles.on("mouseover", function (event, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .style("fill", "#FF3333")
            .attr("r", d.radius * 1.2);

        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`Genre: ${d.name}<br>Games: ${d.count}<br>Sales: ${d.sales.toFixed(2)}M<br>Market Share: ${d.percentage.toFixed(1)}%`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("fill", "url(#genre-gradient)")
                .attr("r", d.radius);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

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

    // Aggregate sales by year
    const yearData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Year
    );

    const timelineData = Array.from(yearData, ([year, sales]) => ({ year, sales }))
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
}

// Load data with absolute path for GitHub Pages
d3.csv("/Final-Project-370/data/vgsales.csv")
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
