
$(function(){

    // Source files
    var recodeSource = 'data/recodeRegions.json';
    var choroplethData = 'data/coverage_bg.json';

    // Data handlers
    var dataFull = null;
    var dataSourceGeo = null;
    var tmpData = null;
    var dataGeo = null;
    var recodeRegions = null;

    // pre-set helpers
    // heplers
    var year = '2014';
    var colToShow = 2;
    var selRegion = 'BG-01';
    var globalSelVariable = 'MDs'

    // Chart handlers
    var chartGeo = null;
    var chartFocusLine = null; //indicates if chart is present

    // Get width of target div
    var widthAsString = d3.select(".module-content").style("width")

    // Width and height
    var w = parseInt(widthAsString,10),
        h = w/1.75  ;

    // Select divs
    var map = d3.select("#MapBG");
    var lineChart = d3.select("#LineMap");

    google.load("visualization", "1", {packages:["geochart"]}); 
    google.setOnLoadCallback(loadData);

    function loadData(){
      loadBGnames();
    }

    function loadBGnames(){
      d3.json(recodeSource, function(error, data){
        recodeRegions = data;
        loadExternalData();
      });
    }

    function loadExternalData(){
      d3.json(choroplethData, function(error,data){

        dataFull = data;

        for (var i=0;i<data.data.length;i++){
          if(data.data[i].Year==year){
            tmpData=data.data[i].data
          }
        }
        
        // Convert to chart friendly array format
        dataSourceGeo = new Array();
        tmpData.forEach(function(entry) {
            // add Region names in bulgarian
            entry.Region = {v: entry.Region, f: recodeRegions[entry.Region].SubdivisionNameBg };
            // dump unnecessary data
            delete entry["Дентални лекари"];
            delete entry["Фелдшери"];
            delete entry["Акушерки"];
            delete entry["Медицински сестри"];
            delete entry["Лаборанти"];
            delete entry["Зъботехници"];
            delete entry["Санитарни инспектори"];
            delete entry["Други"];

              dataSourceGeo.push(toArray(entry));
        });


        withLoadedData();

      }); 
    }


    function withLoadedData(){
      //console.log(dataSourceGeo);
      dataGeo = new google.visualization.DataTable();
      
      // Add headers
      dataGeo.addColumn({label:'RegionID', type: 'string', role: 'domain'})
      dataGeo.addColumn({label:'Лекари', type: 'number', role: 'data'})
      
      // Append data
      dataGeo.addRows(dataSourceGeo);
      drawRegionsMap();
      addAttributions();
    }
    
    // Helper function to convert data on the fly
    
    function toArray(obj){
        return Object.keys(obj).map(function(k) { return obj[k] });
    }

    function drawRegionsMap() {

      var options = {
        width: w,
        height: h,  
            sizeAxis: { minValue: 0, maxValue: 100 },
            region: "BG", // Zoomin on Bulgaria
            resolution:"provinces", // Map resolution
            colorAxis: {colors: ['#FFFF00', '#008000']} // orange to blue
        };

      var chartGeo = new google.visualization.GeoChart(map[0][0]);
      google.visualization.events.addListener(chartGeo, 'regionClick', drawLineChart);

      chartGeo.draw(dataGeo, options);
    }
    
    function toLineData(data, selectedRegion, areaIndicator, selVariable){

      //set default value of areaIndication in case not defined
      selectedRegion = typeof selectedRegion !== 'undefined' ? selectedRegion : selRegion;
      areaIndicator = typeof areaIndicator !== 'undefined' ? areaIndicator : false;
      selVariable = typeof selVariable !== 'undefined' ? selVariable : globalSelVariable;

      var LineArray = new Array();
      var tmpValue = null;

      for (var i=0;i<data.data.length;i++){
        _year = data.data[i].Year;
        for (var j=0;j<data.data[i].data.length;j++){
          if(data.data[i].data[j].Region == selectedRegion){
            tmpValue = data.data[i].data[j][selVariable];
          }
        }
        LineArray.push({x: _year, y:tmpValue});
      }

      return { area: areaIndicator, key: selVariable, values: LineArray};
    }

    function drawLineChart(region) {
      if (region.region.substring(0,2)!="BG") {return;}

      if (chartFocusLine === null){

        nv.addGraph(function() {
              
              chartFocusLine = nv.models.lineWithFocusChart();
              
              // Set basic chart parameters
              chartFocusLine._options.focusHeight = 40;
              
              var ddata = new Array();

              ["Лекари","Дентални лекари","Фелдшери", "Акушерки", "Медицински сестри", "Лаборанти", "Зъботехници", "Санитарни инспектори", "Други"].forEach(function(entry){
                ddata.push(toLineData(dataFull,region.region,false,entry));
              });

              // Draw base chart
              lineChart
                .append('svg')
                .style('height',h)
                  //.datum([toLineData(dataFull,region.region,false,"Dental.MDs")])
                  .datum(ddata)
                  .call(chartFocusLine);

                nv.utils.windowResize(chartFocusLine.update);

            return chartFocusLine;
          });

      }else{

        var ddata = new Array();

            ["Лекари","Дентални лекари","Фелдшери", "Акушерки", "Медицински сестри", "Лаборанти", "Зъботехници", "Санитарни инспектори", "Други"].forEach(function(entry){
              ddata.push(toLineData(dataFull,region.region,false,entry));
            });

        lineChart.datum(ddata)
        .transition()
        .duration(500)
        .call(chartFocusLine);
      }

    }

    function addAttributions(){
      d3.select("#attributions")
        .html("<br><br>")
        .append("p")
        .text("Attribution: ")
        .append("a")
        .attr({"href": "http://www.nvd3.org/"})
        .text("NVD3.js");
    }

}());