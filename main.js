
if (!true) {
loadJSON('data-prep/replace.or.parse.our.own.json',
(response)=>{
    // Parse JSON string into object
    //alternative parsing the .csv directly here would also work
    var data = JSON.parse(response);
    data = d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.d_orig, b.data.d_orig))
    console.log(data)

    drawgraph(data)
});
}else{
prepareData().then(data =>
    drawgraph(data)
)
}
drawgraph = (data)=>{
    width = 954
    radius = width / 2

    tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

    function autoBox() {
        document.body.appendChild(this);
        const {x, y, width, height} = this.getBBox();
        document.body.removeChild(this);
        return [x, y, width, height];
    }

    mainchart = ()=>{
        const root = tree(data);
        
        const svg = d3.create("svg");
    
        svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(root.links())
        .join("path")
            .attr("d", d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y));
        
        svg.append("g")
        .selectAll("circle")
        .data(root.descendants())
        .join("circle")
            .attr("transform", d => `
            rotate(${d.x * 180 / Math.PI - 90})
            translate(${d.y},0)
            `)
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("r", 2.5);
    
        svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
        .selectAll("text")
        .data(root.descendants())
        .join("text")
            .attr("transform", d => `
            rotate(${d.x * 180 / Math.PI - 90}) 
            translate(${d.y},0) 
            rotate(${d.x >= Math.PI ? 180 : 0})
            `)
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .text(d => /*{if (d.data[1] != undefined && d.data[1][0] != undefined) {return d.data[1][0].title} return*/ d.data.title || d.data.name /*}*/)
        .clone(true).lower()
            .attr("stroke", "white");
    
        return svg.attr("viewBox", autoBox).node();
    }

    d3.select("body").append(mainchart)
    
}
