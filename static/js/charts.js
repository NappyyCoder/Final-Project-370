// Chart configurations
const margin = { top: 80, right: 100, bottom: 80, left: 90 };
const width = 1100 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Create publisher chart
function createPublisherChart(data) {
    const svg = createResponsiveChart("#visualization-1");

    // Process data for publishers
    const publisherData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Publisher
    );

    // Convert to array and sort by sales
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
    svg.selectAll("rect")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.publisher))
        .attr("y", d => y(d.sales))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.sales))
        .attr("fill", "#8B0000");
}

// Create genre chart
function createGenreChart(data) {
    const svg = createResponsiveChart("#visualization-2");

    // Process data for genres
    const genreData = d3.rollup(data,
        v => ({
            sales: d3.sum(v, d => d.Global_Sales),
            count: v.length
        }),
        d => d.Genre
    );

    // Convert to array
    const processedData = Array.from(genreData, ([genre, values]) => ({
        genre: genre,
        sales: values.sales,
        count: values.count
    }));

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.count)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.sales)])
        .range([height, 0]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add dots
    svg.selectAll("circle")
        .data(processedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.count))
        .attr("cy", d => y(d.sales))
        .attr("r", 8)
        .attr("fill", "#8B0000");
}

// Create timeline chart
function createTimelineChart(data) {
    const svg = createResponsiveChart("#visualization-3");

    // Process data by year
    const yearlyData = d3.rollup(data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Year
    );

    // Convert to array and sort by year
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

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Create line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.sales));

    // Add the line
    svg.append("path")
        .datum(timelineData)
        .attr("class", "line")
        .attr("d", line);

    // Add dots
    svg.selectAll("circle")
        .data(timelineData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.sales))
        .attr("r", 4)
        .attr("fill", "#8B0000");
}

// Create responsive chart wrapper
function createResponsiveChart(containerId) {
    const container = d3.select(containerId);
    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return svg;
}

// Load data and create charts
// Update the data loading path to use the correct GitHub Pages URL
const dataPath = window.location.pathname.includes('Final-Project-370')
    ? '/Final-Project-370/data/vgsales.csv'  // GitHub Pages path
    : '../data/vgsales.csv';                 // Local development path

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
                        <p>${error.message}</p>
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
