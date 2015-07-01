    $(function(){

      // External interface
      var initialPoint=1,
        currentPoint=1,
        initialYear=2011,
        currentYear,
        totalYears,
        initialMonth=1,
        lastMonth,
        totalMonths=0;

      // keep track of state 

      var isPlaying = false;
      var isTooltipActive = false;

      // Handlers
      var slider,
        circles;

      // Get width of target div
      var widthAsString = d3.select(".module").style("width")

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


      // Scales and formats
          var circleScale = d3.scale.linear()
                    .domain([0, 227.5])
                    .range([0, 100])
          var timeScale;

          var months = ["ян","февр","март","апр","май","юни","юли","авг","септ","окт","ноем","дек"]


          var formatYear = d3.format("04d");
          var formatPrc = d3.format("0.00%");

      queue()
          .defer(d3.json, "data/geo.json")
          .defer(d3.json, "data/grao_adj_final.json")
          .await(ready);

        function ready(error, collection, grao) {
          if (error) throw error;

          totalYears = grao.data.length - 1;
          lastMonth = grao.data[totalYears].data.length - 1;
          initialMonth = Number(grao.data[0].data[0].month);
          initialYear = Number(grao.data[0].Year);
          currentYear = initialYear;
          currentMonth = initialMonth;

          for (var i=0;i<grao.data.length;i++){
          totalMonths += grao.data[i].data.length;
        }

        timeScale = d3.time.scale()
            .domain([new Date(initialYear, Number(grao.data[0].data[0].month)-1), new Date(Number(grao.data[totalYears].Year), Number(grao.data[totalYears].data[lastMonth].month-1))])
            .range([0,width/1.3]);

        // Select Tooltip and DateBox
        var tooltip = d3.select("#path-tooltip")
        var datebox = d3.select("#date-box")

        var feature = g.selectAll("path")
          .data(collection.features)
            .enter()
            .append("path")
                .attr("d", path)
                .attr("fill", "#efedf5")
                .attr("id",function(d){return d.properties.name.replace(" ", "")});

            // Create circles inside each Municipality region with small radius
            placeCircles(initialYear, currentPoint);
            
            // Select all already created circles
            circles = g.selectAll("circle");

            // Update all circles' radius to initiate animated entry
            updateCircles(extractMonth(currentYear.toString(),currentPoint).data);

            // Update date box

            datebox.select("#path-month").text("Дата: " + months[currentMonth-1])
            datebox.select("#path-year").text(", " + currentYear)

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

        createLegend();
        addAttributions();
       

        // Extract an object for a given year and a give month
        function extractMonth(y, m){  
            for (var i=0;i<grao.data.length;i++){
            if(grao.data[i].Year===y){
              for (var j=0;j<grao.data[i].data.length;j++){
                if(j===m-1){
                  return grao.data[i].data[j]
                }
              }
            }
          }
        }

        // Extract specific datafield from the above object
        function extractData(y, m, munic, target){
          var monthData = extractMonth(y, m);
          for (var k=0;k<monthData.data.length;k++){
            if(monthData.data[k].Municipality===munic){
              return monthData.data[k][target]
            }
          }
        }


        // Draw initial circles
        function placeCircles(y,m){

          var currentData = extractMonth(y.toString(),m).data;

          for ( var i in currentData){

            g.append("circle")
                  .datum(currentData[i])
                  .attr("cx",function(d){
                    var currentId = '#' + d.Municipality.replace(" ", "");
                    var currentRegion = d3.select(currentId);
                    var currentCentroid = path.centroid(currentRegion.datum());
                    return currentCentroid[0];
                  })
                  .attr("cy",function(d){
                    var currentId = '#' + d.Municipality.replace(" ", "");
                    var currentRegion = d3.select(currentId);
                    var currentCentroid = path.centroid(currentRegion.datum());
                    return currentCentroid[1];
                  })
                  .attr("r",function(d){
                    return circleScale(d['Ratio'])
                  })
                  .attr("id",function(d){
                    return 'cir' + d.Municipality.replace(" ", "");
                  })
                  .on("mouseover", function(d) {
                  //remember current Municipality
                  currentMunicipality = d.Municipality;
                  isTooltipActive = true;
                  setTooltip(currentPoint,currentMunicipality);
                    })
                    .on("mousemove", function(d) {
                        return tooltip
                          .style("top", (d3.event.pageY-height/2)+"px")
                          .style("left", (d3.event.pageX-width*0.75)+"px");
                    })
                    .on("mouseout", function(){
                      isTooltipActive=false;
                      return tooltip.style("opacity", 0);
                    });
          }

        }


        // Update existing circles
        function updateCircles(newdata){

          for ( var i in newdata){
            var cirId = '#cir' + newdata[i].Municipality.replace(" ", "");
            d3.select(cirId)
                  .datum(newdata[i])
          }

          circles
              .sort(function(a,b){
                // sort circles by size, so that the smallest are on top
                return (b['Ratio'] - a['Ratio']);
              })
              
            
          circles
              .transition()
              .ease("linear")
              .duration(500)
              .attr("r",function(d){
                  return circleScale(d['Ratio'])  
              })
              .attr("class",function(d){
                return d['NetMigration'] > 0 ? "incre" : "decre";
              });

        }


        function animate(){
          interval = setInterval( function(){
            if(currentPoint==totalMonths){
              isPlaying = false;
              d3.select("#play").classed("pause",false).attr("title","Play animation");
              clearInterval(interval);
              return;
            }
            
            currentPoint++;
            
            d3.select("#slider-div .d3-slider-handle")
              .style("left", 100*currentPoint/totalMonths + "%" );

            currentYear = pointToYearMonth(currentPoint)[0];
            currentMonth = pointToYearMonth(currentPoint)[1];

            datebox.select("#path-month").text("Дата: " + months[currentMonth-1])
            datebox.select("#path-year").text(", " + currentYear)

            updateCircles(extractMonth(currentYear.toString(), currentMonth).data);

            if(isTooltipActive){
              setTooltip(currentPoint,currentMunicipality);
            }

            if(currentPoint==totalMonths){
              isPlaying = false;
              d3.select("#play").classed("pause",false).attr("title","Play animation");
              clearInterval(interval);
              return;
            }

          },1000);
        }

        function setTooltip(cPoint,cMunicipality){

          var cYear = pointToYearMonth(cPoint)[0];
            var cMonth = pointToYearMonth(cPoint)[1];

          tooltip.select("#path-munci").text("Община: " +
                    cMunicipality)
                tooltip.select("#path-flowin").text("Нови регистрации: " +
                      extractData(cYear.toString(),cMonth,cMunicipality, 'FlowRegs'))
                tooltip.select("#path-flowout").text("Дерегистрации: " +
                      extractData(cYear.toString(),cMonth,cMunicipality, 'FlowDeregs'))
                tooltip.select("#path-month").text("Дата: " + months[cMonth-1])
                tooltip.select("#path-year").text(", " + cYear)
                return tooltip
                    .transition()
                    .style("opacity", 0.9);
        }

        function createSlider(){
          
          sliderScale = d3.scale.linear().domain([0,totalMonths]);

          var val = slider ? slider.value() : 0;

          slider = d3.slider()
            .scale(sliderScale)
            .on("slide",function(event,value){
              if ( isPlaying ){ clearInterval(interval); }

              currentPoint = Math.round(value);
              currentYear = pointToYearMonth(currentPoint)[0];
              currentMonth = pointToYearMonth(currentPoint)[1];
              datebox.select("#path-month").text("Дата: " + months[currentMonth-1])
                datebox.select("#path-year").text(", " + currentYear)
              updateCircles(extractMonth(currentYear.toString(), currentMonth).data);
            })
            .on("slideend",function(){
              if ( isPlaying ) animate();
            })
            .value(val);

          d3.select("#slider-div").remove();

          d3.select("#slider-container")
            .append("div")
            .attr("id","slider-div")
            .style("width", width/1.3 + "px")
            .call(slider);

          d3.select("#slider-div a").on("mousemove",function(){
            d3.event.stopPropagation();
          })

          var newAxis = d3.svg.axis()
          .scale(timeScale)
          .tickValues(
            timeScale.ticks(totalMonths).filter(function(d,i){
                return d.getMonth() == 0 || d.getMonth() == 3 || d.getMonth() == 6 || d.getMonth() == 9;
              })
          )
          .tickFormat(function(d){
              return months[d.getMonth()] + " " + d.getFullYear().toString().substr(2);
          })
          .tickSize(5);

          d3.select('#axis').remove();

          d3.select("#slider-container")
            .append("svg")
            .attr("id","axis")
            .attr("width",timeScale.range()[1]+20*2)
            .attr("height",70)
            .append("g")
              .attr("transform","translate(" + 20 + ",0)")
              .call(newAxis)
              .selectAll("text")
                .style("text-anchor","end")
                .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", function(d) {
                      return "rotate(-85)" 
                      })

                 d3.select('#axis path').remove();
        }

        function pointToYearMonth(point){
          if(point == 0){
            var cMonth = initialMonth;
              var cYear = initialYear;
              return [cYear, cMonth]  
          } else {
            var cMonth = point % 12==0 ? 12 : point % 12
            var increment = cMonth == 12 ? Math.floor(point/12)-1 : Math.floor(point/12)
              var cYear = initialYear + increment

              return [cYear, cMonth]  
          }
        }

        function createLegend(){
          var legend = g.append("g").attr("id","legend").attr("transform","translate(560,10)");

          legend.append("circle").attr("class","incre").attr("r",10).attr("cx",-85).attr("cy",10)
          legend.append("circle").attr("class","decre").attr("r",10).attr("cx",-85).attr("cy",30)

          legend.append("text").text("нарастване в броя регистрации").style("font-size", "12px").attr("x",-75).attr("y",13);
          legend.append("text").text("намаление в броя регистрации").style("font-size", "12px").attr("x",-75).attr("y",33);

        }



      };

      function addAttributions(){
        d3.select("#attributions")
          .html("<br><br>")
          .append("p")
          .text("Attribution: Картата е любезно предоставена от ")
          .style("font-size", "12px")
          .append("a")
          .attr({"href": "http://yurukov.net/blog/"})
          .text("Боян Юруков");
        d3.select("#attributions p")
          .append("p")
          .text("Attribution: Визуализацията е вдъхновена от ")
          .style("font-size", "12px")
          .append("a")
          .attr({"href": "http://tipstrategies.com/geography-of-jobs/"})
          .text("тук"); 
      }

  }());