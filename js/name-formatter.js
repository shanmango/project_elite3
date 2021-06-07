// Gets a pokemon's name and returns the formatted string
// Requires unedited Pokemon NAME from the csv file
function formatName(d) {
    let name = d;
    let secondCapital = new RegExp(/\w[A-Z]/);

    // Process mega and primal pokemon
    // ALso process Kyurem
    if (/\wMega/.test(name) || /\wPrimal/.test(name) || /Kyurem\w/.test(name)) {
        let split = name.search(secondCapital);
        name = name.substring(split + 1);
        // Process pokemon with multiple forms
    } else if (name.match(secondCapital)) {
        let letters = name.match(secondCapital)[0];
        name = name.replace(secondCapital, letters.charAt(0) + ' ' + letters.charAt(1));
    }

    return name;

}


// Test code

/*
formatName('MewtwoMega Mewtwo X');
formatName('Mr. Mime');
formatName('TornadusTherian Forme')

d3.csv('data/Pokemon.csv').then(data => {

    // Process data - change values to numbers or booleans as necessary
    data.forEach(d => {
        console.log(formatName(d.Name));
        $('body').append(formatName(d.Name) + '<br>');

    });	
});
*/