class Innovative {

  paths = {
    // Icons from https://icomoon.io/app/#/select
    // All icons are approximately 32px * 32px
    upArrow: "M16 1l-15 15h9v16h12v-16h9z",
    downArrow: "M16 31l15-15h-9v-16h-12v16h-9z",
    deleteIcon: "M31.708 25.708c-0-0-0-0-0-0l-9.708-9.708 9.708-9.708c0-0 0-0 0-0 0.105-0.105 0.18-0.227 0.229-0.357 0.133-0.356 0.057-0.771-0.229-1.057l-4.586-4.586c-0.286-0.286-0.702-0.361-1.057-0.229-0.13 0.048-0.252 0.124-0.357 0.228 0 0-0 0-0 0l-9.708 9.708-9.708-9.708c-0-0-0-0-0-0-0.105-0.104-0.227-0.18-0.357-0.228-0.356-0.133-0.771-0.057-1.057 0.229l-4.586 4.586c-0.286 0.286-0.361 0.702-0.229 1.057 0.049 0.13 0.124 0.252 0.229 0.357 0 0 0 0 0 0l9.708 9.708-9.708 9.708c-0 0-0 0-0 0-0.104 0.105-0.18 0.227-0.229 0.357-0.133 0.355-0.057 0.771 0.229 1.057l4.586 4.586c0.286 0.286 0.702 0.361 1.057 0.229 0.13-0.049 0.252-0.124 0.357-0.229 0-0 0-0 0-0l9.708-9.708 9.708 9.708c0 0 0 0 0 0 0.105 0.105 0.227 0.18 0.357 0.229 0.356 0.133 0.771 0.057 1.057-0.229l4.586-4.586c0.286-0.286 0.362-0.702 0.229-1.057-0.049-0.13-0.124-0.252-0.229-0.357z"
  };

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1200,
      containerHeight: _config.containerHeight || 600,
      verticalPadding: _config.verticalPadding || 30,
      maxTeamSize: _config.maxTeamSize || 6
    }
    this.config.margin = _config.margin || { top: 10, bottom: 10, right: 20, left: 20 };
    this.tooltip = _config.tooltip;
    this.setSelected = _config.setSelected;
    this.updateRadialChart = _config.updateRadialChart;
    this.selectedPokemon = null;
    this.addToTeam1Button = _config.team1Button;
    this.addToTeam2Button = _config.team2Button;

    this.team1Data = [];
    this.team2Data = [];
    this.matchData = [];

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    vis.animationDuration = 1000;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.pokemonContainerVerticalPadding = 15;

    vis.pokemonContainerHeight = (vis.height - 2*vis.config.verticalPadding) / 6 - vis.pokemonContainerVerticalPadding;
    vis.pokemonContainerWidth = vis.width / 4;

    vis.yScale = d3.scaleLinear()
      .domain([0, 5])
      .range([vis.config.verticalPadding, vis.height - vis.config.verticalPadding - vis.pokemonContainerHeight]);

    vis.typeColorScale = d3.scaleOrdinal()
      .domain(['Grass', 'Fire', 'Water', 'Bug', 'Normal',
        'Poison', 'Electric', 'Ground', 'Fairy', 'Fighting',
        'Psychic', 'Rock', 'Ghost', 'Ice', 'Dragon',
        'Dark', 'Steel', 'Flying'])
      .range(['#78C850', '#F08030', '#6890F0', '#A8B820', '#A8A878',
        '#A040A0', '#F8D030', '#E0C068', '#EE99AC', '#C03028',
        '#F85888', '#B8A038', '#705898', '#98D8D8', '#7038F8',
        '#705848', '#B8B8D0', '#A890F0']);

    const lineMargin = 1;

    vis.lineGenerator = d3.line()
      .x(d => {
        if (d.team === 1) {
          return vis.pokemonContainerWidth + lineMargin;
        } else if (d.team === 2) {
          return vis.width - vis.pokemonContainerWidth - lineMargin;
        }
      })
      .y(d => {
        return vis.yScale(d.teamIndex) + vis.pokemonContainerHeight / 2;
      });

    // Initialize chart elements
    const svg = d3.select(vis.config.parentElement);

    svg
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Set background
    const background = svg
      .append('image')
        .attr('xlink:href', 'data/pokemon_stadium_bg.png')
        .attr('class', 'pokemon-stadium-bg')
        .attr('width', vis.width)
        .attr('height', vis.height)

    vis.g = svg.selectAll('.innovative-container').data([null]);
    vis.gEnter = vis.g
      .enter().append('g')
        .attr('class', 'innovative-container');
    vis.gEnter
      .merge(vis.g)
        .attr('transform',
          `translate(${vis.config.margin.left},${vis.config.margin.top})`
        );
  }

  update(processedData, animate = true) {
    let vis = this;

    // Create mapping object for all pokemon
    if (!vis.allPokemonData && processedData) {
      vis.allPokemonData = processedData.reduce((acc, pokemonData) => {
        acc[pokemonData['Name']] = pokemonData;
        return acc;
      }, {});
    }
    this.matchData = vis.matchPokemon(vis.team1Data, vis.team2Data);

    vis.render(animate);
  }

  render(animate) {
    let vis = this;

    // Render team 1 and team 2
    for (let team = 1; team <= 2; team++) {
      let data;
      let selector;
      let xPosition;

      // Set variables depending on team 1 or team 2
      if (team === 1) {
        data = vis.team1Data;
        selector = 'team-1-pokemon';
        xPosition = 0;
      } else if (team === 2) {
        data = vis.team2Data;
        selector = 'team-2-pokemon';
        xPosition = vis.width - vis.pokemonContainerWidth;
      }
      
      // Bind data to group
      vis.teamPokemon = vis.g.merge(vis.gEnter)
        .selectAll('g.' + selector).data(data);
      vis.teamPokemonEnter = vis.teamPokemon
        .enter().append('g')
          .attr('class', selector);

      // Append elements to group
      vis.teamPokemonEnter
        .append('rect')
          .attr('class', 'pokemon-container')
          .attr('width', vis.pokemonContainerWidth)
          .attr('height', vis.pokemonContainerHeight)
          .attr('rx', 6);
      
      // Render move up, move down, delete buttons
      vis.renderButtons(team);

      // Render pokemon sprites
      vis.renderSprites(team);

      // Render match lines
      vis.renderMatches(animate);

      // Set transition depending on whether animate or not
      let mergedGroupSelection;
      if (animate) {
        mergedGroupSelection = vis.teamPokemon
          .merge(vis.teamPokemonEnter)
          .transition().duration(vis.animationDuration);
      } else {
        mergedGroupSelection = vis.teamPokemon
          .merge(vis.teamPokemonEnter)
      }

      // Team update properties (group)
      mergedGroupSelection
          .attr('transform', d => `translate(${xPosition}, ${vis.yScale(d.teamIndex)})`)
          .attr('id', d => d['Name'])
          .attr('class', function(d) {
            if (d['Name'] === vis.selectedPokemon) {
              return $(this).addClass('stadium-selected-pokemon').attr('class'); 
            } else {
              return $(this).removeClass('stadium-selected-pokemon').attr('class');
            }
          })
          .attr('fill', d => {
            return vis.typeColorScale(d['Type 1']);
          });

      // Team interaction properties
      vis.teamPokemon
        .merge(vis.teamPokemonEnter)
          .on('mouseover', function(d) {
            const container = $(this);
            container.addClass('hovered-pokemon');
          })
          .on('mouseout', function(d) {
            const container = $(this);
            container.removeClass('hovered-pokemon');
          })
          .on('click', function(d) {
            vis.onClickSelect(d);
            d3.event.stopPropagation();
          });

      vis.teamPokemon.exit().remove();
    }
  }

  renderButtons(team) {
    let vis = this;

    const buttonScale = vis.pokemonContainerHeight / 200;
    const iconPadding = 8;

    // Append move up arrow
    const upArrow = vis.teamPokemonEnter
      .append('path')
        .attr('class', 'team-pokemon-button move-up-button')
        .attr('d', vis.paths.upArrow)
        .attr('fill', 'black')
        .attr('transform', `scale(${buttonScale})`)

    // Append move down arrow
    const downArrow = vis.teamPokemonEnter
      .append('path')
        .attr('class', 'team-pokemon-button move-down-button')
        .attr('d', vis.paths.downArrow)
        .attr('fill', 'black')
        .attr('transform', `scale(${buttonScale})`)

    // Append delete icon
    const deleteIcon = vis.teamPokemonEnter
      .append('path')
        .attr('class', 'team-pokemon-button delete-button')
        .attr('d', vis.paths.deleteIcon)
        .attr('fill', 'black')
        .attr('transform', `scale(${buttonScale})`);
    
    // Append pokemon name
    const name = vis.teamPokemonEnter
      .append('text')
      .attr('class', 'pokemon-name');

    // Use dimensions after scaling to translate buttons
    if (upArrow.node()) {
      const namePadding = 15;

      const upArrowWidth = upArrow.node().getBoundingClientRect().width;
      const upArrowHeight = upArrow.node().getBoundingClientRect().height;
  
      const deleteIconWidth = deleteIcon.node().getBoundingClientRect().width;
      const deleteIconHeight = deleteIcon.node().getBoundingClientRect().height;

      const deleteButtonXPosition = team === 1 ? upArrowWidth + iconPadding : vis.pokemonContainerWidth - upArrowWidth - deleteIconWidth - iconPadding;
      const arrowButtonsXPosition = team === 1 ? iconPadding : vis.pokemonContainerWidth - upArrowWidth - iconPadding;
      const nameXPosition = team === 1 ? deleteButtonXPosition + deleteIconWidth + namePadding : vis.pokemonContainerHeight + namePadding

      upArrow.attr('transform', `translate(${arrowButtonsXPosition}, ${vis.pokemonContainerHeight/2 - upArrowHeight  - 5}), scale(${buttonScale})`);
      downArrow.attr('transform', `translate(${arrowButtonsXPosition}, ${vis.pokemonContainerHeight/2  + 5}), scale(${buttonScale})`);
      deleteIcon.attr('transform', `translate(${deleteButtonXPosition}, ${vis.pokemonContainerHeight/2 - deleteIconHeight/2}), scale(${buttonScale})`);
      name
        .attr('x', nameXPosition)
        .attr('y', vis.pokemonContainerHeight/2);
    }

    // Update functionality
    vis.teamPokemon.select('path.move-up-button')
      .merge(upArrow)
        .attr('visibility', d => {
          return d.teamIndex === 0 ? 'hidden' : 'visible';
        })
        .on('click', d => {
          vis.moveUp(team, d);
          d3.event.stopPropagation();
        });
    
    vis.teamPokemon.select('path.move-down-button')
      .merge(downArrow)
        .attr('visibility', d => {
          const teamSize = team === 1 ? vis.team1Data.length - 1 : vis.team2Data.length - 1;
          return d.teamIndex === teamSize ? 'hidden' : 'visible';
        })
        .on('click', d => {
          vis.moveDown(team, d);
          d3.event.stopPropagation();
        });

    vis.teamPokemon.select('path.delete-button')
      .merge(deleteIcon)
        .on('click', d => {
          vis.removePokemon(team, d.teamIndex);
          const team1HasSelectedPokemon = vis.team1Data.filter(pokemon => pokemon['Name'] === vis.selectedPokemon).length > 0
          const team2HasSelectedPokemon = vis.team2Data.filter(pokemon => pokemon['Name'] === vis.selectedPokemon).length > 0
          if (!team1HasSelectedPokemon && !team2HasSelectedPokemon) {
            vis.setSelected(null, null);
            vis.updateRadialChart();
          }
          d3.event.stopPropagation();
        });

    vis.teamPokemon.select('text.pokemon-name')
        .merge(name)
          .text(d => formatName(d['Name']));
  }

  renderSprites(team) {
    let vis = this;
    const rectPadding = 8;
    const pokemonPadding = rectPadding * 2;
    
    // Place a background behind pokemon sprite
    const spriteBackground = vis.teamPokemonEnter
      .append('rect')
      .attr('class', 'sprite-background');
    
    const mergedBackgrounds = vis.teamPokemon.select('rect.sprite-background')
      .merge(spriteBackground)
        .attr('width', vis.pokemonContainerHeight - rectPadding)
        .attr('height', vis.pokemonContainerHeight - rectPadding)
        .attr('fill', 'white')
        .attr('rx', 6)
        .attr('y', rectPadding/2)
        .attr('x', d => team === 1 ? vis.pokemonContainerWidth - vis.pokemonContainerHeight + rectPadding/2 : rectPadding/2);

    // Append sprite
    const pokemonSprite = vis.teamPokemonEnter
      .append('image')
        .attr('class', 'team-pokemon-sprite');

    // Update
    const mergedPokemonSprite = vis.teamPokemon.select('image.team-pokemon-sprite')
      .merge(pokemonSprite)
        .attr('width', vis.pokemonContainerHeight - pokemonPadding)
        .attr('height', vis.pokemonContainerHeight - pokemonPadding)
        .attr('y', pokemonPadding/2)
        .attr('x', d => team === 1 ? vis.pokemonContainerWidth - vis.pokemonContainerHeight + pokemonPadding/2 : pokemonPadding/2)
        .attr('xlink:href', d => getPokemonSpriteURL(d));
  }

  renderMatches(animate) {
    let vis = this;

    // Append
    vis.matches = vis.g.merge(vis.gEnter)
      .selectAll('path.pokemon-match').data(vis.matchData);

    vis.matchesEnter = vis.matches
      .enter().append('path')
        .attr('class', 'pokemon-match');

    // Animate or not
    let selection;
    if (animate) {
      selection = vis.matches
        .merge(vis.matchesEnter)
        .transition().duration(vis.animationDuration);
    } else {
      selection = vis.matches
        .merge(vis.matchesEnter)
    }
      
    // Update properties
    selection
      .attr('d', d => {
          return vis.lineGenerator(d.match)
      })
      .attr('stroke-width', 3)
      .attr('stroke', 'gray')

    // Interaction
    vis.matches
      .merge(vis.matchesEnter)
        .on('mouseout', function(d) {
          const line = $(this)
          line.removeClass('hovered-match');
        })
        .on('mouseover', function(d) {
          const line = $(this);
          line.addClass('hovered-match');
        });

    // Exit
    vis.matches.exit().remove();
  }

  addPokemon(team, pokemonName) {
    let vis = this;

    let team1Size = vis.team1Data.length;
    let team2Size = vis.team2Data.length;
    
    // Add to team 1
    if (team === 1 && team1Size < vis.config.maxTeamSize) {
      const pokemonData = Object.assign({}, vis.allPokemonData[pokemonName]);
      pokemonData.teamIndex = team1Size;
      vis.team1Data.push(pokemonData);
      team1Size++;

    // Add to team 2
    } else if (team === 2 && team2Size < vis.config.maxTeamSize) {
      const pokemonData = Object.assign({}, vis.allPokemonData[pokemonName]);
      pokemonData.teamIndex = team2Size;
      vis.team2Data.push(pokemonData);
      team2Size++;
    }

    if (team1Size >= vis.config.maxTeamSize) {
      vis.addToTeam1Button.attr('disabled', true);
    }
    if (team2Size >= vis.config.maxTeamSize) {
      vis.addToTeam2Button.attr('disabled', true);
    }
    vis.update();
  }

  removePokemon(team, teamIndex) {
    let vis = this;

    // Remove from team 1
    if (team === 1) {
      const arrayIndex = vis.team1Data.findIndex(data => data.teamIndex === teamIndex);
      vis.team1Data.splice(arrayIndex, 1);
      vis.team1Data.forEach(pokemonData => {
        if (pokemonData.teamIndex > teamIndex) {
          pokemonData.teamIndex -= 1;
        }
      });

      vis.addToTeam1Button.removeAttr('disabled');

    } else if (team === 2) {
      // Remove from team 2
      const arrayIndex = vis.team2Data.findIndex(data => data.teamIndex === teamIndex);
      vis.team2Data.splice(arrayIndex, 1);
      vis.team2Data.forEach(pokemonData => {
        if (pokemonData.teamIndex > teamIndex) {
          pokemonData.teamIndex -= 1;
        }
      });

      vis.addToTeam2Button.removeAttr('disabled');

    }

    vis.update(undefined, false);
  }

  // Shift pokemon down
  moveDown(team, pokemonData) {
    let vis = this;
    let pokemonToSwap;

    const teamIndex = pokemonData.teamIndex;

    if (team === 1) {
      pokemonToSwap = vis.team1Data.find((pokemonData) => {
        return pokemonData.teamIndex === teamIndex + 1;
      });
    } else if (team === 2) {
      pokemonToSwap = vis.team2Data.find((pokemonData) => {
        return pokemonData.teamIndex === teamIndex + 1;
      });
    }

    pokemonData.teamIndex = teamIndex + 1;
    pokemonToSwap.teamIndex = teamIndex;

    vis.update();
  }

  // Shift pokemon up
  moveUp(team, pokemonData) {
    let vis = this;
    let pokemonToSwap;

    const teamIndex = pokemonData.teamIndex;

    if (team === 1) {
      pokemonToSwap = vis.team1Data.find((pokemonData) => {
        return pokemonData.teamIndex === teamIndex - 1;
      });
    } else if (team === 2) {
      pokemonToSwap = vis.team2Data.find((pokemonData) => {
        return pokemonData.teamIndex === teamIndex - 1;
      });
    }

    pokemonData.teamIndex = teamIndex - 1;
    pokemonToSwap.teamIndex = teamIndex;

    vis.update();
  }

  onClickSelect(d) {
    let vis = this;

    if (d['Name'] !== vis.selectedPokemon) {
      vis.setSelected(d['Name'], vis.allPokemonData[d['Name']]);
      vis.updateRadialChart();
    } else {
      vis.setSelected(null, null);
      vis.updateRadialChart();
    }
  }

  /**
  * Takes 2 teams of Pokemon and returns recommendation and rationale behind recommendation
  * Number of lines = team 2's size
  * Params:
  * team1: array of Pokemon objects
  * team2: array of Pokemon objects
  * Returns: 
  * array of object{ int index1, int index2, string reason }
  *   - Interpret as team1[index1] should attack team2[index2]
  *     because reason.
  */
 matchPokemon(team1, team2) {
      let vis = this;
      // Empty team edge case
      if (team2 === undefined || team2.length === 0 || team1 === undefined || team1.length === 0) {
          return [];
      }
      
      let opponent = team2;
      let you = team1;
      let result = [];
      
      // statDiffArray: [opponent][you] = statDiff
      let statDiffArray = [...Array(opponent.length)].map(x=>Array(you.length).fill(0));

      // Get the difference in stats for each pokemon and store it in the array
      let opIndex = 0;
      opponent.forEach(op => {
          let uIndex = 0;
          you.forEach(u => {
              statDiffArray[opIndex][uIndex] = (u.Total + vis.calculateTypeAdvantage(u, op)) - op.Total;
              uIndex++;
          });
          opIndex++;
      });
      
      opIndex = 0;
      statDiffArray.forEach(op => {
          let maxIndex = op.indexOf(Math.max(...op));
          result.push({
              match: [{team: 1, teamIndex: you[maxIndex].teamIndex}, {team: 2, teamIndex: opponent[opIndex].teamIndex}], reason: " "
          })
          opIndex++;
      });
      
      return result;
  }

calculateTypeAdvantage(attacker, defender) {
      let vis = this;
      let attackerTypeIDOne = vis.typeNames.indexOf(attacker['Type 1'].toLowerCase());
      let attackerTypeIDTwo, defenderTypeIDTwo;
      let defenderTypeIDOne = vis.typeNames.indexOf(defender['Type 1'].toLowerCase());
      let multiplier = vis.typeEffArray[attackerTypeIDOne][defenderTypeIDOne];
      
      let attackerTypeTwoExists = false;
      let defenderTypeTwoExists = false;
      
      // Check if pokemon have a second type
      if (attacker['Type 2'] !== 0) {
          attackerTypeIDTwo = vis.typeNames.indexOf(attacker['Type 2'].toLowerCase());
          attackerTypeTwoExists = true;
      }
      
      if (defender['Type 2'] !== 0) {
          defenderTypeIDTwo = vis.typeNames.indexOf(defender['Type 2'].toLowerCase());
          defenderTypeTwoExists = true;
      }
      
      // If they have second type, add that to multiplier calculation
      if (attackerTypeTwoExists) { multiplier *= vis.typeEffArray[attackerTypeIDTwo][defenderTypeIDOne]; }
      if (defenderTypeTwoExists) { multiplier *= vis.typeEffArray[attackerTypeIDOne][defenderTypeIDTwo]; }    
      if (attackerTypeTwoExists && defenderTypeTwoExists) { 
          multiplier *= vis.typeEffArray[attackerTypeIDTwo][defenderTypeIDTwo];
      }
      
      let totalAttack = attacker['Attack'] + attacker['Sp. Atk'] 
      let statBoost = totalAttack * multiplier - totalAttack;
      return statBoost;
  }

}
