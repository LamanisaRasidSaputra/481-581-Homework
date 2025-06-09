// Load your data here from a local csv file
d3.csv('./data/pokemon_data.csv').then(pokemonData => {
  // Set dimensions with margin
  const margin = 10;
  const width = 1200;
  const height = 1400;

  // get pokemon names 
  const pokemonNames = pokemonData.map(d => d.Name);

  // Create main container
  const container = d3.create('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('gap', '20px')
    .style('max-width', '1200px')
    .style('margin', '0 auto');

  // Create input controls container
  const inputContainer = container.append('div')
    .style('display', 'flex')
    .style('gap', '10px')
    .style('align-items', 'center')
    .style('position', 'relative');

  // Create search input with combobox functionality
  const searchDiv = inputContainer.append('div')
    .style('flex-grow', '1')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('position', 'relative');

  const searchInput = searchDiv.append('input')
    .attr('type', 'text')
    .attr('placeholder', 'Search Pokémon...')
    .style('padding', '8px')
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('width', '50%')
    .node();

  const suggestionsDiv = searchDiv.append('div')
    .style('position', 'absolute')
    .style('top', '100%')
    .style('left', '0')
    .style('right', '0')
    .style('background', 'white')
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
    .style('max-height', '200px')
    .style('overflow-y', 'auto')
    .style('z-index', '1000')
    .style('display', 'none');

  const notFoundMessage = searchDiv.append('div')
    .style('color', 'red')
    .style('padding', '8px')
    .style('display', 'none')
    .text('Pokémon not found!');

  // Create type filter buttons container
  const typeFilterContainer = container.append('div')
    .style('display', 'flex')
    .style('gap', '8px')
    .style('flex-wrap', 'wrap')
    .style('margin-bottom', '10px');

  // Visualization container
  const visContainer = container.append('div')
    .style('display', 'flex')
    .style('gap', '20px');

  // Create SVG for scatter plot
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto; background: #f5f5f5; cursor: pointer');

  // Pokémon type colors
  const typeColors = {
    Normal: "#A8A878", Fire: "#F08030", Water: "#6890F0", Electric: "#F8D030",
    Grass: "#78C850", Ice: "#98D8D8", Fighting: "#C03028", Poison: "#A040A0",
    Ground: "#E0C068", Flying: "#A890F0", Psychic: "#F85888", Bug: "#A8B820",
    Rock: "#B8A038", Ghost: "#705898", Dragon: "#7038F8", Dark: "#705848",
    Steel: "#B8B8D0", Fairy: "#EE99AC"
  };

  // Create type filter buttons
  const types = Object.keys(typeColors);
  types.forEach(type => {
    typeFilterContainer.append('button')
      .text(type)
      .style('padding', '6px 12px')
      .style('background', typeColors[type])
      .style('color', 'white')
      .style('border', 'none')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .style('font-weight', 'normal')
      .on('click', function() {
        d3.selectAll('.type-filter button').style('font-weight', 'normal');
        d3.select(this).style('font-weight', 'bold');
        showOnlySelectedType(type);
      })
      .classed('type-filter', true);
  });

  // Add "All" button to reset colors
  typeFilterContainer.append('button')
    .text('All')
    .style('padding', '6px 12px')
    .style('background', '#666')
    .style('color', 'white')
    .style('border', 'none')
    .style('border-radius', '4px')
    .style('cursor', 'pointer')
    .on('click', function() {
      d3.selectAll('.type-filter button').style('font-weight', 'normal');
      resetAllColors();
    });

  // Circle size scale
  const size = d3.scaleLinear()
    .domain([d3.min(pokemonData, d => +d.HP), d3.max(pokemonData, d => +d.HP)])
    .range([2.5, 10, 0.5]);

  // Color scale for Pokémon types
  const color = d3.scaleOrdinal()
    .domain(types)
    .range(Object.values(typeColors));

  // Function to get random position with margin
  function getRandomPosition(radius) {
    return {
      x: margin + radius + Math.random() * (width - 2 * (margin + radius)),
      y: margin + radius + Math.random() * (height - 2 * (margin + radius))
    };
  }

  // Function to show only selected type in color
  function showOnlySelectedType(type) {
    svg.selectAll('circle')
      .transition()
      .duration(200)
      .attr('fill', d => {
      if (d.Type1 === type) {
        return color(d.Type1);
      } else if (d.Type2 === type) {
        return color(d.Type2);
      } else {
        return '#ddd';
      }
      })
      .attr('opacity', d => (d.Type1 === type || d.Type2 === type) ? 1 : 0.7);
  }

  // Function to reset all colors to original
  function resetAllColors() {
    svg.selectAll('circle')
      .transition()
      .duration(200)
      .attr('fill', d => color(d.Type1))
      .attr('opacity', 0.8);
  }

  // Function to show suggestions
  function showSuggestions(query) {
    suggestionsDiv.style('display', 'none');
    notFoundMessage.style('display', 'none');
    
    const lowerQuery = query ? query.toLowerCase().trim() : '';
    const matches = lowerQuery
      ? pokemonData.filter(d => d.Name.toLowerCase().startsWith(lowerQuery))
      : pokemonData; // Show all Pokémon when query is empty
    
    if (matches.length > 0) {
      suggestionsDiv.html('');
      
      matches.slice(0, 10).forEach(pokemon => {
        suggestionsDiv.append('div')
          .style('padding', '8px')
          .style('cursor', 'pointer')
          .style('border-bottom', '1px solid #eee')
          .text(pokemon.Name)
          .on('mouseover', function() {
            d3.select(this).style('background', '#f5f5f5');
          })
          .on('mouseout', function() {
            d3.select(this).style('background', 'white');
          })
          .on('click', function() {
            searchInput.value = pokemon.Name;
            updateSelection(pokemon);
            suggestionsDiv.style('display', 'none');
          });
      });
      
      suggestionsDiv.style('display', 'block');
    } else if (lowerQuery) {
      notFoundMessage.style('display', 'block');
    }
  }

  // Function to search Pokémon
  function searchPokemon(query) {
    suggestionsDiv.style('display', 'none');
    notFoundMessage.style('display', 'none');
    
    if (!query || query.trim() === "") {
      updateSelection(null);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    const foundPokemon = pokemonData.find(d => d.Name.toLowerCase() === lowerQuery);
    
    if (foundPokemon) {
      updateSelection(foundPokemon);
    } else {
      notFoundMessage.style('display', 'block');
      updateSelection(null);
    }
  }

  // Function to update selection
  function updateSelection(selectedPokemon) {
    if (!selectedPokemon) {
      svg.selectAll('circle')
        .attr('fill', d => color(d.Type1))
        .attr('opacity', 0.8)
        .attr('stroke', '#333')
        .attr('stroke-width', 0.3);
      
      const detailPanel = document.querySelector('.detail-panel');
      if (detailPanel) detailPanel.remove();
      
      searchInput.value = "";
      return;
    }
    
    svg.selectAll('circle')
      .attr('fill', '#ddd')
      .attr('opacity', 0.7)
      .attr('stroke', '#999')
      .attr('stroke-width', 0.5);
    
    svg.selectAll('circle')
      .filter(d => d.Name === selectedPokemon.Name)
      .attr('fill', d => color(d.Type1))
      .attr('opacity', 1)
      .attr('stroke', 'gold')
      .attr('stroke-width', 2);
    
    searchInput.value = selectedPokemon.Name;
    
    showPokemonDetail(selectedPokemon);
  }

  // Function to show Pokémon details
  function showPokemonDetail(pokemon) {
    const existingPanel = document.querySelector('.detail-panel');
    if (existingPanel) existingPanel.remove();
    
    const detailPanel = d3.create('div')
      .classed('detail-panel', true)
      .style('width', '400px')
      .style('min-height', '600px')
      .style('background', 'white')
      .style('border-radius', '8px')
      .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)');

    const pokemonId = pokemon.Pokedex_Number || pokemon.Name.toLowerCase().replace(/\s/g, '-');
    const imgUrl3D = `https://projectpokemon.org/images/sprites-models/normal-sprites/${pokemonId}.gif`;
    const imgUrl3DFallback = `https://img.pokemondb.net/sprites/home/normal/${pokemon.Name.toLowerCase().replace(/\s/g, '-')}.png`;
    
    const type1Color = typeColors[pokemon.Type1] || "#A8A878";
    const type2Color = pokemon.Type2 ? typeColors[pokemon.Type2] : type1Color;
    
    const statsData = {
      name: pokemon.Name,
      children: [
        { name: "Offensive", children: [
          { name: "Attack", value: +pokemon.Attack },
          { name: "Sp_Attack", value: +pokemon.Sp_Attack || 0 }
        ]},
        { name: "Defensive", children: [
          { name: "Defense", value: +pokemon.Defense },
          { name: "Sp_Defence", value: +pokemon.Sp_Defense || 0 }
        ]},
        { name: "Other", children: [
          { name: "HP", value: +pokemon.HP },
          { name: "Speed", value: +pokemon.Speed }
        ]}
      ]
    };

    detailPanel.html(`
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
          <img src="${imgUrl3D}" 
               alt="${pokemon.Name}" 
               style="width: 300px; height: 300px; object-fit: contain;"
               onerror="this.src='${imgUrl3DFallback}'; this.onerror=null;">
        </div>
        
        <h2 style="margin: 0; text-align: center;">${pokemon.Name}</h2>
        <div style="display: flex; justify-content: center; gap: 10px; margin: 10px 0;">
          <span style="
            background: ${type1Color};
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
          ">${pokemon.Type1}</span>
          ${pokemon.Type2 ? `<span style="
            background: ${type2Color};
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
          ">${pokemon.Type2}</span>` : ''}
          <span style="
            background: #eee;
            color: black;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
          ">Gen ${pokemon.gen}</span>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 10px; margin: 10px 0;">
          ${pokemon.Is_Legendary === "1" ? `<span style="
            background: #FFD700;
            color: black;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
          ">Legendary</span>` : ''}
          ${pokemon.Is_Mythical === "1" ? `<span style="
            background: #8A2BE2;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
          ">Mythical</span>` : ''}
          ${pokemon.Is_Ultra_Beast === "1" ? `<span style="
            background: #FF4500;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: bold;
          ">Ultra Beast</span>` : ''}
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="margin-bottom: 10px;">Base Stats</h3>
          <div id="sunburst-chart" style="width: 100%; height: 200px; position: relative; overflow: visible;"></div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3 style="margin-bottom: 10px;">Type Weaknesses</h3>
          <div id="weakness-heatmap" style="width: 100%; height: 70px; position: relative;"></div>
        </div>
      </div>
    `);

    // Render sunburst chart and weakness heatmap
    setTimeout(() => {
      // Sunburst chart
      const sunburstWidth = 200;
      const sunburstHeight = 200;
      const radius = Math.min(sunburstWidth, sunburstHeight) / 2;

      const svgSunburst = d3.select("#sunburst-chart")
        .append("svg")
        .attr("width", sunburstWidth)
        .attr("height", sunburstHeight)
        .style("overflow", "visible")
        .append("g")
        .attr("transform", `translate(${sunburstWidth / 2},${sunburstHeight / 2})`);

      const partition = data => {
        const root = d3.hierarchy(data)
          .sum(d => d.value || 0)
          .sort((a, b) => b.value - a.value);
        return d3.partition()
          .size([2 * Math.PI, radius])
          (root);
      };

      // Add Sp_Attack and Sp_Defense to Attack and Defense respectively
      // statsData.children[0].children.push({ name: "Sp_Attack", value: +pokemon.Sp_Attack || 0 });
      // statsData.children[1].children.push({ name: "Sp_Defense", value: +pokemon.Sp_Defence || 0 });

      const root = partition(statsData);
      const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

      const tooltipSunburst = d3.select("#sunburst-chart")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "5px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("transition", "opacity 0.2s")
        .style("z-index", "1000");

      svgSunburst.selectAll("path")
        .data(root.descendants().filter(d => d.depth))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => {
          if (d.depth === 1) {
            return d.data.name === "Offensive" ? type1Color :
                   d.data.name === "Defensive" ? (type2Color || type1Color) : "#888";
          }
          return d3.interpolateRgb(
            d.parent.data.name === "Offensive" ? type1Color :
            d.parent.data.name === "Defensive" ? (type2Color || type1Color) : "#888",
            "white"
          )(0.3);
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke-width", 1.5);
          tooltipSunburst
            .style("opacity", 1)
            .html(`<strong>${d.data.name}</strong><br>Value: ${d.value || 'N/A'}`);
        })
        .on("mousemove", function(event) {
          const sunburstRect = document.querySelector("#sunburst-chart").getBoundingClientRect();
          const x = event.clientX - sunburstRect.left + 10;
          const y = event.clientY - sunburstRect.top - 20;

          const tooltipRect = tooltipSunburst.node().getBoundingClientRect();
          const maxX = sunburstRect.width - tooltipRect.width - 10;
          const maxY = sunburstRect.height - tooltipRect.height - 10;

          tooltipSunburst
            .style("left", `${Math.max(0, Math.min(x, maxX))}px`)
            .style("top", `${Math.max(0, Math.min(y, maxY))}px`);
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke-width", 0.5);
          tooltipSunburst.style("opacity", 0);
        });

      // Add total base stats as a circle in the middle
      svgSunburst.append("circle")
        .attr("r", radius / 3)
        .attr("fill", "#f5f5f5")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

      svgSunburst.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text(`Total: ${pokemon.Base_Stats}`);

      // Render weakness heatmap
      const weaknessTypes = [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
        "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
      ];
      const weaknessData = weaknessTypes.map(type => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        value: +pokemon[`${type}_weakness`] || 1 // Default to 1 if undefined
      }));

      const heatmapWidth = 360; // Fits within 400px panel with padding
      const heatmapHeight = 50;
      const cellWidth = heatmapWidth / weaknessTypes.length;
      const cellHeight = 30;

      const svgHeatmap = d3.select("#weakness-heatmap")
        .append("svg")
        .attr("width", heatmapWidth)
        .attr("height", heatmapHeight)
        .style("overflow", "visible");

      const colorScale = d3.scaleOrdinal()
        .domain([0.25, 0.5, 1, 2, 4])
        .range(["#006400", "#90EE90", "#D3D3D3", "#FFA500", "#FF0000"]);

      const tooltipHeatmap = d3.select("#weakness-heatmap")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "5px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("transition", "opacity 0.2s")
        .style("z-index", "1000");

      svgHeatmap.selectAll("rect")
        .data(weaknessData)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * cellWidth)
        .attr("y", 0)
        .attr("width", cellWidth - 1)
        .attr("height", cellHeight)
        .attr("fill", d => colorScale(d.value))
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke-width", 1.5);
          tooltipHeatmap
            .style("opacity", 1)
            .html(`<strong>${d.type}</strong><br>Multiplier: ${d.value}x`);
        })
        .on("mousemove", function(event) {
          const heatmapRect = document.querySelector("#weakness-heatmap").getBoundingClientRect();
          const x = event.clientX - heatmapRect.left + 10;
          const y = event.clientY - heatmapRect.top - 20;
          
          const tooltipRect = tooltipHeatmap.node().getBoundingClientRect();
          const maxX = heatmapRect.width - tooltipRect.width - 10;
          const maxY = heatmapRect.height - tooltipRect.height - 10;
          
          tooltipHeatmap
            .style("left", `${Math.max(0, Math.min(x, maxX))}px`)
            .style("top", `${Math.max(0, Math.min(y, maxY))}px`);
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke-width", 0.5);
          tooltipHeatmap.style("opacity", 0);
        });

      // Add type labels below cells
      svgHeatmap.selectAll("text")
        .data(weaknessData)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * cellWidth + cellWidth / 2)
        .attr("y", cellHeight + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => d.type.slice(0, 3)) // Abbreviate for space (e.g., "Nor", "Fir")
        .style("fill", "#333");

    }, 0);

    visContainer.append(() => detailPanel.node());
}

  // Create Pokémon circles with initial random positions
  const pokemons = svg
    .selectAll('circle')
    .data(pokemonData)
    .join('circle')
      .attr('r', d => size(+d.weight_kilograms)) // Use weight_kilograms for circle size
      .attr('fill', d => color(d.Type1))
      .attr('opacity', 0.8)
      .attr('stroke', '#333')
      .attr('stroke-width', 0.3)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1).attr('stroke-width', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8).attr('stroke-width', 0.3);
      })
      .on('click', (event, d) => {
        updateSelection(d);
      })
      .each(function(d) {
        const pos = getRandomPosition(size(+d.weight_kilograms)); // Use weight_kilograms for position
        d.originalX = pos.x;
        d.originalY = pos.y;
        d3.select(this)
          .attr('cx', pos.x)
          .attr('cy', pos.y);
      });

  // Add tooltips
  pokemons.append('title')
    .text(d => `${d.Name} (${d.Type1}${d.Type2 ? '/' + d.Type2 : ''})`);

  // Keyboard navigation for suggestions
  let focusedSuggestionIndex = -1;

  function highlightSuggestion(index) {
    const suggestions = suggestionsDiv.selectAll('div').nodes();
    focusedSuggestionIndex = index;

    suggestions.forEach((suggestion, i) => {
      d3.select(suggestion)
        .style('background', i === index ? '#e0e0e0' : 'white');
    });
  }

  function selectFocusedSuggestion() {
    const suggestions = suggestionsDiv.selectAll('div').nodes();
    if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
      const suggestion = suggestions[focusedSuggestionIndex];
      const pokemonName = suggestion.textContent;
      const pokemon = pokemonData.find(d => d.Name === pokemonName);
      if (pokemon) {
        searchInput.value = pokemon.Name;
        updateSelection(pokemon);
        suggestionsDiv.style('display', 'none');
        focusedSuggestionIndex = -1;
      }
    }
  }

  // Event listeners
  searchInput.addEventListener('input', function() {
    showSuggestions(this.value);
    focusedSuggestionIndex = -1; // Reset focus on input change
  });

  searchInput.addEventListener('focus', function() {
    showSuggestions(this.value || '');
  });

  searchInput.addEventListener('blur', function() {
    setTimeout(() => {
      suggestionsDiv.style('display', 'none');
      focusedSuggestionIndex = -1;
    }, 200);
  });

  searchInput.addEventListener('keydown', function(e) {
    const suggestions = suggestionsDiv.selectAll('div').nodes();
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (focusedSuggestionIndex < suggestions.length - 1) {
        highlightSuggestion(focusedSuggestionIndex + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (focusedSuggestionIndex > 0) {
        highlightSuggestion(focusedSuggestionIndex - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedSuggestionIndex >= 0) {
        selectFocusedSuggestion();
      } else {
        searchPokemon(this.value);
        suggestionsDiv.style('display', 'none');
      }
    } else if (e.key === 'Escape') {
      suggestionsDiv.style('display', 'none');
      focusedSuggestionIndex = -1;
    }
  });

  svg.on('click', function(event) {
    if (event.target === this) {
      updateSelection(null);
    }
  });

  document.addEventListener('click', function(event) {
    if (!event.target.closest('.search-container') && !event.target.closest('div[style*="position: absolute"]')) {
      suggestionsDiv.style('display', 'none');
      focusedSuggestionIndex = -1;
    }
  });

  // Add elements to DOM
  visContainer.append(() => svg.node());
  document.body.appendChild(container.node());
}).catch(console.error);