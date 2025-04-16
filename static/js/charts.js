// Chart configurations
const margin = { top: 40, right: 20, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

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
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return svg;
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

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add interactive bars
    svg.selectAll("rect")
        .data(topPublishers)
        .enter()
        .append("rect")
        .attr("x", d => x(d.name))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("fill", "#69b3a2")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#28756c");
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Publisher: ${d.name}<br/>Sales: ${d.value.toFixed(2)}M`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#69b3a2");
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(800)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value));
}

// Chart 2: Sales by Genre Pie Chart
function createGenreChart(data) {
    const svg = createResponsiveChart("#visualization-2");

    // Aggregate sales by genre
    const genreData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Genre
    );

    const pieData = Array.from(genreData, ([name, value]) => ({ name, value }));

    const radius = Math.min(width, height) / 2;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie()
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Move the center
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Add slices with animation
    const path = g.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    // Add labels
    const label = g.selectAll("text")
        .data(pie(pieData))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(d => d.data.name);
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

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Create line
    const line = d3.line()
        .x(d => x(+d.year))
        .y(d => y(d.sales));

    // Add line with animation
    const path = svg.append("path")
        .datum(timelineData)
        .attr("fill", "none")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 2)
        .attr("d", line);

    const totalLength = path.node().getTotalLength();

    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .attr("stroke-dashoffset", 0);
}

// Load data and create visualizations
// Try loading data with different paths to debug
Promise.all([
    d3.csv("data/vgsales.csv").catch(() => null),
    d3.csv("../data/vgsales.csv").catch(() => null),
    d3.csv("/Final-Project-370/data/vgsales.csv").catch(() => null)
]).then(([result1, result2, result3]) => {
    console.log("Trying path 'data/vgsales.csv':", result1 ? "Success" : "Failed");
    console.log("Trying path '../data/vgsales.csv':", result2 ? "Success" : "Failed");
    console.log("Trying path '/Final-Project-370/data/vgsales.csv':", result3 ? "Success" : "Failed");

    // Use the first successful result
    const data = result1 || result2 || result3;

    if (!data) {
        throw new Error("Could not load data from any path");
    }

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
}).catch(error => {
    console.error("Detailed error loading the data:", error);
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
