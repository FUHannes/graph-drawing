//this is only for our specific files
async function prepareData(){
    const directors = await loadCSV("data-prep/csv_data/remakes_nodes.csv");
    const edges = await loadCSV("data-prep/csv_data/remakes_edges.csv",
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
    const movie_info = await loadCSV("data-prep/csv_data/movie-data.csv", (d) => {
        return {
            title: d.title,
            year: d.year,
            director: d.directed_by,
            producer: d.produced_by,
            language: d.language,
            starring: d.starring,
            running_time: d.running_time
        }
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
    const grouped = d3.group(edges, d => d.t_orig)
    const data = d3.hierarchy(grouped)
      .each(d => {
        if (d.depth ==1 ){
          d.data.title = d.data[0]
          d.data.director = d.children[0].data.d_orig
          d.data.year = d.children[0].data.y_orig
          d.data.id = d.children[0].data.id_orig
        }
      });
    return { data: data, info: movie_info };
}

function loadCSV(filename,callback){
    return d3.csv(filename,callback)
}
