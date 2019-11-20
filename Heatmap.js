const svgValues = {
    width: 1000,
    height: 600,
    padding: {
        top: 60, 
        bottom: 100,
        left: 100,
        right: 100
    }
}

function fetchData(){

    var request = new XMLHttpRequest();
    request.responseType = 'json';
    request.open('GET', 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json', true);
    request.onload = function(){
        handleOnload(request)
    }
    request.send(); 
}

function handleOnload(request){
    const data = request.response;
    const svg = makeSvg(data);
    const [xScale, yScale] = makeScalesandAxes(data, svg);
    makeHeatmap(data, svg, xScale, yScale);
}

function makeSvg(data){ 
    let dataArr = data.monthlyVariance
    const svg = d3.select('body')
        .append('svg')
        .attr('id', 'svg')
        .attr('width', svgValues.width)
        .attr('height', svgValues.height)

    svg //title
        .append('text')
        .text('Monthly Global Land-Surface Temperatures')
        .attr('id', 'title')
        .attr('text-anchor', 'middle')
        .attr('x', svgValues.width / 2)
        .attr('y', svgValues.padding.top - 30);

    svg // description
    .append('text')
    .attr('id', 'description')
    .text(d3.min(dataArr, d => d.year) + '-' + d3.max(dataArr, d => d.year) + '---Base Temperature: ' + data.baseTemperature + '°')
    .attr('text-anchor', 'middle')
    .attr('x', svgValues.width / 2)
    .attr('y', svgValues.padding.top - 10);

    return svg
}

function makeScalesandAxes(data, svg){
    var dataArr = data.monthlyVariance;
    

    var xScale =  d3.scaleTime()
        .domain([d3.min(dataArr, d => new Date(d.year, 0)), d3.max(dataArr, d => new Date(d.year, 0))])
        .range([svgValues.padding.left, (svgValues.width - svgValues.padding.right)])
    
    const yScale = d3.scaleBand()
        .domain([11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
        .range([(svgValues.height - svgValues.padding.bottom), svgValues.padding.top])
        
    const xAxis = d3.axisBottom(xScale)

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(function(d){
        let monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        return monthArray[d]
        })

    svg.append('g') //append xAxis
        .attr('transform', 'translate(0, ' + (svgValues.height - svgValues.padding.bottom) + ')')
        .attr('id', 'x-axis')
        .call(xAxis)

    svg.append('g') //append yAxis
        .attr('transform', 'translate(' + svgValues.padding.left +',0)')
        .attr('id', 'y-axis')
        .call(yAxis)

    return [xScale, yScale]
}

function makeHeatmap(data, svg, xScale, yScale){
    
    var dataArr = data.monthlyVariance;
    var rectWidth = (svgValues.width - (svgValues.padding.left) * 2) / (Math.ceil(dataArr.length / 12));
    var rectHeight = ((svgValues.height - (svgValues.padding.top + svgValues.padding.bottom)) / 12);
    var baseTemperature = data.baseTemperature;
    var colorObj = {blue: 'hsl(170, 100%, 30%)', lightblue: 'hsl(170, 100%, 70%)', orange: 'hsl(30, 90%, 50%)', red: 'hsl(0, 90%, 50%)'};
    var dataVals = ['< 7.66°', ' 7.67° - 8.66°', '8.67° - 9.66°', '> 9.67°'];
    var tooltip = d3.select('body')
        .append('div')
        .attr('id', 'tooltip')
        .style('opacity', 0)
        

    function setColor(data){
        let color = colorObj.blue;
        
        if (data.variance > 1) {color = colorObj.red}
        else if (data.variance > 0) {color = colorObj.orange}
        else if (data.variance > -1) {color = colorObj.lightblue}

        return color
    }

    function setTooltip(data){
        function getMonthName(monthNumber){
            let monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return monthArray[monthNumber - 1]
        }
        function generateTooltipHTML(){
            return 'Year: ' + data.year 
            + '<br/>Month: ' + getMonthName(data.month) 
            + '<br/>Temperature: ' + ((Math.round((baseTemperature + data.variance) * 100) / 100)) + '°'
        }
        tooltip
            .attr('data-year', data.year)
            .style('opacity', 1)
            .style('left', ((xScale(new Date(data.year, 0)) + 15) + 'px'))
            .style('top', (yScale(data.month) - 125) + 'px')
            .html(generateTooltipHTML)
    }

    function makeRects(){
        svg //create rects
        .selectAll('rect')
        .data(dataArr)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('data-variance', d => d.variance)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('x', d => xScale(new Date(d.year, 0)))
        .attr('y', d => yScale(d.month - 1)) 
        .attr('data-month', d => (d.month - 1))
        .attr('data-year', d => d.year)
        .attr('data-temp', d => (baseTemperature + d.variance))
        .style('stroke-width', 0)
        .style('fill', d => setColor(d))
        .on('mouseover', function(d){
            setTooltip(d);

            d3.select(this)
            .style('stroke-width', 1)
        })
        .on('mouseout', function(){
            tooltip
                .style('opacity', 0)

            d3
                .select(this)
                .style('stroke-width', 0)
        })
        
    }
    function makeLegend(){

        const legend = svg
        .append('g')
        .attr('id', 'legend')
        .attr('width', 500)
        .attr('height', 200)
        .attr('transform', 'translate(' + ((svgValues.width / 2) - 320) + ',' + (svgValues.height - 40) +')')
    
        legend
            .selectAll('rect')
            .data(Object.values(colorObj))
            .enter()
            .append('rect')
            .attr('class', 'legend-rects')
            .attr('x', (d, i) => (i * 140))
            .attr('y', -5)
            .style('fill', d => d)

        legend
            .selectAll('text')
            .data(dataVals)
            .enter()
            .append('text')
            .attr('x', (d, i) => (i * 140) + 25)
            .attr('alignment-baseline', 'hanging')
            .text(d => d)
    }
    
    makeRects();
    makeLegend();
}

document.addEventListener('DOMContentLoaded', fetchData())