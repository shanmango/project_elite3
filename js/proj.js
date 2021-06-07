// Initialize charts
let scatterplot;
let barchart;
let radialchart;
let innovative;

let processedData;
let allTypes;

// Dropdown and Select variables
let selectedStat1 = 'HP';
let selectedStat2 = 'Speed';
let selectedGeneration = '1';

// UI interaction variables
let hoveredType = null;
// Type 2 support
let hoveredType2 = null;
let hoveredPokemon = null;
let hoveredPokemon2 = null;
let selectedPokemon = null;
let selectedPokemonName = null;
let selectedPokemonInnovative = null;

let scatterplotCircles = null;
let barchartRects = null;
// Type 2 support
let barchartRects2 = null;
let scatterTitle = $('.chart-title.scatterplot');
let radialTitle = $('.chart-title.radialchart');

// Initialize custom context menu and tooltip
const contextMenu = new ContextMenu({
	parentElement: '.pokestats-container'
});

const tooltip = new Tooltip({
	parentElement: '.pokestats-container'
});

// Innovative buttons
const pokemonDropdown = $('#pokemon-select');
const team1Button = $('#pokemon-add-button-1');
const team2Button = $('#pokemon-add-button-2');

// Load data
Promise.all([
    d3.csv('data/Pokemon.csv'),
    d3.csv('data/types.csv'),
    d3.csv('data/type_efficacy.csv')
]).then(files => {
    let data = files[0];
    let types = files[1];
    let typeEff = files[2];
	// Process data - change values to numbers or booleans as necessary
	data.forEach(d => {
		Object.keys(d).forEach(property => {
			if (!isNaN(d[property])) {
					d[property] = +d[property];
			}
			if (property === 'Legendary') {
				d[property] = d[property] === 'True';
			}
		});	
	});
    
    let typeNames = [];
    
    // Data for innovative.js
    types.forEach(d => {
        typeNames[+d.id] = d.identifier;

    });
    
    typeEff.forEach(d => {
        const columns = Object.keys(d)
        for (const col of columns) {
            d[col] = +d[col];
        }
    });
    
    let typeEffArray = [...Array(19)].map(x=>Array(19).fill(0));
    
    typeEff.forEach(d => {
       typeEffArray[d.damage_type_id][d.target_type_id] = d.damage_factor/100; 
    });


	processedData = data;
	// All types, remove duplicates then alphabetize
	allTypes = [... new Set(processedData.map(d => d['Type 1']))].sort();

	// Instantiate charts with necessary config
	scatterplot = new ScatterPlot({
		parentElement: '#scatterplot',
		xValue: selectedStat2,
		yValue: selectedStat1,
		tooltip: tooltip
	});

	barchart = new BarChart({
		parentElement: '#barchart',
		allTypes,
		xAxisLabel: 'Type',
		yAxisLabel: 'Number of Pokemon',
		tooltip: tooltip
	});

	radialchart = new RadialChart({
		parentElement: '#radialchart',
		tooltip: tooltip
	});

	innovative = new Innovative({
		parentElement: '#innovative',
		tooltip: tooltip,
		setSelected: setSelectedInnovative,
		updateRadialChart: updateRadialChart,
		team1Button: team1Button,
		team2Button: team2Button
	});
    
    // Add additional datasets to innovative
    innovative.typeNames = typeNames;
    innovative.typeEffArray = typeEffArray;
    
	// Update charts
	const selectedGenerationData = getSelectedGenerationData();
	scatterplot.update(selectedStat1, selectedStat2, selectedGenerationData, selectedPokemonName, selectedGeneration);
	barchart.update(getTypeCountData(selectedGenerationData));
	radialchart.update(selectedGenerationData, selectedPokemonName, selectedGeneration);
	radialchart.allData = processedData; // we need this to allow linking of innovative with radial chart
	innovative.update(processedData);

	// Listen to UI events - scatterplot and barchart
	barchartRects = $('#barchart .type1');
    // Type 2 support
	barchartRects2 = $('#barchart .type2');
	updateScatterplotCircleEventListeners();
	initializeBarchartRectEventListeners();

	// Listen to dropdowns
	$('#stat1-select').change(function() {
		selectedStat1 = $(this).val();
		scatterTitle.text(`${selectedStat1} vs. ${selectedStat2}`);
		scatterplot.update(selectedStat1, selectedStat2, getSelectedGenerationData(), selectedPokemonName, selectedGeneration);
	});
	$('#stat2-select').change(function() {
		selectedStat2 = $(this).val();
		scatterTitle.text(`${selectedStat1} vs. ${selectedStat2}`);
		scatterplot.update(selectedStat1, selectedStat2, getSelectedGenerationData(), selectedPokemonName, selectedGeneration);
	});

	// Listen to slider and play button
	const slider = $('#generation-slider');
	const sliderText = $('#generation-selection');
	const button = $('#play-button');
	let timer;

	slider.on('input', function() {
		selectedGeneration = slider.val();
		sliderText.text(selectedGeneration);

		selectedPokemon = null;
		selectedPokemonName = null;
		setSelectedInnovative(null, null);

		onSliderUpdate();
		updateRadialChart();
	});

	button.on('click', function() {
	  if (button.text() === 'Play') {
	    if (+slider.val() === 5) {
	      // reset generation to 1 first
	      selectedGeneration = '1';
	      slider.val(selectedGeneration);
	      sliderText.text(selectedGeneration);

	      const selectedGenerationData = getSelectedGenerationData();
	      scatterplot.update(selectedStat1, selectedStat2, selectedGenerationData, selectedPokemonName, selectedGeneration);
	      barchart.update(getTypeCountData(selectedGenerationData));
	      updateScatterplotCircleEventListeners();

	      selectedPokemon = null;
		  selectedPokemonName = null;
		  radialTitle.text(`Average Generation ${selectedGeneration} Pokemon's Stats`);
		  radialchart.update(selectedGenerationData, selectedPokemonName, selectedGeneration);
	    }
	    timer = setInterval(incrementSelectedGeneration, 3000);
	    button.text('Pause');
	  } else {
	    clearInterval(timer);
	    button.text('Play');
	  }
	});

	// Set up innovative view dropdown/buttons

	processedData
		.filter(d => {
			return d['Generation'] <= 5
		})
		.sort((d1, d2) => {
			return d1['Name'] < d2['Name'] ? -1 : 1;
		})
		.forEach(d => {
		pokemonDropdown.append($('<option>', {
			value: d['Name'],
			text: formatName(d['Name'])
		}))});

	team1Button.on('click', function() {
		const pokemonName = pokemonDropdown.val();
		innovative.addPokemon(1, pokemonName);
	});

	team2Button.on('click', function() {
		const pokemonName = pokemonDropdown.val();
		innovative.addPokemon(2, pokemonName);
	})

	const incrementSelectedGeneration = () => {
	  const newVal = +slider.val() + 1;
	  if (newVal < 6) {
	  	selectedGeneration = newVal;
	    slider.val(newVal);
	    sliderText.text(newVal);

	    const selectedGenerationData = getSelectedGenerationData();
		scatterplot.update(selectedStat1, selectedStat2, selectedGenerationData, selectedPokemonName, selectedGeneration);
		barchart.update(getTypeCountData(selectedGenerationData));
	    updateScatterplotCircleEventListeners();

	    selectedPokemon = null;
		selectedPokemonName = null;
		radialTitle.text(`Average Generation ${selectedGeneration} Pokemon's Stats`);
		radialchart.update(selectedGenerationData, selectedPokemonName, selectedGeneration);
	  } else {
	    clearInterval(timer);
	    button.text('Play');
	  }
	};
    
});

// data helpers
const getSelectedGenerationData = () => {
	return processedData.filter(d => d['Generation'] === +selectedGeneration);
};

const getTypeCountData = (selectedData) => {
    // Type 2 support added to function
	const typeCountMap = {};
	const type2CountMap = {};

	allTypes.forEach(k => {
		typeCountMap[k] = 0;
        type2CountMap[k] = 0;
	});

	selectedData.map(d => {
		const type = d['Type 1'];
		const type2 = d['Type 2'];
		typeCountMap[type] += 1;
		type2CountMap[type2] += 1;
	});

	const type1CountData = [];
	const type2CountData = [];
	allTypes.forEach(k => {
		type1CountData.push({
			type: k,
			count: typeCountMap[k]
		});
        type2CountData.push({
			type: k,
			count: type2CountMap[k]
		});
	});
    const typeCountData = [type1CountData, type2CountData];
	return typeCountData;
};

// UI helpers
const onSliderUpdate = function() {
	const selectedGenerationData = getSelectedGenerationData();
	scatterplot.update(selectedStat1, selectedStat2, selectedGenerationData, selectedPokemonName, selectedGeneration);
	barchart.update(getTypeCountData(selectedGenerationData));
	innovative.update();
	updateScatterplotCircleEventListeners();
}

const updateScatterplotCircleEventListeners = () => {
	scatterplotCircles = $('#scatterplot circle');

	scatterplotCircles.off('mouseover');
	scatterplotCircles.off('mouseout');
	scatterplotCircles.off('click');

	// scatterplot circle hover
	scatterplotCircles.on('mouseover', function() {
		hoveredType = this.className.baseVal.split(' ')[0];
		hoveredPokemon = $(`.${hoveredType}`);
        // Filter out Pokemon with hoveredType as secondary type
        hoveredPokemon = hoveredPokemon.filter(d => {
            let pokemonType1 = hoveredPokemon[d].className.baseVal.split(' ')[0];
            return pokemonType1 === hoveredType;
        });
		hoveredPokemon.addClass('hovered-type');
		barchartRects.each((i, r) => {
			if (r.id === hoveredType) {
				$(r).addClass('hovered-type');
			}
		});
        
        // Type 2 support. Find pokemon with ONLY the same secondary type.
        hoveredType2 = this.className.baseVal.split(' ')[1];
        if (hoveredType2 !== '0') {
            hoveredPokemon2 = $(`.${hoveredType2}`);
            // Filter out Pokemon with hoveredType2 as primary type
            hoveredPokemon2 = hoveredPokemon2.filter(d => {
                let pokemonType2 = hoveredPokemon2[d].className.baseVal.split(' ')[1];
                return hoveredType2 === pokemonType2;
            });
            hoveredPokemon2.addClass('hovered-type2');
            barchartRects2.each((i, r) => {
                if (r.id === hoveredType2) {
                    $(r).addClass('hovered-type2');
                }
            });
        } else {
            hoveredType2 = null;
        }
        
	});

	scatterplotCircles.on('mouseout', function() {
		barchartRects.each((i, r) => {
			if (r.id === hoveredType) {
				$(r).removeClass('hovered-type');
			}
		});
		hoveredPokemon && hoveredPokemon.removeClass('hovered-type');
		hoveredPokemon = null;
		hoveredType = null;
        
        barchartRects2.each((i, r) => {
            if (r.id === hoveredType2) {
                $(r).removeClass('hovered-type2');
            }
        });
        hoveredPokemon2 && hoveredPokemon2.removeClass('hovered-type2');
        hoveredPokemon2 = null;
        hoveredType2 = null;
	});

	// scatterplot click
	scatterplotCircles.on('click', function() {
		setSelectedInnovative(null, null, false);

		// Select only if different
		if (selectedPokemon !== this) {
			setSelectedScatterplot(this);
		} else {
			setSelectedScatterplot(null);
		}
		updateRadialChart();
	});

	// scatterplot contextmenu
	scatterplotCircles.on('contextmenu', function(event) {
		event.preventDefault();
		const clickedPokemon = this;
		const clickedPokemonName = clickedPokemon.id;

		const addToTeam1MenuItem = {
			title: 'Add to your team',
			callback: () => {
				innovative.addPokemon(1, clickedPokemonName);
			}
		}

		const addToTeam2MenuItem = {
			title: 'Add to opponent team',
			callback: () => {
				innovative.addPokemon(2, clickedPokemonName);
			}
		}

		contextMenu.updateMenuPosition(event.pageX, event.pageY);
		contextMenu.updateMenuItems([addToTeam1MenuItem, addToTeam2MenuItem]);
		contextMenu.showContextMenu();
	});
};

const initializeBarchartRectEventListeners = () => {
	// barchart rect hover
	barchartRects.on('mouseover', function() {
		hoveredType = this.id;
		hoveredPokemon = $(`.${hoveredType}`);
        // Filter out Pokemon with hoveredType as type2
        hoveredPokemon = hoveredPokemon.filter((d, i) => {
            let pokemonType1 = hoveredPokemon[d].className.baseVal.split(' ')[0];
            return pokemonType1 === hoveredType;
        });
		$(this).addClass('hovered-type');
		hoveredPokemon.addClass('hovered-type');
    });
    
    // Type 2 support
    barchartRects2.on('mouseover', function() {
        hoveredType2 = this.id;
        hoveredPokemon2 = $(`.${hoveredType2}`);
        // Filter out Pokemon with hoveredType2 as primary type
        hoveredPokemon2 = hoveredPokemon2.filter(d => {
            let pokemonType2 = hoveredPokemon2[d].className.baseVal.split(' ')[1];
            return hoveredType2 === pokemonType2;
        });
        $(this).addClass('hovered-type2');
        hoveredPokemon2.addClass('hovered-type2');        
	});
    
	barchartRects.on('mouseout', function() {
		hoveredPokemon.removeClass('hovered-type');
		$(this).removeClass('hovered-type');
		hoveredPokemon = null;
		hoveredType = null;
	});
    
    barchartRects2.on('mouseout', function() {
        hoveredPokemon2.removeClass('hovered-type2');
        $(this).removeClass('hovered-type2');
        hoveredPokemon2 = null;
        hoveredType2 = null;
    })
};

const setSelectedScatterplot = (circleElement) => {
	// Deslect anything in scatterplot
	$('.selected-pokemon').removeClass('selected-pokemon');

	// Select or deselect
	if (circleElement) {
		selectedPokemonName = circleElement.id;
		selectedPokemon = circleElement;
		$(selectedPokemon).addClass('selected-pokemon');
	} else {
		selectedPokemonName = null;
		selectedPokemon = null;
	}
}

const setSelectedInnovative = (pokemonName, pokemonData, deselectScatterplot = true) => {
	const previousGeneration = selectedGeneration;

	// Select or deselect
	if (pokemonName) {
		selectedPokemonName = pokemonData['Name'];
		selectedPokemonInnovative = pokemonName;
		innovative.selectedPokemon = pokemonName;
	} else {
		selectedPokemonName = null;
		selectedPokemonInnovative = null;
		innovative.selectedPokemon = null;
		scatterplot.selectedPokemonName = null;
		$(selectedPokemon).removeClass('selected-pokemon');
		if (deselectScatterplot) selectedPokemon = null;
	}

	// Update the generation slider to selected Pokemon's generation
	if (pokemonData) {
		const selectedPokemonGeneration = pokemonData['Generation'];

		const slider = $('#generation-slider');
		const sliderText = $('#generation-selection');
	
		selectedGeneration = selectedPokemonGeneration;
	
		// Update slider
		slider.val(selectedPokemonGeneration);
		sliderText.text(selectedPokemonGeneration);
	
		onSliderUpdate();

		// Set selected circle element
		selectedPokemon = $(`#scatterplot [id='${pokemonData['Name']}']`).get(0);

		// Circle class handled in scatterplot after transition if switching generations
		if (previousGeneration === selectedGeneration) {
			$(selectedPokemon).addClass('selected-pokemon');
		}
	}

	innovative.update();
}

const updateRadialChart = () => {
	const selectedGenerationData = getSelectedGenerationData();

	if (selectedPokemonName) {
		radialTitle.text(`${formatName(selectedPokemonName)}'s Stats`);
		radialchart.update(getSelectedGenerationData(), selectedPokemonName, selectedGeneration);
	} else {
		radialTitle.text(`Average Generation ${selectedGeneration} Pokemon's Stats`);
		radialchart.update(selectedGenerationData, selectedPokemonName, selectedGeneration);
	}
}
