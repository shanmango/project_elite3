class Tooltip {

  tooltipSelection;
  tooltipOffset = 10;

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
    };

    this.initMenu();
  }
  
  initMenu() {
    this.tooltipSelection = d3.select(this.config.parentElement)
	    .append('div')
		    .attr('class', 'pokestats-tooltip')
		    .style('visibility', 'hidden');
  }

  // Move tooltip position
  updatePosition = (event, isVisible) => {
    const x = event.pageX + this.tooltipOffset;
    const y = event.pageY + this.tooltipOffset;
    this.tooltipSelection.style('left', x + 'px');
    this.tooltipSelection.style('top', y + 'px');
    this.tooltipSelection.style('visibility', isVisible ? 'visible' : 'hidden');
  };
  
  // Add line to tooltip
  printLn = (text) => {
    this.tooltipSelection.append('span').text(text);
    this.tooltipSelection.append('br');
  };
  
  // Remove all tooltip items
  removeAll = () => {
    this.tooltipSelection.selectAll('*').remove();
  };
}
