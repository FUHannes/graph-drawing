//this is only for our specific files
async function prepareData(){
    directors = await loadCSV("data-prep/csv_data/remakes_nodes.csv");
    edges = await loadCSV("data-prep/csv_data/remakes_edges.csv",
    function(d) {
        return {
            d_orig: directors[d.director_original-1].name,
            t_orig: d.title_original,
            y_orig: d.year_original,
            director: directors[d.director_remake-1].name,
            title: d.title_remake,
            year: d.year_remake,

            id_orig: d.director_original,
            id: d.director_remake
        };
    });
    /*
    stratify = d3.stratify()
      .id(d => d.title)
      .parentId(d => d.t_orig)

      console.log(stratify)
    data = stratify(edges)
      console.log(data)
    data = d3.hierarchy(data)
    .sort((a, b) => d3.ascending(a.data.d_orig, b.data.d_orig))
    */
    grouped  = d3.group(edges, d => d.t_orig)
    data = d3.hierarchy(grouped)
      .each(d => {
        if (d.depth ==1 ){
          d.data.title = d.data[0]
          d.data.director = d.children[0].data.d_orig
          d.data.year = d.children[0].data.y_orig
          d.data.id = d.children[0].data.id_orig
        }
      })
      
      .sort((a, b) => d3.ascending(a.data.id, b.data.id)) // TODO verschiedene sortierungen
      
    console.log(data)
    return data
}

function loadCSV(filename,callback){
    return d3.csv(filename,callback)
}