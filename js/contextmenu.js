class ContextMenu {

  menuSelection;

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
    };

    this.initMenu();
  }
  
  initMenu() {
    this.menuSelection = d3.select(this.config.parentElement)
	    .append('div')
		    .attr('class', 'context-menu')
		    .style('visibility', 'hidden');
  }

  updateMenuItems(menuItems) {
    // Remove all existing items
    this.menuSelection.selectAll('*').remove();

    // Add new items and attach listeners
    menuItems.forEach(menuItem => {
      const menuItemTitle = menuItem.title;
      const menuItemCallback = menuItem.callback;

      this.menuSelection
        .append('div')
          .attr('class', 'context-menu-item')
          .text(menuItemTitle)
          .on('click', () => {
            this.setContextMenuVisibility(false);
            menuItemCallback()
          });
    })
  }

  updateMenuPosition = (x, y) => {
    this.menuSelection.style('left', x + 'px');
    this.menuSelection.style('top', y + 'px');
  };

  setContextMenuVisibility = (isVisible) => {
    this.menuSelection.style('visibility', isVisible ? 'visible' : 'hidden');
  }

  // Attach listener to window to hide menu when clicked
  showContextMenu = () => {
    this.setContextMenuVisibility(true);
    window.addEventListener('click', () => {
      this.setContextMenuVisibility(false);
    });
  }
}
