
options = {
    show_titles: true,
    show_timescale: true,
    form:   //'rectangle'||
            'circle',
    sort:   'director'||
            'year',
}

const sorts = {
    director:   (a, b) => d3.ascending(a.data.id, b.data.id),
    year:       (a, b) => d3.ascending(a.data.year, b.data.year)
}
prepareData().then(data =>
    drawgraph(
        data
        .sort(sorts[options.sort]) 
    )
)


drawgraph = (data)=>{
    width = 954
    radius = width / 2

    tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 1) / a.depth)

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

        const color = (d)=>`hsl(${d.data.id/92*360},100%,50%)`

        //nur in rectangle form
        const scale_x = d => d.x*200
        
        const transform = d => {return{
            circle:`
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${scale_radius(d)},0)
                `,

            rectangle:`
                translate(${scale_radius(d)},${scale_x(d)})
                `,
            
        }[options.form]}


        //jahrzenteringe
        if (options.show_timescale){
            switch (options.form) {
                case `circle`:
                    for(jahrzent=2;jahrzent<11;jahrzent++){
                        svg.append('circle')
                        .attr('r', scale_year(1900+jahrzent*10))
                        .attr('isRing', true)
                    }
                    break;
            
                default:
                    break;
            }
            
        }
        
        //links zwischen datenpunkten
        svg.append("g")
            .attr("isLink", true)
        .selectAll("path")
        .data(root.links())
        .join("path")

            // TODO : Links farbig machen? mit gradient
            .attr("d", d=>{
                switch (options.form) {
                    case "circle":
                        return d3.linkRadial()
                        .angle(d => d.x)
                        .radius(d => scale_radius(d))(d)

                    case "rectangle":
                        return  d3.linkVertical()
                        .y(scale_x)
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
            .attr("fill", color)
            .attr("opacity", d => d.parent ? (d => d.children ? ".5" : "1") : "0")
            .attr("isKnot", true))
    

        // zentrumslegende
        var author = svg.append('text')
            .style("visibility", "hidden")
            .style("background", "none")
            .attr("x", -20)
            .attr("y", 0)   
            .text("a simple author");
            
        var year = svg.append('text')
            .attr("x", -20)
            .attr("y", 20)
            .attr("text-align", "center")            
            .style("visibility", "hidden")
            .style("background", "none")
            .text("a simple author");

        const mouseover_h = function (e, d) {
            author.text(d.data.director);
            year.text(d.data.year);
            author.style("visibility", "visible");
            year.style("visibility", "visible");
        }
        const mousemove_h =  function(e, d){
            author.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            year.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        }
        const mouseout_h = function (e, d) {
            author.style("visibility", "hidden");
            year.style("visibility", "hidden");
        }

        
        //beschriftung

        const circlehalfchildren = d => (!(options.form == "circle") || d.x < Math.PI) === !d.children

        svg.append("g")
            .attr("isTitles", true)
        .selectAll("text")
        .data(root.descendants())
        .join("text")
            .attr("transform", d => transform(d)+ (options.form == "circle" ? `
            rotate(${d.x >= Math.PI ? 180 : 0})
            `: ``))
            .on('mouseover', mouseover_h)
            .on("mousemove", mousemove_h)
            .on('mouseout', mouseout_h)
            .attr("dy", options.form == "circle" ? "0.31em" : 0)
            .attr("x", d => circlehalfchildren(d) ? 6 : -6)
            .attr("y", d => options.form != "circle" ? 3 : 0)
            .attr("text-anchor", d => circlehalfchildren(d) ? "start" : "end")
            .text(d =>  d.data.title )
            .attr("fill",color)
            .attr("fill","black")
            .attr('visibility', options.show_titles ? 'visible' : 'hidden')
            .clone(true).lower()
            .attr("stroke", "white");


        return svg.attr("viewBox", autoBox).node();

    }

    d3.select("body").append(mainchart)
    

}
