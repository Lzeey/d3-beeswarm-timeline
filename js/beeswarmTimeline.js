function beeswarmTimeline(divID) {
    "use strict";
    
    var parentDOM = d3.select(divID),
        width = parseInt(parentDOM.style('width'), 10),
        height = 300,
        border = 10,
        btmMargin = 30,
        radius = 3; //Buffer around edge

    var maxHeight = height - border * 2 - btmMargin; //For specifying space of graph
    
    var svg = parentDOM.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", 'beeswarm');

    //Generate groups
    var nodeGroup = svg.append('g').attr('class', 'nodes beeswarm');

    var t = d3.transition().duration(1000);
    
    //Precreate variables
    var maxDatetime, minDatetime, xScale, xAxis, timeNow;
    
    //Data related
    var data, swarmData, maxDatetime, minDatetime, yMinMax, scoreMinMax, colorScale;
    
    var timeBar = svg.append("line").attr("stroke-opacity", 0).attr("class", "timeBar beeswarm"),
        timeReadout = svg.append("text").attr("opacity", 0).attr("class", "timeReadout beeswarm"),
        timeFormater = d3.timeFormat("%a %d-%m-%y, %H:%M%:%S");
    
    var graph = function(){return graph()}
    
    graph.data = function(new_data){
        data = new_data;
        updateData();
        updateGraph();
    }
    //Define svg height and width

    function updateData(){
        //Find max and min date
        maxDatetime = data[data.length - 1].datetime //Assume that last entry is max
        minDatetime = data[0].datetime; //First entry is the earliest

        //Create scales
        xScale = d3.scaleTime()
            .domain([minDatetime, maxDatetime])
            .range([0, width]);

        xAxis = svg.append("g")
            .attr("transform", "translate(0, " + (height - btmMargin - border) + ")")
            .call(d3.axisBottom()
                .scale(xScale)
            );

        //Define timeline action (Consider appending rect)
        svg.on("mouseover", function (d) {
            var xCoords = d3.mouse(this)[0];
            timeNow = xScale.invert(xCoords);
            //Make text appear
            timeReadout.attr("opacity", 1)
                .attr("x", xCoords)
                .attr("y", height - border - btmMargin + 20)
                .text(timeFormater(timeNow));
            //Make line appear
            timeBar.attr("stroke-opacity", 1)
                .attr("x1", xCoords)
                .attr("y1", height - border - btmMargin)
                .attr("x2", xCoords)
                .attr("y2", 1);
            //Make axis disappear

        }).on("mouseout", function (d) {
            timeBar.transition()
                .attr("stroke-opacity", 0);
            timeReadout.transition()
                .attr("opacity", 0);
        }).on("click", function (d) {
            var xCoords = d3.mouse(this)[0];
            timeNow = xScale.invert(xCoords);
            console.log(timeNow);
        })

        //Data manipulation
        //Start creating datapoints
        swarmData = d3.beeswarm()
            .data(data)
            .radius(radius)
            .orientation("horizontal")
            .side("positive")
            .distributeOn(function (d) {
                return xScale(d.datetime);
            })
            .arrange();

        yMinMax = findMinMax(swarmData, 'y'),
        scoreMinMax = findMinMax(data, 'value');

        colorScale = d3.scaleLinear().domain(scoreMinMax).range(['cornflowerblue', 'orangered']);
    }

    //Draw points
    var nodes;

    function updateGraph() {
        nodes = nodeGroup.selectAll("circle")
            .data(swarmData);
        nodes.exit().transition().attr('r', 0).remove();
        var nodesEnter = nodes.enter()
            .append("circle")
            .attr("class", "beeswarm")
            .attr("cx", function (d) {
                return d.x
            })
            .attr("cy", function (d) {
                return height - border - btmMargin - manageExtremeAccumulation(d.y, "linear stretch", yMinMax[1], maxHeight)
            })
            .attr("fill", function (d) {
                return colorScale(d.datum.value)
            })
            .call(function (node) {
                node.transition(t).attr("r", radius)
            });
        nodes = nodesEnter.merge(nodes);
    }

    function findMinMax(array, key) {
        var extracted = array.map(function (o) {
            return o[key]
        });
        var min = Math.min.apply(Math, extracted);
        var max = Math.max.apply(Math, extracted);
        return [min, max]
    }

    function manageExtremeAccumulation(freeCoord, strategy, arrangementMax, maxHeight) {
        if (arrangementMax <= maxHeight) {
            return freeCoord;
        } else if (strategy === "none") {
            return freeCoord;
        } else if (strategy === "wrap") {
            return (Math.abs(freeCoord) > maxHeight) ? Math.sign(freeCoord) * maxHeight : freeCoord;
        } else if (strategy === "modulo") {
            return freeCoord % maxHeight;
        } else if (strategy === "linear stretch") {
            return maxHeight * freeCoord / arrangementMax;
        } else if (strategy === "log stretch") {
            //log strecth allows to have litle overlapping near the axis, and huge overlapping at maxHeight, so that areas where there is no extreme accumulation are still sparse

            // return freeCoord - Math.sign(freeCoord)*(arrangementMax-maxHeight)*Math.pow(freeCoord/arrangementMax,2);
            // return Math.sign(freeCoord)*maxHeight*(Math.pow(Math.abs(freeCoord)/arrangementMax,0.5));
            return maxHeight * Math.sign(freeCoord) * Math.log((Math.E - 1) * Math.abs(freeCoord) / arrangementMax + 1);
        }
    }
    
    return graph
}