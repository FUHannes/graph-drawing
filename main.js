// done : in der mitte farbiges kuchendiagramm und bei hover weisses overlay (animieren) und ausgewähltes kuchestück hervorheben
// TODO : split into multiple files
// done : Zeit an achse
// TODO : Zeitlinien im rectangle
// done : Settings toggleable
// TODO : kleine Anleitung


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
    show : false,
    show_titles: true,
    show_timescale: true,
    show_pie: false ,//||true ,
    form:   forms.circle, //&& forms.rectangle,
    sort:   sorts.director_movie_amount
}

async function main() {
    const data = await prepareData();
    const movie_data = data.data;
    const allMovieInfo = data.info;
    anzahl_filme_pro_director = {}
    movie_data.each(d => {if (d.depth == 1 ){
        anzahl_filme_pro_director[d.data.id] = (anzahl_filme_pro_director[d.data.id] || 0)+1
    }})
    movie_data.each(d => {
        d.data.director_origs_amount = anzahl_filme_pro_director[d.data.id]
    })
    sorted_movie_data = movie_data
        .sort(sorts.director)
        .sort(options.sort);
    drawgraph(sorted_movie_data, allMovieInfo);
}

main();


drawgraph = (data, allMovieInfo) => {
    width = 954
    radius = width / 2

    tree = d3.tree()
        .size([1.9 * Math.PI, radius])
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
        const backgroundcolor = (d)=>`hsl(${((anzahl_filme_pro_director[d.data.id]|| 0)+[d.data.id])*10},100%,80%)`

        //nur in rectangle form
        const scale_x = d => d.x*200
        
        const transform = d => {return{
            circle:`
                rotate(${d.x * 180 / Math.PI - 80})
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
                    for (decade = 1920; decade < 2010; decade += 10) {
                        // Use arc instead of circle because it is simpler to
                        // get text to go along the path.
                        svg.append('path')
                            .attr('id', 'ring' + decade)
                            .attr('d', d3.arc()
                                .innerRadius(scale_year(decade))
                                .outerRadius(scale_year(decade))
                                // Move start angle away from 0 so that it
                                // doesn't wrap the text.
                                .startAngle(Math.PI)
                                .endAngle(3 * Math.PI)
                            )
                            .attr('isRing', true);

                        svg.append('text')
                            .attr('dy', '-5')
                            .append('textPath')
                            .attr('xlink:href', '#ring' + decade)
                            .attr('isYear', true)
                            .style('text-anchor','middle')
                            .attr('startOffset', '25%')
                            .text(decade + 's');
                            // TODO : (optional) on hover ganzen ring vorheben und evtl sogar andere filme etwas ausblenden
                    }
                    break;
            
                default:
                    break;
            }
            
        }
        
        //links zwischen datenpunkten

            var gradient_color = d3.interpolateRainbow;
            console.log(root.links())
            svg.append("g")
                .attr("isLink", true)
            .selectAll("path")
            .data(root.links().filter(link => link.source.depth > 0))
            // done : if we dont want errors this should not forward links starting at root
            .join("path")
                .attr("d", d=>{
                    switch (options.form) {
                        case forms.circle:
                            return d3.linkRadial()
                            .angle(d => d.x + 10 * (Math.PI / 180))
                            .radius(d => scale_radius(d))(d)

                        case forms.rectangle:
                            return  d3.linkVertical()
                            .y(scale_x)
                            .x(d => scale_radius(d))(d)
                        default:
                            break;
                    }
                
                })
                .attr('start_color', d => color(d.source))
                .attr('end_color', d => color(d.target))


        var div = d3.select("body").append("div")	
            .attr("class", "tooltip-wrapper")				
            .style("opacity", 0);

        // knotenpunkte selbst
        svg.append("g")
        .selectAll("circle") //was macht das?
        .data(root.descendants())
        .join("circle")
            .attr("transform", transform)
            .attr("fill", color)
            .attr("opacity", d => d.parent ? (d => d.children ? ".5" : "1") : "0")
            .attr("isKnot", true)
            .on('mouseover', function (event, d) {
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const tooltipWrapper = document.querySelector('.tooltip-wrapper');
                const tooltipStyle = window.getComputedStyle(tooltipWrapper, null);
                const tooltipMaxWidth = parseInt(tooltipStyle.getPropertyValue('max-width'));
                const tooltipMaxHeight = parseInt(tooltipStyle.getPropertyValue('max-height'));
                const cursorOffsetY = 28;
                const verticalScroll = document.querySelector('html').scrollTop;
                let verticalPosition;
                if (event.pageY - cursorOffsetY + tooltipMaxHeight > viewportHeight + verticalScroll) {
                    verticalPosition = viewportHeight + verticalScroll - tooltipMaxHeight;
                } else if (event.pageY - cursorOffsetY - verticalScroll < 0) {
                    verticalPosition = verticalScroll;
                } else {
                    verticalPosition = event.pageY - cursorOffsetY;
                }
                let horizontalPosition;
                if (event.pageX + tooltipMaxWidth > viewportWidth) {
                    horizontalPosition = event.pageX - tooltipMaxWidth;
                } else {
                    horizontalPosition = event.pageX;
                }
                div.transition()
                    .duration(200)
                    .style('opacity', 1);
                div.html(`
                    <div class=tooltip>
                    </div>`
                )
                    .style('left', horizontalPosition + 'px')
                    .style('top', verticalPosition + 'px')
                    .style('background-color', backgroundcolor(d))
                const poster = new Image();
                const filename = convertToPosterFilename(d.data.title, d.data.year);
                const movieInfo = getMovieInfo(d.data.title, d.data.year, allMovieInfo);
                poster.src = './posters/' + filename + '.jpg';

                const infoHTML = ` 
                    <div class=tooltip-right>
                        <div class=title>
                            <h1>${d.data.title}</h1>
                        </div>
                        <p><b>Directed by:</b> ${movieInfo.director}</p>
                        <p><b>Produced by:</b> ${movieInfo.producer}</p>
                        <p><b>Released in:</b> ${d.data.year}</p>
                        <p><b>Language:</b> ${movieInfo.language}</p>
                        <p><b>Starring:</b> ${movieInfo.starring}</p>
                        <p><b>Running time:</b> ${movieInfo.running_time} min.</p>
                    </div>`

                poster.onload = function() {
                    document.querySelector('.tooltip').innerHTML = `
                        <div class=tooltip-left>
                            <img src=posters/${filename}.jpg alt=Poster class=movie-poster>
                        </div>
                        `+infoHTML
                };
                poster.onerror = function() {
                    document.querySelector('.tooltip').innerHTML = infoHTML
                }
            })
            .on('mouseout', function (event, d) {
                div.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    

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

        const mouseover_h = function (e, d) {
            hovered_dude = d.data.id;
            updatecake()
        }

        const mouseout_h = function (e, d) {
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


function convertToPosterFilename(title, year) {
    title = title.toLowerCase().replaceAll(' ', '_').concat('_', year);
    return title;
}

function getMovieInfo(title, year, allMovieInfo) {
    for (const movieInfo of allMovieInfo) {
        if (movieInfo.title === title && movieInfo.year === year) {
            return formatMovieInfo(movieInfo);
        }
    }
}

function formatMovieInfo(movieInfo) {
    for (const key of Object.keys(movieInfo)) {
        if (typeof(movieInfo[key]) === "string") {
            movieInfo[key] = movieInfo[key].replaceAll(";", ", ");
        }
    }
    return movieInfo;
}

//super dirty state update
function update() {
    d3.selectAll("#graph").selectChildren().remove()
    drawgraph(data);

    color_links_with_gradient()
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


function color_links_with_gradient() {

    var paths = d3.select("svg").selectAll("[isLink]").selectAll("path");
    var rempaths = paths.remove().nodes().map(path => {var x = quads(samples(path, 4)); x.path = path; return x;});

    d3.select("svg").selectAll("[isLink]").selectAll("path")
        .data(rempaths)
      .enter().append('g')
        .each(function(d,i){
            try {
                const p = d3.select(d.path)
                var gradient_color = d3.interpolateLab(p.attr("start_color"), p.attr("end_color")) //done: color of end and start
                d3.select(this).selectAll('path')
                    .data(d)
                .enter().append('path')
                    .attr("d", function(d){
                        //console.log(d)
                        return lineJoin(d[0], d[1], d[2], d[3], getComputedStyle(document.body).getPropertyValue('--thiccness')*2);
                    })
                    .style("fill", function(d)  { return gradient_color(d.t); })
                    .style("stroke", function(d) {gradient_color(d.t)})
                    .attr("isLink",false)
                    .style('opacity', 0.4)
            } catch (err) {
                console.warn(err)
            }
        });
};
setTimeout(
color_links_with_gradient
,200);
