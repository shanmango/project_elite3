class BarChart {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 600,
      containerHeight: _config.containerHeight || 250,
    };
    this.config.margin = _config.margin || { top: 10, bottom: 50, right: 20, left: 40 };
    this.allTypes = _config.allTypes;
    this.xAxisLabel = _config.xAxisLabel;
    this.yAxisLabel = _config.yAxisLabel;
    this.tooltip = _config.tooltip;

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize X scale and axis
    vis.xScale = d3.scaleBand()
      .domain(allTypes)
      .range([0, vis.width])
      .padding(0.2);

    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickSize(-vis.height)
      .tickPadding(15);

    // Initialize Y scale and axis
    vis.yScale = d3.scaleLinear()
      .domain([0, 40])
      .range([vis.height, 0])
      .nice();

    vis.yAxis = d3.axisLeft(vis.yScale)
      .tickSize(-vis.width)
      .tickPadding(10);

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

    // Initialize chart elements
    const svg = d3.select(vis.config.parentElement);

    svg
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.g = svg.selectAll('.barchart-container').data([null]);
    vis.gEnter = vis.g
      .enter().append('g')
        .attr('class', 'barchart-container');
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
    vis.xAxisG
      .merge(vis.xAxisGEnter)
        .selectAll('text')
          .attr('transform', 'translate(-5,0) rotate(-20)');

    // X axis label
    vis.xAxisLabelText = vis.xAxisGEnter
      .append('text')
        .attr('class', 'axis-label')
        .attr('y', 40)
        .attr('fill', 'black');
    vis.xAxisLabelText
      .merge(vis.xAxisG.select('.axis-label'))
        .attr('x', vis.width / 2)
        .text(vis.xAxisLabel);

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
        .attr('x', -vis.height / 2)
        .text(vis.yAxisLabel);
  }

  update(selectedGenerationTypeCountData) {
    let vis = this;

    vis.data = selectedGenerationTypeCountData[0];
    vis.type2data = selectedGenerationTypeCountData[1];

    vis.render();
  }

  render() {
    let vis = this;

    // Draw chart elements
    const rects = vis.g.merge(vis.gEnter)
      .selectAll('rect.type1').data(vis.data);
    const rectsEnter = rects
      .enter().append('rect')
        .attr('class', 'type1')
        .attr('width', vis.xScale.bandwidth())
        .attr('fill', d => vis.colorScale(d.type))
        .attr('id', d => d.type)
        .attr('rx', 3);
      
    rectsEnter
      .merge(rects)
        .on('mousemove', d => {
          vis.tooltip.updatePosition(d3.event, true);
          vis.tooltip.removeAll();
          vis.tooltip.printLn(`There are ${d.count} Pokemon with ${d.type} as their primary type.`);
        })
        .on('mouseout', d => {
          vis.tooltip.updatePosition(d3.event, false);
        });

    rectsEnter
      .merge(rects)
      .transition().duration(2000)
      .delay((d, i) => i * 10)
        .attr('x', d => vis.xScale(d.type))
        .attr('y', d => vis.yScale(d.count))
        .attr('height', d => vis.height - vis.yScale(d.count));
    rects.exit().remove();
      
        
    const rects2 = vis.g.merge(vis.gEnter)
      .selectAll('rect.type2').data(vis.type2data);
    const rects2Enter = rects2
      .enter().append('rect')
        .attr('class', 'type2')
        .attr('width', vis.xScale.bandwidth())
        .attr('fill', d => vis.colorScale(d.type))
        .attr('opacity', '50%')
        .attr('id', d => d.type)
        .attr('rx', 3);    
      
    rects2Enter
      .merge(rects2)
      .transition().duration(2000)
      .delay((d, i) => i * 10)
        .attr('x', d => vis.xScale(d.type))
        .attr('y', (d, i) => 
              vis.yScale(vis.data[i].count) - (vis.height - vis.yScale(d.count)))
        .attr('height', d => vis.height - vis.yScale(d.count));
      
    rects2Enter
      .merge(rects2)
        .on('mousemove', d => {
          vis.tooltip.updatePosition(d3.event, true);
          vis.tooltip.removeAll();
          vis.tooltip.printLn(`There are ${d.count} Pokemon with ${d.type} as their secondary type.`);
        })
        .on('mouseout', d => {
          vis.tooltip.updatePosition(d3.event, false);
        });
    rects2.exit().remove();
  }
}
