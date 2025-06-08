Promise.all([
  d3.json('./data/indonesia-province-simple-Observable.json'),
  d3.csv('./data/Jumlah_Sekolah_Akses_Internet_20242.csv')
]).then(([indonesia, InternetschoolData]) => {

const width = 1200;
const height = 800;

// Create SVG container - CHANGED FROM Observable-specific DOM.svg to standard D3
const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("preserveAspectRatio", "xMidYMid meet");

// Set up map projection
const projection = d3.geoMercator()
  .fitSize([width, height - 200], indonesia);

const path = d3.geoPath().projection(projection);
let isOriginalMap = false;
let activeRegion = null; // Track active region
let hoverRegion = null; // Track hovered region
let currentZoomedProvince = null; // Track currently zoomed province
let schoolPointsGroup = null; // Group for school points

// =============================================
// REGIONAL GROUPING IMPROVEMENTS
// =============================================

// Fungsi untuk membersihkan kode provinsi
function cleanProvinceCode(kode) {
  if (!kode) return null;
  return kode.toString().split('.')[0].substring(0, 2);
}

// Kelompok provinsi berdasarkan wilayah
const wilayahGroups = {
  west: [
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // Sumatra
    '31', '32', '33', '34', '35', '36', // Jawa
    '51' // Bali
  ],
  central: [
    '52', '53', // Nusa Tenggara Timur  & Nusa Tenggara Barat
    '61', '62', '63', '64', '65', // Kalimantan
    '71', '72', '73', '74', '75', '76', // Sulawesi
  ],
  east: [
    '81', '82', // Maluku & Maluku Utara
    '91', '92', '93', '94', '95', '96', '97' // Papua
  ]
};

function getWilayah(kode) {
  const cleanedCode = cleanProvinceCode(kode);
  if (!cleanedCode) return 'unknown';
  
  if (wilayahGroups.west.includes(cleanedCode)) return 'west';
  if (wilayahGroups.central.includes(cleanedCode)) return 'central';
  if (wilayahGroups.east.includes(cleanedCode)) return 'east';
  
  return 'unknown';
}

// Define gradient colors for each region
const wilayahGradients = {
  west: {
    start: "#a6cee3", // Light blue
    end: "#1f78b4"    // Dark blue
  },
  central: {
    start: "#b2df8a", // Light green
    end: "#33a02c"    // Dark green
  },
  east: {
    start: "#fdbf6f", // Light orange
    end: "#ff7f00"    // Dark orange
  },
  unknown: {
    start: "#cccccc", // Light gray
    end: "#999999"    // Dark gray
  }
};

// Define blue gradient for original mode
const blueGradient = {
  start: "#deebf7", // Very light blue
  end: "#3182bd"    // Medium blue
};

// Add title
svg.append("text")
  .attr("x", width/2)
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-weight", "bold")
  .text("Indonesia School Internet Access Dashboard");

// ======================
// BAR CHART SETUP
// ======================

const barChartGroup = svg.append("g")
  .attr("transform", `translate(0, 80)`);

const cleanNumber = (val) => {
  if (typeof val === 'string') return +val.toString().replace(/,/g, '');
  return +val;
};

// Process the school internet data
const dataByProvince = {};
InternetschoolData.forEach(d => {
  const kode = d['Kode Kemdagri'];
  if (!dataByProvince[kode]) {
    dataByProvince[kode] = {
      provinsi: d.Provinsi,
      total: {
        State_School_Internet: 0,
        Private_School_Internet: 0,
        Total_School_Internet: 0,
        State_School: 0,
        Private_School: 0,
        Total_School: 0
      }
    };
  }
  
  dataByProvince[kode].total.State_School_Internet += cleanNumber(d.State_School_Internet);
  dataByProvince[kode].total.Private_School_Internet += cleanNumber(d.Private_School_Internet);
  dataByProvince[kode].total.Total_School_Internet += cleanNumber(d.Total_School_Internet);
  dataByProvince[kode].total.State_School += cleanNumber(d.State_School);
  dataByProvince[kode].total.Private_School += cleanNumber(d.Private_School);
  dataByProvince[kode].total.Total_School += cleanNumber(d.Total_School);
});

// Calculate national totals
const nationalTotals = Object.values(dataByProvince).reduce((acc, province) => {
  return {
    State_School_Internet: acc.State_School_Internet + province.total.State_School_Internet,
    Private_School_Internet: acc.Private_School_Internet + province.total.Private_School_Internet,
    Total_School_Internet: acc.Total_School_Internet + province.total.Total_School_Internet,
    State_School: acc.State_School + province.total.State_School,
    Private_School: acc.Private_School + province.total.Private_School,
    Total_School: acc.Total_School + province.total.Total_School
  };
}, {
  State_School_Internet: 0,
  Private_School_Internet: 0,
  Total_School_Internet: 0,
  State_School: 0,
  Private_School: 0,
  Total_School: 0
});

// Function to calculate regional totals
function getRegionalTotals(region) {
  const provinceCodes = wilayahGroups[region] || [];
  return provinceCodes.reduce((acc, code) => {
    const provinceData = dataByProvince[code];
    if (provinceData) {
      acc.State_School_Internet += provinceData.total.State_School_Internet;
      acc.Private_School_Internet += provinceData.total.Private_School_Internet;
      acc.Total_School_Internet += provinceData.total.Total_School_Internet;
      acc.State_School += provinceData.total.State_School;
      acc.Private_School += provinceData.total.Private_School;
      acc.Total_School += provinceData.total.Total_School;
    }
    return acc;
  }, {
    State_School_Internet: 0,
    Private_School_Internet: 0,
    Total_School_Internet: 0,
    State_School: 0,
    Private_School: 0,
    Total_School: 0,
    region: region
  });
}

// Bar chart dimensions and scales
const barChartWidth = width - 250;
const barChartHeight = 80;
const legendStartX = width - 200;

const xScale = d3.scaleLinear()
  .range([0, barChartWidth - 30])
  .domain([0, 100]);

const yScale = d3.scaleBand()
  .domain(["State Schools", "Private Schools", "All Schools"])
  .range([0, barChartHeight])
  .padding(0.2);

const barColors = ["#3182bd", "#6baed6", "#9ecae1"];

function updateLegend() {
  const legendData = [
    { label: "State Schools", color: barColors[0] },
    { label: "Private Schools", color: barColors[1] },
    { label: "All Schools", color: barColors[2] }
  ];
  
  const legend = barChartGroup.selectAll(".legend")
    .data(legendData);
  
  legend.exit().remove();
  
  const legendEnter = legend.enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${legendStartX}, ${i * 23 + 5})`);
  
  legendEnter.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => d.color);
  
  legendEnter.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", "0.35em")
    .style("font-size", "10px")
    .text(d => d.label);
}

function updateBarChart(provinceCode, region = null) {
  let displayData;
  let titleText;
  
  if (region) {
    const regionData = getRegionalTotals(region);
    displayData = {
      State_School_Internet: regionData.State_School_Internet,
      Private_School_Internet: regionData.Private_School_Internet,
      Total_School_Internet: regionData.Total_School_Internet,
      State_School: regionData.State_School,
      Private_School: regionData.Private_School,
      Total_School: regionData.Total_School
    };
    titleText = `Internet Access in Schools - Indonesia ${region.charAt(0).toUpperCase() + region.slice(1)}`;
  } else if (provinceCode) {
    displayData = dataByProvince[provinceCode].total;
    titleText = `Internet Access in Schools - ${dataByProvince[provinceCode].provinsi}`;
  } else {
    displayData = nationalTotals;
    titleText = "National Internet Access in Schools";
  }
  
  // Update title
  barChartGroup.select(".bar-chart-title").text(titleText);
  
  // Prepare data for bars
  const barData = [
    { 
      type: "State Schools", 
      value: (displayData.State_School_Internet / displayData.State_School * 100) || 0,
      count: displayData.State_School_Internet,
      total: displayData.State_School
    },
    { 
      type: "Private Schools", 
      value: (displayData.Private_School_Internet / displayData.Private_School * 100) || 0,
      count: displayData.Private_School_Internet,
      total: displayData.Private_School
    },
    { 
      type: "All Schools", 
      value: (displayData.Total_School_Internet / displayData.Total_School * 100) || 0,
      count: displayData.Total_School_Internet,
      total: displayData.Total_School
    }
  ];
  
  // Update bars
  const bars = barChartGroup.selectAll(".bar")
    .data(barData, d => d.type);
  
  bars.exit().remove();
  
  const newBars = bars.enter()
    .append("g")
    .attr("class", "bar");
  
  newBars.append("rect")
    .attr("x", 20)
    .attr("y", d => yScale(d.type))
    .attr("height", yScale.bandwidth())
    .attr("fill", (d, i) => barColors[i]);
  
  newBars.append("text")
    .attr("class", "bar-label")
    .attr("y", d => yScale(d.type) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .style("font-size", "10px")
    .style("pointer-events", "none");
  
  bars.merge(newBars)
    .select("rect")
    .transition()
    .duration(500)
    .attr("width", d => xScale(d.value));
  
  bars.merge(newBars)
    .select("text")
    .transition()
    .duration(500)
    .attr("x", function(d) {
      const barWidth = xScale(d.value);
      const maxTextPosition = barChartWidth - 10;
      const textWidth = this.getComputedTextLength ? this.getComputedTextLength() : 80;
      return (25 + barWidth + textWidth) > maxTextPosition ? 
        20 + Math.max(0, barWidth - textWidth - 5) : 
        25 + barWidth;
    })
    .attr("text-anchor", function(d) {
      const barWidth = xScale(d.value);
      const maxTextPosition = barChartWidth - 10;
      const textWidth = this.getComputedTextLength ? this.getComputedTextLength() : 80;
      return (25 + barWidth + textWidth) > maxTextPosition ? "start" : "start";
    })
    .attr("fill", function(d) {
      const barWidth = xScale(d.value);
      const maxTextPosition = barChartWidth - 10;
      const textWidth = this.getComputedTextLength ? this.getComputedTextLength() : 80;
      return (25 + barWidth + textWidth) > maxTextPosition ? "white" : "black";
    })
    .text(d => `${d.count.toLocaleString()} of ${d.total.toLocaleString()} (${Math.round(d.value)}%)`);
  
  updateLegend();
}

// Add bar chart title
barChartGroup.append("text")
  .attr("class", "bar-chart-title")
  .attr("x", 20)
  .attr("y", -5)
  .style("font-size", "12px")
  .style("font-weight", "bold")
  .text("National Internet Access in Schools");

// Initialize bar chart
updateBarChart();

// ======================
// MAP SETUP
// ======================

const mapGroup = svg.append("g")
  .attr("transform", "translate(0, 150)");

// Create group for school points
schoolPointsGroup = svg.append("g")
  .attr("class", "school-points")
  .attr("transform", "translate(0, 150)");

// Function to generate random points within a polygon
function generatePointsInPolygon(polygon, numPoints) {
  const points = [];
  const bounds = path.bounds(polygon);
  const x0 = bounds[0][0], y0 = bounds[0][1];
  const x1 = bounds[1][0], y1 = bounds[1][1];
  
  // Use rejection sampling to get points inside the polygon
  let i = 0;
  while (points.length < numPoints && i < numPoints * 10) {
    i++;
    const x = x0 + Math.random() * (x1 - x0);
    const y = y0 + Math.random() * (y1 - y0);
    
    // Check if point is inside the polygon
    const point = { type: "Point", coordinates: projection.invert([x, y]) };
    if (d3.geoContains(polygon, point.coordinates)) {
      points.push([x, y]);
    }
  }
  
  return points;
}

// Function to show school points for a province
function showSchoolPoints(provinceCode, provinceData) {
  // Remove existing points
  schoolPointsGroup.selectAll("*").remove();
  
  // Find the province feature
  const provinceFeature = indonesia.features.find(f => {
    const kode = f.properties.kode || f.properties.kdprovinsi || f.properties.id;
    return cleanProvinceCode(kode) === cleanProvinceCode(provinceCode);
  });
  
  if (!provinceFeature) return;
  
  // Calculate number of points to show (50% of total schools)
  const totalSchools = provinceData.total.Total_School;
  const schoolsWithInternet = provinceData.total.Total_School_Internet;
  const schoolsWithoutInternet = totalSchools - schoolsWithInternet;
  
  const pointsToShow = Math.min(Math.floor(totalSchools * 0.5), 500); // Cap at 500 points
  
  // Calculate ratio of schools with/without internet
  const internetRatio = schoolsWithInternet / totalSchools;
  const internetPoints = Math.floor(pointsToShow * internetRatio);
  const noInternetPoints = pointsToShow - internetPoints;
  
  // Generate points for schools with internet
  const internetPointsCoords = generatePointsInPolygon(provinceFeature, internetPoints);
  schoolPointsGroup.selectAll(".school-internet")
    .data(internetPointsCoords)
    .enter()
    .append("circle")
    .attr("class", "school-point school-internet")
    .attr("cx", d => d[0])
    .attr("cy", d => d[1])
    .attr("r", 1)
    .attr("fill", "#ffff00") // Blue for schools with internet
    .attr("opacity", 0.7);
  
  // Generate points for schools without internet
  const noInternetPointsCoords = generatePointsInPolygon(provinceFeature, noInternetPoints);
  schoolPointsGroup.selectAll(".school-no-internet")
    .data(noInternetPointsCoords)
    .enter()
    .append("circle")
    .attr("class", "school-point school-no-internet")
    .attr("cx", d => d[0])
    .attr("cy", d => d[1])
    .attr("r", 1)
    .attr("fill", "#ffffff") // Red for schools without internet
    .attr("opacity", 0.7);
}

// Add zoom functionality
const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on("zoom", (event) => {
    mapGroup.attr("transform", `translate(0, 150) ${event.transform}`);
    schoolPointsGroup.attr("transform", `translate(0, 150) ${event.transform}`);
  });

svg.call(zoom)
  .on("click", resetToNationalView);

// Add reset button
const resetButton = svg.append("g")
  .attr("transform", `translate(${width - 100}, 30)`)
  .style("cursor", "pointer")
  .on("click", resetToNationalView);

// Add toggle button
const toggleButton = svg.append("g")
  .attr("transform", `translate(20, ${height - 780})`)
  .style("cursor", "pointer")
  .on("click", toggleMapMode);

toggleButton.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", 90)
  .attr("height", 25)
  .attr("rx", 5)
  .attr("fill", "#eee")
  .attr("stroke", "#999");

toggleButton.append("text")
  .attr("x", 45)
  .attr("y", 15)
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text("Original Mode");

// Add gradient definitions for each region
const defs = svg.append("defs");

// Create gradients for each region
Object.keys(wilayahGradients).forEach(region => {
  const gradient = defs.append("linearGradient")
    .attr("id", `gradient-${region}`)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "100%");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", wilayahGradients[region].start);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", wilayahGradients[region].end);
});

// Add blue gradient for original mode
const blueGrad = defs.append("linearGradient")
  .attr("id", "blue-gradient")
  .attr("x1", "0%").attr("y1", "0%")
  .attr("x2", "100%").attr("y2", "100%");

blueGrad.append("stop")
  .attr("offset", "0%")
  .attr("stop-color", "#a6cee3");

blueGrad.append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "1f78b4");

function showAllSchoolPoints() {
  // Remove existing points
  schoolPointsGroup.selectAll("*").remove();
  
  // Calculate national totals
  const totalSchools = nationalTotals.Total_School;
  const schoolsWithInternet = nationalTotals.Total_School_Internet;
  const schoolsWithoutInternet = totalSchools - schoolsWithInternet;
  
  // Calculate ratio for points
  const internetRatio = schoolsWithInternet / totalSchools;
  const totalPoints = 1000; // Total points to show nationally
  const internetPoints = Math.floor(totalPoints * internetRatio);
  const noInternetPoints = totalPoints - internetPoints;
  
  // Generate points for each province proportionally
  Object.keys(dataByProvince).forEach(provinceCode => {
    const provinceData = dataByProvince[provinceCode];
    const provinceRatio = provinceData.total.Total_School / totalSchools;
    const provincePoints = Math.max(5, Math.floor(totalPoints * provinceRatio)); // At least 5 points per province
    
    // Find the province feature
    const provinceFeature = indonesia.features.find(f => {
      const kode = f.properties.kode || f.properties.kdprovinsi || f.properties.id;
      return cleanProvinceCode(kode) === cleanProvinceCode(provinceCode);
    });
    
    if (!provinceFeature) return;
    
    // Calculate points for this province
    const provinceInternetRatio = provinceData.total.Total_School_Internet / provinceData.total.Total_School;
    const provinceInternetPoints = Math.floor(provincePoints * provinceInternetRatio);
    const provinceNoInternetPoints = provincePoints - provinceInternetPoints;
    
    // Generate points for schools with internet
    const internetPointsCoords = generatePointsInPolygon(provinceFeature, provinceInternetPoints);
    schoolPointsGroup.selectAll(".school-internet-" + provinceCode)
      .data(internetPointsCoords)
      .enter()
      .append("circle")
      .attr("class", "school-point school-internet")
      .attr("cx", d => d[0])
      .attr("cy", d => d[1])
      .attr("r", 1.5)
      .attr("fill", "#ffff00") // Kuning untuk sekolah dengan internet
      .attr("opacity", 0.8);
    
    // Generate points for schools without internet
    const noInternetPointsCoords = generatePointsInPolygon(provinceFeature, provinceNoInternetPoints);
    schoolPointsGroup.selectAll(".school-no-internet-" + provinceCode)
      .data(noInternetPointsCoords)
      .enter()
      .append("circle")
      .attr("class", "school-point school-no-internet")
      .attr("cx", d => d[0])
      .attr("cy", d => d[1])
      .attr("r", 1.5)
      .attr("fill", "#ffffff") // Putih untuk sekolah tanpa internet
      .attr("opacity", 0.8);
  });
}

function toggleMapMode(event) {
  event.stopPropagation();
  isOriginalMap = !isOriginalMap;
  
  if (isOriginalMap) {
    svg.selectAll(".province")
      .attr("fill", function(d) {
        const kode = d.properties.kode;
        const nilaiInternet = dataByProvince[kode]?.total.State_School_Internet || 0;
        
        // Calculate normalized value for gradient
        const maxInternet = d3.max(Object.values(dataByProvince), d => d.total.State_School_Internet);
        const normalized = nilaiInternet / maxInternet;
        
        // Create gradient ID based on normalized value
        const gradientId = `blue-gradient-${kode}`;
        
        // Create dynamic gradient for this province
        if (!defs.select(`#${gradientId}`).node()) {
          const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "100%");
          
          // Interpolate between light and dark blue based on normalized value
          const midColor = d3.interpolate("#a6cee3", "1f78b4")(normalized);
          
          gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#a6cee3");
            
          gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", midColor);
        }
        
        return `url(#${gradientId})`;
      })
      .attr("opacity", 0.8);
    
    // Show school points for all Indonesia
    showAllSchoolPoints();
    
    toggleButton.select("text").text("Grouped Mode");
  } else {
    svg.selectAll(".province")
      .attr("fill", d => {
        const kode = d.properties.kode || d.properties.kdprovinsi || d.properties.id;
        return `url(#gradient-${getWilayah(kode)})`;
      })
      .attr("opacity", 1);
    
    // Hide school points in grouped mode
    schoolPointsGroup.selectAll("*").remove();
    
    toggleButton.select("text").text("Original Mode");
  }
  
  // Re-apply current region highlights if any
  if (activeRegion) {
    highlightProvinces(wilayahGroups[activeRegion], wilayahGradients[activeRegion].end);
  }
}
  
function resetToNationalView(event) {
  // Only reset if click is not on a province, legend item, or button
  const target = event.target;
  const isProvince = target.classList.contains("province") || 
                    target.parentNode.classList.contains("province");
  const isLegendItem = target.classList.contains("legend-item") || 
                      target.parentNode.classList.contains("legend-item");
  const isButton = target === resetButton.node() || 
                  target === toggleButton.node() ||
                  target.parentNode === resetButton.node() || 
                  target.parentNode === toggleButton.node();
  
  if (!isProvince && !isLegendItem && !isButton) {
    // Reset zoom
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
    
    // Reset to national view
    activeRegion = null;
    hoverRegion = null;
    currentZoomedProvince = null;
    resetHighlights();
    updateBarChart();
    
    // Show school points if in original mode
    if (isOriginalMap) {
      showAllSchoolPoints();
    } else {
      schoolPointsGroup.selectAll("*").remove();
    }
  }
}

function highlightProvinces(provinceIds, color) {
  if (isOriginalMap) {
    svg.selectAll(".province")
      .attr("opacity", 0.6);
    
    provinceIds.forEach(id => {
      svg.selectAll(`.province-${id}`)
        .attr("opacity", 1)
        .attr("fill", "#3182bd");
    });
    
    // Highlight school points for the selected province
    schoolPointsGroup.selectAll(".school-point")
      .attr("opacity", 0.2);
    
    provinceIds.forEach(id => {
      schoolPointsGroup.selectAll(`.school-internet-${id}, .school-no-internet-${id}`)
        .attr("opacity", 0.7);
    });
  } else {
    svg.selectAll(".province")
      .attr("fill", "#ccc")
      .attr("opacity", 0.6);
    
    provinceIds.forEach(id => {
      const wilayah = getWilayah(id);
      svg.selectAll(`.province-${id}`)
        .attr("fill", `url(#gradient-${wilayah})`)
        .attr("opacity", 1);
    });
  }
}

function resetHighlights() {
  if (isOriginalMap) {
    svg.selectAll(".province")
      .attr("fill", function(d) {
        const kode = d.properties.kode;
        const nilaiInternet = dataByProvince[kode]?.total.State_School_Internet || 0;
        const maxInternet = d3.max(Object.values(dataByProvince), d => d.total.State_School_Internet);
        const normalized = nilaiInternet / maxInternet;
        
        const gradientId = `blue-gradient-${kode}`;
        
        if (!defs.select(`#${gradientId}`).node()) {
          const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "100%");
          
          const midColor = d3.interpolate(blueGradient.start, blueGradient.end)(normalized);
          
          gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", blueGradient.start);
            
          gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", midColor);
        }
        
        return `url(#${gradientId})`;
      })
      .attr("opacity", 0.8);
  } else {
    svg.selectAll(".province")
      .attr("fill", d => {
        const kode = d.properties.kode || d.properties.kdprovinsi || d.properties.id;
        return `url(#gradient-${getWilayah(kode)})`;
      })
      .attr("opacity", 1);
  }
}

// Create tooltip
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "8px 12px")
  .style("background", "rgba(0, 0, 0, 0.8)")
  .style("color", "white")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("font-size", "12px")
  .style("max-width", "200px")
  .style("visibility", "hidden")
  .style("z-index", "10");

function adjustTooltipPosition(event, tooltipNode) {
  const tooltipWidth = tooltipNode.offsetWidth;
  const tooltipHeight = tooltipNode.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  let left = event.pageX + 10;
  let top = event.pageY - 10;
  
  if (left + tooltipWidth > windowWidth) left = event.pageX - tooltipWidth - 10;
  if (top + tooltipHeight > windowHeight) top = event.pageY - tooltipHeight - 10;
  
  return { left, top };
}

// Draw provinces
const provincePaths = mapGroup.selectAll("path")
  .data(indonesia.features)
  .enter()
  .append("path")
  .attr("d", path)
  .attr("fill", d => {
    const kode = d.properties.kode || d.properties.kdprovinsi || d.properties.id;
    return `url(#gradient-${getWilayah(kode)})`;
  })
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5)
  .attr("class", d => {
    const kode = d.properties.kode || d.properties.kdprovinsi || d.properties.id;
    return `province province-${kode}`;
  })
  .on("mouseover", function(event, d) {
    const kode = d.properties.kode || d.properties.kdprovinsi || d.properties.id;
    highlightProvinces([kode], wilayahGradients[getWilayah(kode)].end);
    updateBarChart(kode);
    
    tooltip
      .html(`
        <strong>${d.properties.Propinsi || d.properties.name || "Unknown Province"}</strong><br>
        Region: ${getWilayah(kode).toUpperCase()}<br>
        Total Schools: ${dataByProvince[kode]?.total.Total_School.toLocaleString() || 'N/A'}<br>
        Schools with Internet: ${dataByProvince[kode]?.total.Total_School_Internet.toLocaleString() || 'N/A'}
      `)
      .style("visibility", "visible");
    
    const position = adjustTooltipPosition(event, tooltip.node());
    tooltip
      .style("left", position.left + "px")
      .style("top", position.top + "px");
  })
  .on("mouseout", function() {
    if (!activeRegion && !hoverRegion) {
      resetHighlights();
      updateBarChart();
    }
    tooltip.style("visibility", "hidden");
  })
  .on("mousemove", function(event) {
    const position = adjustTooltipPosition(event, tooltip.node());
    tooltip
      .style("left", position.left + "px")
      .style("top", position.top + "px");
  })
  .on("click", function(event, d) {
    const kode = d.properties.kode || d.properties.kdprovinsi || d.properties.id;
    const provinceData = dataByProvince[kode];
    
    if (!provinceData) return;
    
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();
    
    // Store currently zoomed province
    currentZoomedProvince = kode;
    
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    );
    
    // Show school points after zoom transition completes
    setTimeout(() => {
      showSchoolPoints(kode, provinceData);
    }, 750);
  });

// ======================
// INTERACTIVE REGIONAL LEGEND
// ======================

const legendWilayah = svg.append("g")
  .attr("transform", `translate(${width - 200}, ${height - 610})`);

const wilayahLegendData = [
  { label: "West Indonesia", color: wilayahGradients.west.end, region: "west" },
  { label: "Central Indonesia", color: wilayahGradients.central.end, region: "central" },
  { label: "East Indonesia", color: wilayahGradients.east.end, region: "east" },
];

const legendItems = legendWilayah.selectAll(".legend-item")
  .data(wilayahLegendData)
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", (d, i) => `translate(0, ${i * 20})`)
  .style("cursor", "pointer")
  .on("click", function(event, d) {
    event.stopPropagation();
    activeRegion = d.region;
    hoverRegion = null;
    
    if (d.region) {
      const provinceCodes = wilayahGroups[d.region];
      highlightProvinces(provinceCodes, wilayahGradients[d.region].end);
      updateBarChart(null, d.region);
    } else {
      resetHighlights();
      updateBarChart();
    }
  })
  .on("mouseover", function(event, d) {
    event.stopPropagation();
    if (!activeRegion) {
      hoverRegion = d.region;
      if (d.region) {
        const provinceCodes = wilayahGroups[d.region];
        highlightProvinces(provinceCodes, wilayahGradients[d.region].end);
        updateBarChart(null, d.region);
      }
    }
  })
  .on("mouseout", function(event, d) {
    event.stopPropagation();
    if (!activeRegion) {
      hoverRegion = null;
      resetHighlights();
      updateBarChart();
    }
  });

legendItems.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", 15)
  .attr("height", 15)
  .attr("fill", d => d.color)
  .attr("stroke", "#999")
  .attr("stroke-width", 1);

legendItems.append("text")
  .attr("x", 20)
  .attr("y", 12)
  .style("font-size", "12px")
  .style("font-weight", d => (activeRegion === d.region || hoverRegion === d.region) ? "bold" : "normal")
  .text(d => d.label);

// Add legend title
legendWilayah.append("text")
  .attr("x", 0)
  .attr("y", -10)
  .style("font-size", "14px")
  .style("font-weight", "bold")
  .text("Regions:");

// Add compass rose in the top right corner
const compassGroup = svg.append("g")
  .attr("transform", `translate(${width - 140},40)`); // Adjust position as needed

// Compass rose SVG paths (simplified version)
compassGroup.append("circle")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", 15)
  .attr("fill", "#eee")
  .attr("stroke", "#999");

// North arrow
compassGroup.append("path")
  .attr("d", "M0,-15 L5,0 L-5,0 Z")
  .attr("fill", "#333");

// South indicator
compassGroup.append("text")
  .attr("x", 0)
  .attr("y", 24)
  .attr("text-anchor", "middle")
  .style("font-size", "10px")
  .text("S");

// East indicator
compassGroup.append("text")
  .attr("x", 24)
  .attr("y", 5)
  .attr("text-anchor", "middle")
  .style("font-size", "10px")
  .text("E");

// West indicator
compassGroup.append("text")
  .attr("x", -24)
  .attr("y", 5)
  .attr("text-anchor", "middle")
  .style("font-size", "10px")
  .text("W");

// Add "N" label
compassGroup.append("text")
  .attr("x", 0)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "10px")
  .style("font-weight", "bold")
  .text("N");

}).catch(console.error);