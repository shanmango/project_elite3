class RadialChart {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 600,
      containerHeight: _config.containerHeight || 200,
    };
    this.config.margin = _config.margin || { top: 40, bottom: 25, right: 20, left: 40 };
    this.tooltip = _config.tooltip;

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // referred to https://observablehq.com/@xlanaa/comp-4462-data-visualization-tutorial-8-visualization-wit
    vis.dimensions = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];

    // radial line generator
    vis.radialLine = d3.lineRadial();

    vis.radius = Math.min(vis.config.containerWidth / 2, vis.config.containerHeight / 2);

    // initialize Y scale (for lengths of bars)
    vis.yScale = d3.scaleLinear()
      .domain([0, 255])
      .range([0, vis.radius]);

    const ticks = [50, 100, 150, 200, 255];

    // Initialize color scale, colors from https://bulbapedia.bulbagarden.net/wiki/Category:Type_color_templates
    vis.colorScale = d3.scaleOrdinal()
      .domain(['Grass', 'Fire', 'Water', 'Bug', 'Normal',
        'Poison', 'Electric', 'Ground', 'Fairy', 'Fighting',
        'Psychic', 'Rock', 'Ghost', 'Ice', 'Dragon',
        'Dark', 'Steel', 'Flying'])
      .range(['#78C850', '#F08030', '#6890F0', '#A8B820', '#A8A878',
        '#A040A0', '#F8D030', '#E0C068', '#EE99AC', '#C03028',
        '#F85888', '#B8A038', '#705898', '#98D8D8', '#7038F8',
        '#705848', '#B8B8D0', '#A890F0']);

    // initialize chart elements
    const svg = d3.select(vis.config.parentElement);

    svg
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.g = svg.selectAll('.radialchart-container').data([null]);
    vis.gEnter = vis.g
      .enter().append('g')
        .attr('class', 'radialchart-container');
    vis.gEnter
      .merge(vis.g)
        .attr('transform',
          `translate(0,${vis.config.margin.top})`
        );


    vis.dimensions.forEach((dim, i) => {
      const g = vis.gEnter.merge(vis.g).append('g')
        .attr('transform', `translate(${vis.config.containerWidth / 4 * 3}, ${vis.config.containerHeight / 2}) rotate(${i * 60})`);

      g.append('g')
        .call(d3.axisLeft(vis.yScale).tickFormat('').tickValues(ticks));
      g.append('g')
        .call(d3.axisRight(vis.yScale).tickFormat('').tickValues(ticks));

      // labels
      g.append('text')
        .text(dim)
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(0, -${vis.radius + 10})`);
    });
    
    const rectPadding = 8;
    const pokemonPadding = rectPadding * 2;
    // Sprite image
    svg.append('rect')
        .attr('fill', '#F8F8F8')
        .attr('stroke', '#F5F5F5')
        .attr('x', vis.config.containerWidth / 4 - vis.radius)
        .attr('y', vis.radius / 2)
        .attr('rx', 6)
        .attr('width', vis.radius * 2)
        .attr('height', vis.radius * 2);
      
    vis.radialSprite = svg
      .append('image')
        .attr('class', 'radial-pokemon-sprite')
        .attr('x', vis.config.containerWidth / 4 - vis.radius + rectPadding)
        .attr('y', vis.radius / 2 + rectPadding)
        .attr('width', vis.radius * 2 - pokemonPadding)
        .attr('height', vis.radius * 2 - pokemonPadding);
  }

  update(selectedGenerationData, selectedPokemonName, selectedGeneration) {
    let vis = this;

    vis.selectedPokemonName = selectedPokemonName;
    vis.selectedGeneration = selectedGeneration;

    // use selected pokemon if it exists
    if (vis.selectedPokemonName) {
      // may not be in selected generation if selected from innovative, so use all data
      vis.data = [vis.allData.find(d => d['Name'] === vis.selectedPokemonName)];
    } else {
    // otherwise show the average pokemon for this generation
      let totalHP = 0;
      let totalAttack = 0;
      let totalDefense = 0;
      let totalSpAtk = 0;
      let totalSpDef = 0;
      let totalSpeed = 0;

      selectedGenerationData.forEach(d => {
        totalHP += d['HP'];
        totalAttack += d['Attack'];
        totalDefense += d['Defense'];
        totalSpAtk += d['Sp. Atk'];
        totalSpDef += d['Sp. Def'];
        totalSpeed += d['Speed']; 
      });

      const numPokemon = selectedGenerationData.length;
      vis.data = [{
        'Name': `Avg. Gen. ${vis.selectedGeneration} Pokemon`,
        'Type 1': 'N/A',
        'HP': totalHP / numPokemon,
        'Attack': totalAttack / numPokemon,
        'Defense': totalDefense / numPokemon,
        'Sp. Atk': totalSpAtk / numPokemon,
        'Sp. Def': totalSpDef / numPokemon,
        'Speed': totalSpeed / numPokemon,
        isDefault: true
      }];
    }

    vis.render();
  }

  render() {
    let vis = this;

    // Draw chart elements
    const lines = vis.g.merge(vis.gEnter)
      .selectAll('path').data(vis.data);
    const linesEnter = lines
      .enter().append('path')
        .attr('transform', `translate(${vis.width / 2}, ${vis.height / 2})`);
      
    
    const mergedRadialSprite = vis.g.select('.radial-pokemon-sprite')
    .merge(vis.radialSprite)
    .transition()
       .attr('xlink:href', d => (vis.selectedPokemonName !== null) ? getPokemonSpriteURL(vis.data[0]) : '');
     
    linesEnter
      .merge(lines)
      .transition().duration(1000)
        .attr('d', d => {
          const values = vis.dimensions.concat(['HP']).map(dim => d[dim]);
          const radialValues = values.map((v, i) => [Math.PI * 2 * i / 6, vis.yScale(v)]);
          return vis.radialLine(radialValues);
        })
        .attr('class', 'radial-outline')
        .attr('stroke', d => d.isDefault ? 'gray' : vis.colorScale(d['Type 1']))
        .attr('fill', d => d.isDefault ? 'gray' : vis.colorScale(d['Type 1']))
        .attr('cy', d => vis.yScale(d[vis.yValue]))
        .attr('r', 5);

    linesEnter
      .merge(lines)
        .on('mousemove', d => {
          vis.tooltip.updatePosition(d3.event, true);
          vis.tooltip.removeAll();
          d['Legendary'] && vis.tooltip.printLn('**Legendary**');
          vis.tooltip.printLn(`${d['#'] ? '#' + d['#'] + ' ' : ''}${d['Name']}`);
          vis.tooltip.printLn(`${d['Type 1']}${d['Type 2'] ? '/' + d['Type 2'] : ''}`);
          vis.tooltip.printLn(`${Math.round(d['HP'])} HP`);
          vis.tooltip.printLn(`${Math.round(d['Attack'])} Attack`);
          vis.tooltip.printLn(`${Math.round(d['Defense'])} Defense`);
          vis.tooltip.printLn(`${Math.round(d['Sp. Atk'])} Sp. Atk`);
          vis.tooltip.printLn(`${Math.round(d['Sp. Def'])} Sp. Def`);
          vis.tooltip.printLn(`${Math.round(d['Speed'])} Speed`);
        })
        .on('mouseout', d => {
          vis.tooltip.updatePosition(d3.event, false);
        });
    
  }
}
