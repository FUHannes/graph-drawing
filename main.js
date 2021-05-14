
prepareData().then(data =>
    drawgraph(data)
)

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
    
//Zeitskala 1918-1980 remakes 1927-2018

        function scale_radius(d){
            console.log(d.y)
            return 250 *(parseInt(d.data.year)-1918)/100 +200
        }

        //links zwischen datenpunkten
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
                .radius(d => scale_radius(d)))//*( parseInt(d.data.year)|| 1)));
        
        // knotenpunkte selbst
        svg.append("g")
        .selectAll("circle") //was macht das?
        .data(root.descendants())
        .join("circle")
            .attr("transform", d => `
            `//rotate(${d.x * 180 / Math.PI - 90})
            +`
            translate(${scale_radius(d)},0)
            `)
            .attr("opacity", d => d.children ? ".5" : "1")
            .attr("fill", d => `hsl(${d.data.id/92*360},100%,50%)`)
            .attr("r", 2.5);
    
        //beschriftung
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
            translate(${scale_radius(d)},0) 
            rotate(${d.x >= Math.PI ? 180 : 0})
            `)
            .on('mouseover', function (d, i) {
                d3.select(this).transition()
                     .duration('300')
                     .attr('opacity', '1');
           })
           .on('mouseout', function (d, i) {
            d3.select(this).transition()
                 .duration('300')
                 .attr('opacity', '.3');
            })
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .text(d =>  d.data.title )
            
            .attr('opacity', '0')
            .clone(true).lower()
            .attr("stroke", "white");
    
        //jahrzenteringe
        if (false){
            for(jahrzent=0;jahrzent<11;jahrzent++){
                //d.data.year = 1980
                svg.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 238*(jahrzent*10))
                .attr('stroke', '#111')
                .attr('opacity', '.4')
                .attr('fill', 'None');
            }
        }
        return svg.attr("viewBox", autoBox).node();
    }

    d3.select("body").append(mainchart)
    
}
