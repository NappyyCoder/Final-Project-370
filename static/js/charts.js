// Chart configurations
const margin = { top: 80, right: 100, bottom: 80, left: 90 };
const width = 1100 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

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

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add animated bars
    svg.selectAll("rect")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.publisher))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "#8B0000")
        .attr("rx", 5) // Rounded corners
        .attr("ry", 5)
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "#FF4444");

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${d.publisher}</strong><br>Global Sales: ${d.sales.toFixed(2)}M`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "#8B0000");

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .attr("y", d => y(d.sales))
        .attr("height", d => height - y(d.sales));
}

// Create timeline chart with animations
function createTimelineChart(data) {
    const svg = createResponsiveChart("#visualization-3");

    // Add chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Video Game Sales Timeline")
        .style("font-size", "24px")
        .style("font-weight", "bold");

    // Process data by year
    const yearlyData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Year
    );

    const timelineData = Array.from(yearlyData, ([year, sales]) => ({
        year: year,
        sales: sales
    }))
        .filter(d => d.year !== null)
        .sort((a, b) => a.year - b.year);

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(timelineData, d => d.year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(timelineData, d => d.sales)])
        .range([height, 0]);

    // Add axes with animations
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
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

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Create gradient for area
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#8B0000")
        .attr("stop-opacity", 0.4);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#8B0000")
        .attr("stop-opacity", 0.1);

    // Create area
    const area = d3.area()
        .x(d => x(d.year))
        .y0(height)
        .y1(d => y(d.sales))
        .curve(d3.curveMonotoneX);

    // Add animated area
    svg.append("path")
        .datum(timelineData)
        .attr("class", "area")
        .attr("d", area)
        .style("fill", "url(#area-gradient)")
        .style("opacity", 0)
        .transition()
        .duration(1500)
        .style("opacity", 1);

    // Create line
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.sales))
        .curve(d3.curveMonotoneX);

    // Add animated line
    const path = svg.append("path")
        .datum(timelineData)
        .attr("class", "line")
        .attr("d", line)
        .style("opacity", 0);

    // Animate the line
    const pathLength = path.node().getTotalLength();
    path.style("stroke-dasharray", pathLength + " " + pathLength)
        .style("stroke-dashoffset", pathLength)
        .style("opacity", 1)
        .transition()
        .duration(2000)
        .style("stroke-dashoffset", 0);

    // Add animated dots
    svg.selectAll(".dot")
        .data(timelineData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.sales))
        .attr("r", 0)
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 8);

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>Year: ${d.year}</strong><br>Global Sales: ${d.sales.toFixed(2)}M`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 4);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => 2000 + i * 50)
        .attr("r", 4);

    // Add hover line
    const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .style("opacity", 0);

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function (event) {
            const mouseX = d3.pointer(event)[0];
            hoverLine
                .attr("x1", mouseX)
                .attr("x2", mouseX)
                .attr("y1", 0)
                .attr("y2", height)
                .style("opacity", 1);
        })
        .on("mouseout", function () {
            hoverLine.style("opacity", 0);
        });
}

// Helper function to create responsive chart base
function createResponsiveChart(selector) {
    const svg = d3.select(selector)
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return svg;
}

// Load data and create charts
const getBaseUrl = () => {
    const ghPagesBase = '/Final-Project-370';
    return window.location.pathname.includes(ghPagesBase)
        ? ghPagesBase
        : '';
};

// Construct the full data path
const dataPath = `${getBaseUrl()}/data/vgsales.csv`;

console.log("Attempting to load data from:", dataPath);

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
