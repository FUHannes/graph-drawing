
prepareData().then(data =>
    drawgraph(data)
)

options = {
    show_titles: false,
    show_timescale: true,
    form: 'rectangle',
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
    
//Zeitskala 1918-1980 remakes 1927-2018

        function scale_year(year){
            return 250 *(parseInt(year)-1918)/100 + (options.show_titles ? 200 : 50)
        }
        function scale_radius(d){
            return scale_year(d.data.year)
        }
        
        const transform = d => {return{
            circle:`
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${scale_radius(d)},0)
                `,

            rectangle:`
                translate(${scale_radius(d)},${d.x*100})
                `,
            
        }[options.form]}
        

        //links zwischen datenpunkten
        svg.append("g")
            .attr("isLink", true)
        .selectAll("path")
        .data(root.links())
        .join("path")
            .attr("d", d=>{
                switch (options.form) {
                    case "circle":
                        return d3.linkRadial()
                        .angle(d => d.x)
                        .radius(d => scale_radius(d))(d)

                    case "rectangle":
                        return  d3.linkVertical()
                        .y(d => d.x*100)
                        .x(d => scale_radius(d))(d)
                    default:
                        break;
                }
               
            })
        
        // knotenpunkte selbst
        console.log(svg.append("g")
        .selectAll("circle") //was macht das?
        .data(root.descendants())
        .join("circle")
            .attr("transform", transform)
            .attr("fill", d => `hsl(${d.data.id/92*360},100%,50%)`)
            .attr("opacity", d => d.children ? ".5" : "1")
            .attr("isKnot", true))
    
        //beschriftung
        svg.append("g")
            .attr("isTitles", true)
        .selectAll("text")
        .data(root.descendants())
        .join("text")
            .attr("transform", d => transform(d)+`
            rotate(${d.x >= Math.PI ? 180 : 0})
            `)
            .attr("dy", "0.31em")
            .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .text(d =>  d.data.title )
            .attr('visibility', options.show_titles ? 'visible' : 'hidden')
            .clone(true).lower()
            .attr("stroke", "white");
    
        //jahrzenteringe
        if (options.show_timescale){
            for(jahrzent=2;jahrzent<11;jahrzent++){
                svg.append('circle')
                .attr('r', scale_year(1900+jahrzent*10))
                .attr('isRing', true)
            }
        }
        return svg.attr("viewBox", autoBox).node();
    }

    d3.select("body").append(mainchart)
    
}
