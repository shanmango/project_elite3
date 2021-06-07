class ScatterPlot {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 600,
      containerHeight: _config.containerHeight || 600,
    };
    this.config.margin = _config.margin || { top: 10, bottom: 45, right: 20, left: 40 };
    this.xValue = _config.xValue;
    this.yValue = _config.yValue;
    this.tooltip = _config.tooltip;

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleLinear()
      .domain([0, 255])
      .range([0, vis.width])
      .nice();

    vis.yScale = d3.scaleLinear()
      .domain([0, 255])
      .range([vis.height, 0])
      .nice();

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

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickSize(-vis.height)
      .tickPadding(15);

    vis.yAxis = d3.axisLeft(vis.yScale)
      .tickSize(-vis.width)
      .tickPadding(10);

    // Initialize chart elements
    const svg = d3.select(vis.config.parentElement);

    svg
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.g = svg.selectAll('.scatterplot-container').data([null]);
    vis.gEnter = vis.g
      .enter().append('g')
        .attr('class', 'scatterplot-container');
    vis.gEnter
      .merge(vis.g)
        .attr('transform',
          `translate(${vis.config.margin.left},${vis.config.margin.top})`
        );

    // X axis group
    vis.xAxisG = vis.g.select('.x-axis');
    vis.xAxisGEnter = vis.gEnter
      .append('g')
        .attr('class', 'x-axis');
    vis.xAxisG
      .merge(vis.xAxisGEnter)
        .attr('transform', `translate(0,${vis.height})`)
        .call(vis.xAxis)
        .selectAll('.domain').remove();

    // X axis label
    vis.xAxisLabelText = vis.xAxisGEnter
      .append('text')
        .attr('class', 'axis-label')
        .attr('y', 40)
        .attr('fill', 'black');
    vis.xAxisLabelText
      .merge(vis.xAxisG.select('.axis-label'))
        .attr('x', vis.width / 2);

    // Y axis group
    vis.yAxisG = vis.g.select('.y-axis');
    vis.yAxisGEnter = vis.gEnter
      .append('g')
        .attr('class', 'y-axis');
    vis.yAxisG
      .merge(vis.yAxisGEnter)
        .call(vis.yAxis)
        .selectAll('.domain').remove();

    // Y axis label
    vis.yAxisLabelText = vis.yAxisGEnter
      .append('text')
        .attr('class', 'axis-label')
        .attr('y', -30)
        .attr('fill', 'black')
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle');
    vis.yAxisLabelText
      .merge(vis.yAxisG.select('.axis-label'))
        .attr('x', -vis.height / 2);
  }

  update(selectedStat1, selectedStat2, selectedGenerationData, selectedPokemonName, selectedGeneration) {
    let vis = this;

    let generationChanged = vis.selectedGeneration !== selectedGeneration;

    vis.xValue = selectedStat2;
    vis.yValue = selectedStat1;
    vis.data = selectedGenerationData;
    vis.selectedPokemonName = selectedPokemonName;
    vis.selectedGeneration = selectedGeneration;

    vis.render(generationChanged);
  }

  render(generationChanged) {
    let vis = this;

    // Update axis labels
    vis.xAxisLabelText
      .merge(vis.xAxisG.select('.axis-label'))
        .text(vis.xValue);
    vis.yAxisLabelText
      .merge(vis.yAxisG.select('.axis-label'))
        .text(vis.yValue);

    // Draw chart elements
    const circles = vis.g.merge(vis.gEnter)
      .selectAll('circle').data(vis.data);
    const circlesEnter = circles
      .enter().append('circle')
        .attr('cx', vis.width / 2)
        .attr('cy', vis.height / 2)
        .attr('r', 0)
        .attr('fill', 'black');
    const circlesMerged = circlesEnter.merge(circles);

    circlesMerged
      .on('mousemove', d => {
        vis.tooltip.updatePosition(d3.event, true);
        vis.tooltip.removeAll();
        d['Legendary'] && vis.tooltip.printLn('**Legendary**');
        vis.tooltip.printLn(`#${d['#']} ${formatName(d['Name'])}`);
        vis.tooltip.printLn(`${d['Type 1']}${d['Type 2'] ? '/' + d['Type 2'] : ''}`);
      })
      .on('mouseout', d => {
        vis.tooltip.updatePosition(d3.event, false);
      });

    circlesMerged
      .attr('id', d => d['Name'])
      .attr('class', d => `${d['Type 1']} ${d['Type 2']}`);

    // Keep selected if not changing generations
    if (!generationChanged) {
      circlesMerged
        .attr('class', function(d) {
          if (vis.selectedPokemonName === d['Name']) {
            return $(this).attr('class') + ' selected-pokemon';
          }
          else {
            return $(this).attr('class');
          }
        })
    }
    

    circlesMerged
      .transition().duration(1000)
      .delay((d, i) => i * 10)
        .attr('cx', d => vis.xScale(d[vis.xValue]))
        .attr('cy', d => vis.yScale(d[vis.yValue]))
        .attr('r', 5)
        .attr('fill', d => vis.colorScale(d['Type 1']))
        .on('end', function(d) {
          if (vis.selectedPokemonName === d['Name']) {
            $(this).addClass('selected-pokemon');
          } else {
            $(this).removeClass('selected-pokemon');
          }
        })

    circles.exit()
      .transition().duration(1000)
      .delay((d, i) => i * 10)
        .remove();
  }
}
