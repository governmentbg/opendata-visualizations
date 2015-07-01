$(function(){

      // Hardcoded color scheme for the sun-burst chart
      var sunColors = {"Болнична инфраструктура": "#FFFFFF",
        "2001": "#f7fbff",
        "2002": "#e6f2fa",
        "2003": "#d5e9f4",
        "2004": "#c4dfef",
        "2005": "#b3d6e9",
        "2006": "#a2cde4",
        "2007": "#91c4df",
        "2008": "#80bad9",
        "2009": "#6fb1d4",
        "2010": "#5ea8ce",
        "2011": "#4d9fc9",
        "2012": "#3c95c3",
        "2013": "#2b8cbe",
        "2014": "#2584AF",        

        "Лечебни заведения за болнична помощ": "#02818a",
        "Лечебни заведения за извънболнична помощ": "#4eb3d3",
        "Други лечебни и здравни заведения": "#5ca793",

        "Болници": "#67a9cf",
        "Диспансери за белодробни болести": "#3690c0",
        "Други заведения за болнична помощ": "#a6bddb",
        "Комплексни онкологични центровe": "#d0d1e6",
        "Центрове за кожно-венерически заболявания": "#ece2f0",
        "Центрове за психично здравe": "#fff7fb",

        "Дентални центрове": "#7bccc4",
        "Диагностично-консултативни центрове": "#a8ddb5",
        "Медико-дентални центрове": "#ccebc5",
        "Медицински центрове": "#e0f3db",
        "Самостоятелни медико-диагностични и медико-технически лаборатории": "#f7fcf0",

        "Домове за медико-социални грижи за деца": "#f7fcf0",
        "Национални центрове без легла": "#2b8cbe",
        "Регионални здравни инспекции": "#ccebc5",
        "Регионални инспекции за опазване и контрол на общественото здраве": "#a8ddb5",
        "Регионални центрове по здравеопазване": "#7bccc4",
        "Хосписи": "#4eb3d3",
        "Центрове за спешна медицинска помощ": "#e0f3db",

        "Многопрофилни болници": "#016c59",
        "Специализирани болници": "#014636",

        "Други": "#FAFCFF"};

      // Get width of target div

      var widthAsString = d3.select(".module-content").style("width")

      // Global variables for the tree chart

      var width = parseInt(widthAsString,10),
          height = 400,
          x = d3.scale.linear().range([0, width]),
          y = d3.scale.linear().range([0, height]),
          i=0;

      // Global Variables for the sunburst chart
      var radius = Math.min(width, height) / 2,
        numberFormatLong = d3.format(',');

      // Define external variables specific for Tree chart
      var tree = d3.layout.tree()
          .size([height, width]);

      var diagonal = d3.svg.diagonal()
          .projection(function(d) { return [d.y, d.x]; });

      var treeVis = d3.select("#tree-graph").append("svg:svg")
          .attr("width", width)
          .attr("height", height)
        .append("svg:g")
          .attr("transform", "translate(" + 0.15*width + "," + 0 + ")");


      // Define external variables specific for SunBurst chart
      // Introduce the svg canvas
      var svg = d3.select("#sun-graph").append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");


      // Define initial datafile to be loaded
      var initialTreeFile = "data/infrastructure_tree.json"
      var initialDataFile = "data/infrastructure_bg.json"

      function updateTreeGraph(dataFile){
 
        d3.json(dataFile, function(error, root) {

          treeRoot = root;
          treeRoot.x0 = height / 2;
          treeRoot.y0 = 0;

          // Initialize the display to show a few nodes.
          treeRoot.children.forEach(toggleAll);
          toggle(treeRoot.children[0]);
          toggle(treeRoot.children[1]);

          updateTree(treeRoot);

          function updateTree(source) {
            var duration = d3.event && d3.event.altKey ? 5000 : 500;

            // Compute the new tree layout.
            var nodes = tree.nodes(treeRoot).reverse();

            // Normalize for fixed-depth.
            nodes.forEach(function(d) { d.y = d.depth * 140; });

            // Update the nodes…
            var node = treeVis.selectAll("g.node")
                .data(nodes, function(d) { return d.id || (d.id = ++i); });

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().append("svg:g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .on("click", function(d) { toggle(d); updateTree(d); });

            nodeEnter.append("svg:circle")
                .attr("r", 1e-6)
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeEnter.append("svg:text")
                .attr("x", function(d) { 
                  if(d.depth == 1 ){
                    coordinate =  0;
                  }else{
                    coordinate = d.children || d._children ? 0 : 10;
                  }
                  return coordinate})

                .attr("y", function(d) {
                  if(d.depth == 1 ){
                    coordinate =  10;
                  }else{
                    coordinate = d.children || d._children ? -10 : 0;
                  }
                  return coordinate})
                .attr("dy", ".35em")
                .attr("text-anchor", function(d) { return d.children || d._children ? "middle" : "start"; })
                .text(function(d) { return d.name; })
                .style("fill-opacity", 1e-4);

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", 4.5)
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update node links
            var link = treeVis.selectAll("path.link")
                .data(tree.links(nodes), function(d) { return d.target.id; });

            // Enter any new links at the parent's previous position.
            link.enter().insert("svg:path", "g")
                .attr("class", "link")
                .attr("d", function(d) {
                  var o = {x: source.x0, y: source.y0};
                  return diagonal({source: o, target: o});
                })
              .transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function(d) {
                  var o = {x: source.x, y: source.y};
                  return diagonal({source: o, target: o});
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
              d.x0 = d.x;
              d.y0 = d.y;
            });
          }

          // Toggle children.
          function toggle(d) {
            if (d.children) {
              d._children = d.children;
              d.children = null;
            } else {
              d.children = d._children;
              d._children = null;
            }
          }

            function toggleAll(d) {
              if (d.children) {
                d.children.forEach(toggleAll);
                toggle(d);
              }
            }
        });

      };



      function updateGraph(dataFile){

        // Select Tooltip
        var tooltip = d3.select("#sun-tooltip")

        //Introduce scalar transforms
        var xScale = d3.scale.linear()
            .range([0, 2 * Math.PI]);

        var yScale = d3.scale.sqrt()
            .range([0, radius]);

        // Introduce initial layout
        var partition = d3.layout.partition()
          .sort(d3.ascending())
          .value(function(d) { return d.count; });

        // Define arcs
        var arc = d3.svg.arc()
            .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, xScale(d.x))); })
            .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, xScale(d.x + d.dx))); })
            .innerRadius(function(d) { return Math.max(0, yScale(d.y)); })
            .outerRadius(function(d) { return Math.max(0, yScale(d.y + d.dy)); });  

        // Track root node
        var node;


        d3.json(dataFile, function(error, root) {

          node = root;

          var path = svg.datum(root).selectAll("path")
            .data(partition.nodes)
              .enter().append("path")
                .attr("d", arc)
                .style("fill", function(d) { return sunColors[d.name]; })
                  //function(d) { return color((d.children ? d : d.parent).name); })
                .each(stash)
                .on("click", clickSun)
                 .on("mouseover", function(d) {
                      tooltip.select("#sun-heading").text(d.name)
                      tooltip.select("#sun-value").text(numberFormatLong(d.value))
                      return tooltip
                        .transition()
                        .duration(50)
                        .style("opacity", 0.9);
                  })
                  .on("mousemove", function(d) {
                      return tooltip
                        //.style("top",(d3.event.pageY-height/2)+"px")
                        .style("top",(d3.event.pageY - height*0.6)+"px")
                        .style("left",(d3.event.pageX - width*0.6)+"px");
                  })
                  .on("mouseout", function(){return tooltip.style("opacity", 0);});

            function clickSun(d) {
              node = d;
              path.transition()
                .duration(750)
                .attrTween("d", arcTweenClick(d));
            }


          // on change

          d3.selectAll("input").on("change", function change() {
                var val = this.value === "count"
                    ? function(d) { return d.count; }
                    : function(d) { return d.beds; };

                path
                    .data(partition.value(val).nodes) 
                  .transition()
                    .duration(750)
                    .attrTween("d", arcTweenData);

            });   

        });

        // Interpolate the scales!
        function arcTweenClick(d) {
          var xd = d3.interpolate(xScale.domain(), [d.x, d.x + d.dx]),
              yd = d3.interpolate(yScale.domain(), [d.y, 1]),
              yr = d3.interpolate(yScale.range(), [d.y ? 20 : 0, radius]);
          return function(d, i) {
            return i
                ? function(t) { return arc(d); }
                : function(t) { xScale.domain(xd(t)); yScale.domain(yd(t)).range(yr(t)); return arc(d); };
          };
        }

        // Stash the old values for transition.
        function stash(d) {
          d.x0 = d.x;
          d.dx0 = d.dx;
        }

        // Interpolate the arcs in data space.
        function arcTweenData(a,i) {
          var interp = d3.interpolate({x: a.x0, dx: a.dx0}, a);
          function tween (t) {
            var b = interp(t);
            a.x0 = b.x;
            a.dx0 = b.dx;
            return arc(b);
          }
          if (i == 0) {
              var xd = d3.interpolate(xScale.domain(), [node.x, node.x + node.dx]);
              return function(t) {
                xScale.domain(xd(t));
                return tween(t);
              };
          } else {
              return tween;
          }
        }

      }

      updateTreeGraph(initialTreeFile);
      updateGraph(initialDataFile);

      d3.select("#attributions")
        .html("<br><br>")
        .append("p")
        .text("Attribution: ")
        .style("font-size", "12px")
        .append("a")
        .attr({"href": "http://www.d3js.org"})
        .text("D3.js");

      d3.select(self.frameElement).style("height", height + "px");



}());