    // Get width of target div
    var widthAsString = d3.select(".module-content").style("width")
    
    // Global variables

    var w = parseInt(widthAsString,10),
      h = w/2.25,
      w_sh = w/5,
      h_sh = w_sh;

    // define charts
    // first row
    var regionBubbleChart = dc.bubbleChart('#region-bubble-chart');
    // second row
    var betterOrWorsePieChart = dc.pieChart('#better-pie-chart');
    var yearlyRowChart = dc.rowChart('#yearly-row-chart');
    var bigregionPieChart = dc.pieChart('#bigregion-pie-chart');
    // third row
    var regionBarChart = dc.barChart('#region-bar-chart');

    // define crossfilter, dimensions, and groups
    var htx = null;
    var all = null;
    var regionDimension = null;
    var regionDimension2 = null;
    var regionPerformanceGroup = null;

    var betterOrWorse = null;
    var betterOrWorseGroup = null;
    
    var dateDimension = null;
    var dateFundingGroup = null;

    var medicsGroup = null;

    var bigregionDim = null;
    var bigregionCoverageGroup = null;

    // formats
    var dateFormat = d3.time.format('%Y');
    var numberFormatShort = d3.format('.1f');
    var numberFormatStd = d3.format('.2f');
    var numberFormatLong = d3.format('.4f');

    //coloring
    var pieColors = ['#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a'];

    loadData();

    function loadData(){
      d3.csv('data/dashboard.csv', function(error,data){

        data.forEach(function(d){
          // convert years to time variable
          d.year = dateFormat.parse(d.year);

          // convert to numberic variables
          var nonNumericVar = ['year','region','bigregion'];
          for(var key in d) {   
              if (d.hasOwnProperty(key)) {
                if (nonNumericVar.indexOf(key) === -1){
                  d[key] = +d[key];
                }
              }
          }

        }); // close forEach
        
        loadCrossfilter(data);

      }); // close read data callback function
    } // close loadData

    function loadCrossfilter(data){

    
      htx = crossfilter(data);  
      all = htx.groupAll();

      //dimension by region
        regionDimension = htx.dimension(function (d) { 
          return d.region;
          });

      //maintain running tallies by region as filters are applied or removed
        regionPerformanceGroup = regionDimension.group().reduce(
           
            // callback for when data is added to the current filter results
            function (p, v) {
                ++p.count;

                p.sumDiffRelMds += v.diffRelMds;
                p.avgDiffRelMds = (p.count === 0) ? 0 : p.sumDiffRelMds/p.count;

                p.sumDiffRelDeaths += v.diffRelDeaths;
                p.avgDiffRelDeaths = (p.count === 0) ? 0 : p.sumDiffRelDeaths/p.count;

          p.sumDiffNhifFunding += v.diffNhifFunding;
                p.avgDiffNhifFunding = (p.count === 0) ? 0 : p.sumDiffNhifFunding/p.count;

                return p;
            },

            //callback for when data is removed from the current filter results
            function (p, v) {
                --p.count;

                p.sumDiffRelMds -=  v.diffRelMds;
                p.avgDiffRelMds = (p.count === 0) ? 0 : p.sumDiffRelMds/p.count;

                p.sumDiffRelDeaths -= v.diffRelDeaths;
                p.avgDiffRelDeaths = (p.count === 0) ? 0 : p.sumDiffRelDeaths/p.count;

          p.sumDiffNhifFunding -= v.diffNhifFunding;
                p.avgDiffNhifFunding = (p.count === 0) ? 0 : p.sumDiffNhifFunding/p.count;

                return p;
            },

            // initialize
            function () {
                return {
                    sumDiffRelMds: 0,
                    avgDiffRelMds: 0,
                    sumDiffRelDeaths: 0,
                    avgDiffRelDeaths: 0,
                    sumDiffNhifFunding: 0,
                    avgDiffNhifFunding: 0,
                    count: 0
                };
            }

        ); // regionPerformanceGroup reduce function
      
      //dimension2 by region
        regionDimension2 = htx.dimension(function (d) { 
          return d.region;
          });

      regionFundingGroup = regionDimension2.group()
          .reduceSum(function (d) { return (d.nhifFunding/100000);})
          .orderNatural(); 
                // regionFundingGroup funding scaled to hundred of thousands
      
      
      // create categorical dimension to track death rate dynamics
        betterOrWorse = htx.dimension(function (d) {
            return d.diffRelDeaths > 0 ? 'Ръст' : 'Спад';
        });
        
        betterOrWorseGroup = betterOrWorse.group(); // betterOrWorse counts

      //dimension by year date
       
        dateDimension = htx.dimension(function (d) {
            return d3.time.year(d.year).getFullYear();
        });
      
        dateFundingGroup = dateDimension.group().reduceSum( function (d) {
                return (d.nhifFunding/100000); });
                // dateFundingGroup funding scaled to hundred of thousands

      // dimension by bigregion
        bigregionDim = htx.dimension(function (d) {
            return d.bigregion;
        });

        // group by total medical coverage within bigregion
        bigregionFundingGroup = bigregionDim.group().reduceSum( function (d) {
                return (d.nhifFunding/100000); }); 
                // bigregionFundingGroup funding scaled to hundred of thousands

        doCharts();
        addAttributions();

    } // close loadCrossfilter

    function doCharts(){

      // define region bubble chart

        regionBubbleChart
            .width(w)
            .height(h)
            .transitionDuration(1500)
            .margins({top: 10, right: 50, bottom: 30, left: 40})
            .dimension(regionDimension) 
            .group(regionPerformanceGroup)
            .colors(['#a6bddb','#1c9099']) 
            .colorDomain([-100, 250]) 
            .colorAccessor(function (p) { return p.value.avgDiffNhifFunding; })
            // X value
            .keyAccessor(function (p) { return p.value.avgDiffRelDeaths; })
            // Y value
            .valueAccessor(function (p) { return p.value.avgDiffRelMds; })
            .radiusValueAccessor(function (p) { return Math.abs(p.value.avgDiffNhifFunding); })
            .maxBubbleRelativeSize(0.2)
            .x(d3.scale.linear().domain([-500, 500]))
            .y(d3.scale.linear().domain([-100, 100]))
            .r(d3.scale.linear().domain([0, 1000]))
            .elasticY(true)
            .elasticX(true)
            .yAxisPadding(5)
            .xAxisPadding(5)
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            .xAxisLabel('Усреднена динамика на смъртността')
            .yAxisLabel('Усреднен прираст на осигуренността')
            .renderLabel(true)
            .label(function (p) {
                return p.key;
            })
            .renderTitle(true)
            .title(function (p) {
                return [
                    p.key,
                    'Усреднена динамика на смъртността: ' + numberFormatShort(p.value.avgDiffRelDeaths),
                    'Усреднен прираст на осигуренността: ' + numberFormatShort(p.value.avgDiffRelMds),
                    'Усреднен прираст на финансирането: ' + numberFormatShort(p.value.avgDiffNhifFunding) + 'стотици хил. лв.'
              ].join('\n');
            });
            //.yAxis().tickFormat(function (v) { return v; });


        // finished setting bubble chart parameters

        // define bigregion pie chart

        bigregionPieChart
            .width(w_sh)
            .height(h_sh)
            .radius((w_sh-20)/2)
            .dimension(bigregionDim)
            .group(bigregionFundingGroup)
            .ordinalColors(['#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a','#016c59']);
            

        // finished setting pie chart parameters

        // define yearly row chart

        yearlyRowChart
          .width(w_sh*1.5)
            .height(h_sh)
            //.margins({top: 20, left: 10, right: 10, bottom: 20})
            .group(dateFundingGroup)
            .dimension(dateDimension)
            .ordinalColors(['#b3cce5', '#9ebddc', '#88add3',
             '#739eca', '#5e8fc0', '#487fb7',
             '#3370ae', '#1d60a5', '#08519c'])
            .label(function (d) { return d.key; })
            .title(function (d) { return d.value; })
            .elasticX(true)
            .xAxis().ticks(4);

        // finished setting row chart parameters

        // define death rate dynamics pie chart

        betterOrWorsePieChart
            .width(w_sh)
            .height(h_sh)
            .radius((w_sh-20)/2)
            .dimension(betterOrWorse)
            .group(betterOrWorseGroup)
            .label(function (d) {
                if (betterOrWorsePieChart.hasFilter() && !betterOrWorsePieChart.hasFilter(d.key)) {
                    return d.key + '(0%)';
                }
                var label = d.key;
                if (all.value()) {
                    label += '(' + Math.floor(d.value / all.value() * 100) + '%)';
                }
                return label;
            });

        // finished setting pie chart parameters

        // define region bar chart

        regionBarChart
          .width(w)
            .height(h*0.8)
            .margins({top: 10, right: 30, bottom: 100, left: 50})
            .dimension(regionDimension2)
            .group(regionFundingGroup)
            .elasticY(true)
            .gap(1)
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .ordering(function(d) { return -d.value; })
            .renderlet(function (chart) {
              chart.selectAll("g.x text")
              .attr('dx', '-40')
              .attr('dy', '-7')
              .attr('transform', "rotate(-90)");
            });   
            // customize the filter displayed in the control span
            /*.filterPrinter(function (filters) {
                var filter = filters[0], s = '';
                s += numberFormat(filter[0]) + '% -> ' + numberFormat(filter[1]) + '%';
                return s;
            })*/

    // finished setting bar chart parameters
        
        dc.dataCount('.dc-data-count')
          //.width(960).height(800)
          .dimension(htx)
          .group(all)
              .html({
              some:'<strong>%filter-count</strong> записа избрани от <strong>%total-count</strong> записа' +
              ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>изчисти всички</a>',
              all:'Всички записи са селектирани. Натисни върху графика, за да филтрираш.'
          });


        dc.dataTable('#data-table')
          .dimension(dateDimension)
          .group(function (d) { return d.year.getFullYear(); })
          // .size(10) 
          .columns([
               {
                  label: 'Година', 
                  format: function (d) { 
                    return d.year.getFullYear(); }
              },
              {
                  label: 'Регион', 
                  format: function (d) { 
                    return d.region; }
              },
              {
                  label: 'Динамика лекари на хил. души спрямо предходната год', 
                  format: function (d) { 
                    return numberFormatStd(d.diffRelMds); }
              },
              {
                  label: 'Динамика смъртност на хил. души спрямо предходната год', 
                  format: function (d) { 
                    return numberFormatStd(d.diffRelDeaths); }
              },
              {
                  label: 'Динамика финансиране в стотици хиляди лева спрямо предходната год', 
                  format: function (d) { 
                    return d.diffNhifFunding; }
              }
          ])

          .sortBy(function (d) { return d.diffNhifFunding; })
          .order(d3.descending)
          .renderlet(function (table) {
              table.selectAll('.dc-table-group').classed('info', true);
          });

    dc.renderAll();
    } // close doCharts

    function addAttributions(){
        d3.select("#attributions")
          .html("<br><br>")
          .append("p")
          .text("Attributions: ")
          .style("font-size", "12px")
          .append("a")
          .attr({"href": "http://www.d3js.org"})
          .text("D3.js ");
       d3.select("#attributions p")
          .append("a")
          .attr({"href": "http://square.github.io/crossfilter/"})
          .text("Crossfilter.js ");
      d3.select("#attributions p")
          .append("a")
          .attr({"href": "https://dc-js.github.io/dc.js/"})
          .text("DC.js");
      }
