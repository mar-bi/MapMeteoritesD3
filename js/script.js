const width = 1160, 
 			height = 700;
const mapScale = Math.round(width / 2 / Math.PI);
const yearFormat = d3.timeFormat('%Y');
const margin = { top: 30, right: 30, bottom: 30, left: 30 };
var temp_color;
			
var svg = d3.select('#chart').append('svg')
	.attr('width', width)		
	.attr('height', height);

var g = svg.append("g")
    .attr("class", "everything");	

const width1 = 	(width / 1.5) + margin.left + margin.right,
			height1 = (height / 2.5) + margin.top + margin.bottom;


d3.queue()
	.defer(d3.json, "js/world.geojson")
	.defer(d3.json, "js/meteorite-strike-data.json")
	.await(function(error, file1, file2) {
		if (error) return console.error(error);
		createMap(file1, file2);
	});


function createMap(countries, meteorites){
	const projection1 = d3.geoMercator()
												.scale(mapScale)
												.translate([width /2, height/2]);
	var geoPath = d3.geoPath().projection(projection1);
	g.append("g")
		.selectAll("path.countries").data(countries.features)
		.enter().append("path")
		.attr("d", geoPath)
		.attr("class", "countries")
		.style("fill", "#ccebc5")
		.style("stroke", "#bababa");

	const features = meteorites.features;
	const featuresByYear = features.sort(function(a, b) {
		return b.properties.mass - a.properties.mass;});
	
	const histArray = features.map(d=> +d.properties.mass);
	const sortedArr = histArray.sort(function(a, b) {return a - b;});
	const timeArray = features.map(d => yearFormat(new Date(d.properties.year)));
	
	const quantile = i => d3.quantile(sortedArr, i);
	const thresholdsRadius = [quantile(0.5), quantile(0.75), quantile(0.95), 
														quantile(0.97), quantile(0.99)];
			
	const thresholdsColor = [quantile(0.25), quantile(0.5), quantile(0.75),
	 quantile(0.85), quantile(0.92), quantile(0.95), quantile(0.97), quantile(0.99)];
	
	const radiusScale = d3.scaleThreshold()
		.domain(thresholdsRadius)
		.range([2,3,4,5,10,20]);

	const cScale = d3.scaleThreshold()
		.domain(thresholdsColor)
		.range(['rgba(228,26,28,1)','rgba(55,126,184,1)','rgba(77,175,74,1)','rgba(152,78,163,0.9)','rgb(255,127,0)'
			,'rgba(255,255,51,0.8)','rgba(166,86,40,0.8)','rgba(247,129,191,0.7)','rgba(153,153,153,0.7)']);

	var tooltip= d3.select('body').append('div')
	 	.classed('tooltip', true)
	 	.style('position', 'absolute')
	 	.style('padding', '0 5px')
	 	.style('opacity', 0);	
		
	var meteorites_chart = g.append("g").selectAll('circle').data(featuresByYear)
	 	.enter().append("circle")
	 		.each(function(d) {
	 			var location = projection1([+d.properties.reclong,+d.properties.reclat ]);
	 			d3.select(this)
	 				.attr("cx", location[0])
	 				.attr("cy", location[1])
	 				.attr("r", radiusScale(+d.properties.mass));
	 		})
			.attr("class", "meteorites")
			.style("fill", "rgba(255,255,255,0)")
			.style("stroke", "rgba(255,255,255,0)")
			.on('mouseover', function(d){
				temp_color = this.style.fill;
				d3.select(this)
					.style("opacity", 1)
					.style("fill", "blue");

				tooltip.transition()
 					.style('opacity', .9);

 				tooltip.html(`<p>Name: ${d.properties.name},<br/> 
 											 Mass: ${Math.round(d.properties.mass)} kg<br/>
 											 Year: ${yearFormat(new Date(d.properties.year))}<br/>
 											 Group: ${d.properties.recclass}</p>`)
 		   		.style('left',(d3.event.pageX - 30) + 'px')
 		   		.style('top', (d3.event.pageY + 30) + 'px');
 			})
 			.on('mouseout', function(){
 		 		tooltip.text('');
				d3.select(this)
					.style("opacity", 0.8)
					.style("fill", temp_color); 		 		
			});
		
		meteorites_chart.transition()
			.style("fill",  d => cScale(+d.properties.mass))
			.style("stroke", "#333")
			.delay((d, i) => i * 15)
			.duration(1000)
			.ease();
			 	
		var zoom_handler = d3.zoom()
			.scaleExtent([1, 96])
			.on("zoom", zoom_actions); 		

		d3.select("svg").call(zoom_handler);

		function zoom_actions() {
			g.attr("transform", d3.event.transform);		
		}
	}
 	




			







