// TODO : in der mitte farbiges kuchendiagramm und bei hover weisses overlay (animieren) und ausgewähltes kuchestück hervorheben
// TODO : split into multiple files
// TODO : Zeit an achse
// TODO : Zeitlinien im rectangle

const forms = {
    "circle":"circle", 
    "rectangle":"rectangle"
};Object.freeze(forms)

const sorts = {
    director:       (a, b) => d3.ascending(a.data.id, b.data.id),
    director_name:  (a, b) => d3.ascending(a.data.director, b.data.director),
    year:           (a, b) => d3.ascending(a.data.year, b.data.year),
    remake_amount:  (a, b) =>   {
        if (a.depth==1 && b.depth==1){
            return d3.ascending(a.children.length, b.children.length)
        }else{
            return 0
        }
        
    },
    director_movie_amount: (a, b) =>  d3.ascending(a.data.director_origs_amount, b.data.director_origs_amount),
}

// darstellungsoptionen hier eingeben
options = {
    show_titles: true,
    show_timescale: true,
    show_pie: false ,//||true ,
    form:   forms.circle, //&& forms.rectangle,
    sort:   sorts.director_movie_amount
}

prepareData().then(data =>{
    anzahl_filme_pro_director = {}
    data.each(d => {if (d.depth == 1 ){
        anzahl_filme_pro_director[d.data.id] = (anzahl_filme_pro_director[d.data.id] || 0)+1
    }})
    data.each(d => {
        d.data.director_origs_amount = anzahl_filme_pro_director[d.data.id]
    })
    data=data
    .sort(sorts.director)
    .sort(options.sort) 
    drawgraph(data)
})


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
        // TODO : remove || 0 to make fakers black (einmal cooles feature draus bauen)
        const color = (d)=>`hsl(${((anzahl_filme_pro_director[d.data.id]|| 0)+[d.data.id])*10},100%,50%)`

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
                case forms.circle:
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
                    case forms.circle:
                        return d3.linkRadial()
                        .angle(d => d.x)
                        .radius(d => scale_radius(d))(d)

                    case forms.rectangle:
                        return  d3.linkVertical()
                        .y(scale_x)
                        .x(d => scale_radius(d))(d)
                    default:
                        break;
                }
               
            })
        
        // knotenpunkte selbst
        svg.append("g")
        .selectAll("circle") //was macht das?
        .data(root.descendants())
        .join("circle")
            .attr("transform", transform)
            .attr("fill", color)
            .attr("opacity", d => d.parent ? (d => d.children ? ".5" : "1") : "0")
            .attr("isKnot", true)
    

        // kuchenzentrum
        if (options.form == forms.circle && options.show_pie){

            pie = d3.pie()
            .sort((a, b) => d3.ascending(a[0], b[0]))
            .sort((a, b) => {
                // a specific director was messed up somehow
                // TODO : some directors are not aligned ..
                if (b[0]==8 && (a[0]==39 || a[0]==32)){return -1}
                return d3.ascending(a[1], b[1])
            })
                .value(d => d[1])
            arcLabel => {
                const radius = Math.min(width, height) / 2 * 0.8;
                return d3.arc().innerRadius(radius).outerRadius(radius);
            }

            pie_data = Object.entries(anzahl_filme_pro_director)

            arcs = pie(pie_data)
            
            arc = d3.arc()
            .innerRadius(50)
            .outerRadius(100)

            svg.append("g")
            .attr("id", "cake")
            .attr("stroke", "white")
            .selectAll("path")
            .data(arcs)
            .join("path")
            .attr("fill", d => {
                if (hovered_dude == -1 || hovered_dude==d.data[0]) {
                    return color({data:{id:parseInt(d.data[0])}})
                }
                return 'black'
            })
            .attr("d", arc)
            .append("title")
            .text(d => `${d[0]}`);
      
        }
        const updatecake = function () {
            var cake = svg.select("#cake").selectAll("path")
            cake.transition()
            .duration(hovered_dude == -1 ? 1000 : 10)
            .attr("fill", d => {
                if (hovered_dude == -1 || hovered_dude==d.data[0]) {
                    return color({data:{id:parseInt(d.data[0])}})
                }
                return 'white'
            })
        }

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
            hovered_dude = d.data.id;
           updatecake()
        }
        const mousemove_h =  function(e, d){
            // TODO macht das was?
            // assignees: berthob98
            //author.style("top", (e.pageY-10)+"px").style("left",(e.pageX+10)+"px");
            //year.style("top", (e.pageY-10)+"px").style("left",(e.pageX+10)+"px");
        }
        const mouseout_h = function (e, d) {
            author.style("visibility", "hidden");
            year.style("visibility", "hidden");
            hovered_dude = -1;
            updatecake()
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

    d3.select("#graph").append(mainchart)
    

}


var hovered_dude = -1



//super dirty state update
function update() {
    d3.selectAll("#graph").selectChildren().remove()
    drawgraph(data);
    console.log('updated')
}

function toggleForm() {
    options.form = (options.form==forms.rectangle)?forms.circle:forms.rectangle;update()
}

function toggleSort(newSort) {
    console.log(newSort, sorts[newSort])
    options.sort = sorts[newSort]
    data=data
    .sort(options.sort) 
    update()
}