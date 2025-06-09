// Load your data here from a local csv file
d3.csv('./data/pokemon_data.csv').then(pokemonData => {
  // Set dimensions with margin
  const margin = 10;
  const width = 800;
  const height = 800;

  // get pokemon names 
  const pokemonNames = pokemonData.map(d => d.Name);

  // color scale for Pokemon types
  colorScale = d3.scaleOrdinal()
    .domain(pokemonData.map(d => d.Type1))
    .range(d3.schemeCategory10);

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

  // Create search input
  const searchDiv = inputContainer.append('div')
    .style('flex-grow', '1')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('position', 'relative');

  const searchInput = searchDiv.append('input')
    .attr('type', 'text')
    .attr('placeholder', 'Search Pokemon...')
    .style('padding', '8px')
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('width', '100%')
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
    .text('Pokemon not found!');

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

  // Pokemon type colors
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
    .range([2, 8]);

  // Color scale for Pokemon types
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
      .duration(500)
      .attr('fill', d => (d.Type1 === type || d.Type2 === type) ? color(d.Type1) : '#ddd')
      .attr('opacity', d => (d.Type1 === type || d.Type2 === type) ? 1 : 0.7);
  }

  // Function to reset all colors to original
  function resetAllColors() {
    svg.selectAll('circle')
      .transition()
      .duration(500)
      .attr('fill', d => color(d.Type1))
      .attr('opacity', 0.8);
  }

  // Function to show suggestions
  function showSuggestions(query) {
    suggestionsDiv.style('display', 'none');
    notFoundMessage.style('display', 'none');
    
    if (!query || query.trim() === '') return;
    
    const lowerQuery = query.toLowerCase().trim();
    const matches = pokemonData.filter(d => 
      d.Name.toLowerCase().startsWith(lowerQuery)
    );
    
    if (matches.length > 0) {
      suggestionsDiv.html('');
      
      matches.slice(0, 5).forEach(pokemon => {
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
    } else {
      notFoundMessage.style('display', 'block');
    }
  }

  // Function to search Pokemon
  function searchPokemon(query) {
    suggestionsDiv.style('display', 'none');
    notFoundMessage.style('display', 'none');
    
    if (!query || query.trim() === "") {
      updateSelection(null);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    const foundPokemon = pokemonData.find(d => 
      d.Name.toLowerCase() === lowerQuery
    );
    
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

  // Function to show Pokemon details
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
          { name: "Sp_Atk", value: +pokemon['Sp. Atk'] || 0 }
        ]},
        { name: "Defensive", children: [
          { name: "Defense", value: +pokemon.Defense },
          { name: "Sp_Def", value: +pokemon['Sp. Def'] || 0 }
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
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="margin-bottom: 10px;">Base Stats</h3>
          <div id="sunburst-chart" style="width: 100%; height: 200px;"></div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3 style="margin-bottom: 10px;">Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; border-bottom: 1px solid #eee;">HP</td><td style="text-align: right; border-bottom: 1px solid #eee;">${pokemon.HP}</td></tr>
            <tr><td style="padding: 5px 0; border-bottom: 1px solid #eee;">Attack</td><td style="text-align: right; border-bottom: 1px solid #eee;">${pokemon.Attack}</td></tr>
            <tr><td style="padding: 5px 0; border-bottom: 1px solid #eee;">Defense</td><td style="text-align: right; border-bottom: 1px solid #eee;">${pokemon.Defense}</td></tr>
            <tr><td style="padding: 5px 0; border-bottom: 1px solid #eee;">Sp. Attack</td><td style="text-align: right; border-bottom: 1px solid #eee;">${pokemon.Sp_Attack}</td></tr>
            <tr><td style="padding: 5px 0; border-bottom: 1px solid #eee;">Sp. Defense</td><td style="text-align: right; border-bottom: 1px solid #eee;">${pokemon.Sp_Defense}</td></tr>
            <tr><td style="padding: 5px 0; border-bottom: 1px solid #eee;">Speed</td><td style="text-align: right; border-bottom: 1px solid #eee;">${pokemon.Speed}</td></tr>
          </table>
        </div>
      </div>
    `);

    // Render sunburst chart
    setTimeout(() => {
      const sunburstWidth = 200;
      const sunburstHeight = 200;
      const radius = Math.min(sunburstWidth, sunburstHeight) / 2;
      
      const svgSunburst = d3.select("#sunburst-chart")
        .append("svg")
        .attr("width", sunburstWidth)
        .attr("height", sunburstHeight)
        .append("g")
        .attr("transform", `translate(${sunburstWidth/2},${sunburstHeight/2})`);
      
      const partition = data => {
        const root = d3.hierarchy(data)
          .sum(d => d.value || 0)
          .sort((a, b) => b.value - a.value);
        return d3.partition()
          .size([2 * Math.PI, radius])
          (root);
      };
      
      const root = partition(statsData);
      const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);
      
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
        .attr("stroke-width", 0.5);
    }, 0);

    visContainer.append(() => detailPanel.node());
  }

  // Create Pokemon circles with initial random positions
  const pokemons = svg
    .selectAll('circle')
    .data(pokemonData)
    .join('circle')
      .attr('r', d => size(+d.HP))
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
        const pos = getRandomPosition(size(+d.HP));
        d.originalX = pos.x;
        d.originalY = pos.y;
        d3.select(this)
          .attr('cx', pos.x)
          .attr('cy', pos.y);
      });

  // Add tooltips
  pokemons.append('title')
    .text(d => `${d.Name} (${d.Type1}${d.Type2 ? '/' + d.Type2 : ''})`);

  // Event listeners
  searchInput.addEventListener('input', function() {
    showSuggestions(this.value);
  });

  searchInput.addEventListener('focus', function() {
    showSuggestions(this.value);
  });

  searchInput.addEventListener('blur', function() {
    setTimeout(() => {
      suggestionsDiv.style('display', 'none');
    }, 200);
  });

  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchPokemon(this.value);
      suggestionsDiv.style('display', 'none');
    }
  });

  svg.on('click', function(event) {
    if (event.target === this) {
      updateSelection(null);
    }
  });

  document.addEventListener('click', function(event) {
    if (!event.target.closest('.search-container')) {
      suggestionsDiv.style('display', 'none');
    }
  });

  // Add elements to DOM
  visContainer.append(() => svg.node());
  document.body.appendChild(container.node());
}).catch(console.error);