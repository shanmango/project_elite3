// Takes a pokemon and returns the sprite image URL
// Requires unedited Pokemon OBJECT from the csv file
function getPokemonSpriteURL(d) {

    let name = d.Name;
    // Process the name
    // Remove all spaces
    name = name.replace(/\s/g, '');
    // Remove all symbols
    name = name.replace(/\W/g, '');
    // Add dash before every capital
    name = name.replace(/[A-Z]/g, '-$&');
    // Remove first dash
    name = name.substring(1);

    // Format mega and primal pokemon
    // Also format Kyurem
    if (/-Mega-/.test(name) || /-Primal-/.test(name) || /-Kyurem/.test(name)) {
        nameArray = name.split('-');
        name = nameArray[1] + '-' + nameArray[0];            
        // Add X or Y suffix
        if (nameArray[3]) {
            name = name + ' ' + nameArray[3];
        }
    }

    // ========= Format some special cases ============

    // Format Gourgeist and Pumpkaboo
    if (/Size/.test(name)) {
        name = name.split('-')[0];
    }

    switch(+d['#']) {
        case 29: name = 'nidoran (m)'; break;
        case 32: name = 'nidoran (f)'; break;
        case 250: name = 'ho-oh'; break;
        case 412: name = 'burmy_trash_cloak'; break;
        case 421: name = 'cherrim_sunshine_form'; break;
        case 550: name = 'basculin_red_stripe_form'; break;
        case 422:
        case 423:
            name = name + '-west';
            break;
        case 585:
        case 586:
            name = name + '-winter-form';
            break;
        case 592:
        case 593:
            name = name + '-male';
            break;
        default:
            break;
    }

    name = name.toLowerCase();

    if (/-incarnate-forme/.test(name)) {
        name = name.replace(/-incarnate-forme/, '');
    }

    if (/therian-forme/.test(name)) {
        name = name.replace(/therian-forme/, 't');
    }


    // =========== Name processed =============
    let url = `data/sprites/${name}.png`;
    // Append image to site for testing purposes
    // $('body').append(`<img src="http://www.pokestadium.com/assets/img/sprites/official-art/dream-world/${name}.png" alt="${d}">`);

    return url;
}

// Test code

/*
d3.csv('data/Pokemon.csv').then(data => {
    // Process data - change values to numbers or booleans as necessary
    data.forEach(d => {
        if (d.Generation < 6) {
            let url = getPokemonSpriteURL(d);
            $('body').append(`<img height="50" src="${url}" alt="${d.Name}">`);
        }

    });	
});
*/