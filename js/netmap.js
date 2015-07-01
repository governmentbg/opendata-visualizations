$(function(){

      // Global variables
      var initialYear=2006,
          currentYear=2006,
          lastYear=2014;

      // initialize targetVar
      var targetVar = 'InternetAccessPrc';

      var isPlaying = false;
      var isTooltipActive = false;
      var currentOblast = null;

      // Handlers
      var slider;

      var widthAsString = d3.select(".module-content").style("width")
      var width = parseInt(widthAsString,10),
          height = width/1.5;

      var projection = d3.geo.mercator()
          .center([25.23, 42.76])
          .rotate([-2,0,0])
          .scale(5000)
 
      var svg = d3.select("#mapbg").append("svg")
          .attr("width", width)
          .attr("height", height);

      var path = d3.geo.path()
          .projection(projection);

      var g = svg.append("g");

      // legend
      var legend = d3.select('#maplegend')
        .append('ul')
          .attr('class', 'list-inline');



      // Scales and formats
      var colorScale = d3.scale.linear()
                    .domain([0, 20, 40, 100])
                    .range(["#7fff7f", "#00cc00","#007f00", "#004c00"])
          var colorLegend = { "#7fff7f": 0,"#00cc00": 20,"#007f00": 40,"#004c00": 100}
          var formatYear = d3.format("04d");
          var formatPrc = d3.format("0.00%");
          var formatPrc0 = d3.format("%");

      queue()
          .defer(d3.json, "data/bg-geo-oblast.json")
          .defer(d3.json, "data/internet_bg.json")
          .defer(d3.json, "data/recodeRegionsEnToBg.json")
          .await(ready);

        function ready(error, collection, coverage, regionRec) {
          if (error) throw error;

        // Select Tooltip
        var tooltip = d3.select("#path-tooltip")

        //console.log(d3.geo.centroid(collection));

        var feature = g.selectAll("path")
          .data(collection.features)
            .enter()
            .append("path")
            .on("mouseover", function(d) {
              //remember current Oblast
              currentOblast = d.properties.oblast
              isTooltipActive = true;
              setTooltip(currentOblast);
                })
                .on("mousemove", function(d) {
                    return tooltip
                      .style("top", (d3.event.pageY-10)+"px")
                      .style("left", (d3.event.pageX+10)+"px");
                })
                .on("mouseout", function(){
                  isTooltipActive=false;
                  return tooltip.style("opacity", 0);
                })
                .attr("d", path);


        feature.style("fill", function(d){
              return getColor(extractData(d.properties.oblast,currentYear.toString(),targetVar))
            });

        var legendKeys = legend.selectAll('li.key')
                .data(colorScale.range());
            
        legendKeys.enter().append('li')
                .attr('class', 'key')
                .style('border-top-color', String)
                .text(function(d) {
                    var r = colorLegend[d];
                    return formatPrc0(r/100);
        });

        update(initialYear.toString(),targetVar);

        // Add controls to buttons
        d3.select("#InternetAccessPrc")
          .on('click', function(){ changeData('InternetAccessPrc');} );
        d3.select("#InternetNeverPrc")
          .on('click', function(){ changeData('InternetNeverPrc');});
        d3.select("#InternetRegPrc")
          .on('click', function(){ changeData('InternetRegPrc');});
        d3.select("#eGovPrc")
          .on('click', function(){ changeData('eGovPrc');});

        // Add slider
        createSlider();

        // Add play button
        d3.select("#play")
            .attr("title","Play animation")
            .on("click",function(){
              if ( !isPlaying ){
                isPlaying = true;
                d3.select(this).classed("pause",true).attr("title","Pause animation");
                animate();
              } else {
                isPlaying = false;
                d3.select(this).classed("pause",false).attr("title","Play animation");
                clearInterval( interval );
              }
          });

        addAttributions();


        // Extract target variable by target year
        function extractData(obl, year, target){        
            for (var i=0;i<coverage.data.length;i++){
            if(coverage.data[i].Year==year){
              for (var j=0;j<coverage.data[i].data.length;j++){
                if(coverage.data[i].data[j].Region===obl){
                  return coverage.data[i].data[j][target];
                }
              }
            }
          }
        }

        function getColor(value){ return colorScale(value); }

        function update(year,target){
          feature
            .transition()
            .duration(750)
            .style("fill", function(d){
                return getColor(extractData(d.properties.oblast,year,target))
              });
        }

        function animate(){
          interval = setInterval( function(){
            currentYear++;
            
            d3.select("#slider-div .d3-slider-handle")
              .style("left", 100*currentYear/lastYear + "%" );
            slider.value(currentYear)
          
            update(currentYear.toString(), targetVar);

            if(isTooltipActive){
              setTooltip(currentOblast);
            }

            if(currentYear==lastYear){
              isPlaying = false;
              d3.select("#play").classed("pause",false).attr("title","Play animation");
              clearInterval(interval);
              return;
            }

          },1000);
        }

        function setTooltip(currOblast){
          tooltip.select("#path-oblast").text("Област: " +
                    regionRec[currOblast])
                tooltip.select("#path-value").text("Процент: " +
                    formatPrc(
                      extractData(currOblast,currentYear.toString(),targetVar)/100))
                tooltip.select("#path-year").text("Година: " + currentYear)
                return tooltip
                    .transition()
                    .style("opacity", 0.9);
        }

        function createSlider(){
          sliderScale = d3.scale.linear().domain([initialYear,lastYear]);

          var val = slider ? slider.value() : initialYear;

          slider = d3.slider()
            .axis(
            d3.svg.axis().ticks(lastYear-initialYear+1)
            .tickFormat(function(d){ return formatYear(d); })
            )
          .min(initialYear)
          .max(lastYear)
          .step(1)
            .on("slide",function(event,value){
              if ( isPlaying ){ clearInterval(interval); }
              currentYear = value;
              update(currentYear.toString(), targetVar);
            })
            .on("slideend",function(){
              if ( isPlaying ) animate();
            })
            .value(val);

          d3.select("#slider-div").remove();

          d3.select("#slider-container")
            .append("div")
            .attr("id","slider-div")
            .style("width",width/1.25 + "px")
            .call( slider );

          d3.select("#slider-div a").on("mousemove",function(){
            d3.event.stopPropagation();
          })

        }

        function changeData (clickedId){
          targetVar=clickedId;

          // reset animation
          if(currentYear==lastYear){
            currentYear=initialYear;
            clearInterval(interval);
            d3.select("#slider-div .d3-slider-handle")
                  .style("left", 0 + "%" );
              slider.value(currentYear);}

          update(currentYear.toString(),targetVar);

        }

      };


      function addAttributions(){
        d3.select("#attributions")
          .html("<br><br>")
          .append("p")
          .text("Attribution: Карта е любезно предоставена от ")
          .style("font-size", "12px")
          .append("a")
          .attr({"href": "http://yurukov.net/blog/"})
          .text("Боян Юруков");
      }

  }());
