//this is only for our specific files
async function prepareData(){
    directors = await loadCSV("data-prep/csv_data/remakes_nodes.csv");
    edges = await loadCSV("data-prep/csv_data/remakes_edges.csv",
    function(d) {
        return {
            d_orig: directors[d.director_original-1].name,
            t_orig: d.title_original,
            y_orig: d.year_original,
            d_fake: directors[d.director_remake-1].name,
            t_fake: d.title_remake,
            y_fake: d.year_remake
        };
    });
    grouped  = d3.group(edges, d => d.t_orig)
    //grouped = d3.nest()
    //  .key(function(d) { return d.t_orig; })
    //  .entries(edges);
    return grouped
}

function loadCSV(filename,callback){
    return d3.csv(filename,callback)
}