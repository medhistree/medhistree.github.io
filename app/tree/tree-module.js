

angular.module('medhistree.treeModule', ['d3'])

.controller('familyTreeController', ['$http', '$scope', function($http) {
  var tree = this;
  tree.graph = {};

  $http.get("./tree/abbytree.json").success( function(data) {

    //Create the input graph
    var g = new dagreD3.graphlib.Graph()
      .setGraph({})
      .setDefaultEdgeLabel(function() { return {}; });

    // Add nodes for each of the people in the sample tree data
    data.forEach(function(person) {
      node = g.setNode(person.id, person);
    });

    g.nodes().forEach(function(v) {
      var node = g.node(v);
      // Round the corners of the nodes
      node.rx = node.ry = 5;
    });

     // Add our edges
    data.forEach(function(person) {
      person.kids.forEach(function(child) {
        g.setEdge(person.id, child);
      });
    });

    tree.graph = g;
  });
}])

.directive('familyTree', ['d3Service', '$window', function(d3Service, $window) {

  return {
    restrict: 'EA',
    templateUrl: './tree/family-tree.html',
    link: function(scope, element, attrs) {
      d3Service.d3().then(function(d3) {
        var initialScale = 0.75;

        var zoomAndPan = function(svg, g) {
          var inner = svg.select("g");
          zoom = d3.behavior.zoom().on("zoom", function() {
                inner.attr("transform", "translate(" + d3.event.translate + ")" +
                                            "scale(" + d3.event.scale + ")");
          });
          svg.call(zoom);

          // Set the appropriate zoom level and center
          zoom
            .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 40])
            .scale(initialScale)
            .event(svg);
        }

        // Browser resize event
        window.onresize = function() {
          scope.$apply();
        };

        // Watch for resize event
        scope.$watch(function() {
          return angular.element($window)[0].innerWidth;
        }, function() {
          render();
        });

        //watch for data changes and re-render
        scope.$watch('scope.treeCtrl.graph._nodes', function(value) {
          render();
        }, true);

        var render = function() {
          // If we don't pass any data, return before rendering
          var g = scope.treeCtrl.graph;
          if (!g || !g._nodes) { return; }

          // Set up an SVG group so that we can translate the final graph.
          var svg = d3.select("svg").style('width', '100%').style('height', '400px').append("g");

          // remove all previous items before render
          svg.selectAll('*').remove();

          // Run the renderer. This is what draws the final graph.
          var renderer = new dagreD3.render();
          renderer(d3.select("svg g"), g);

          // Set up the click handlers
          function click(d, i)
          {
            console.log(g.node(d).conditions); //considering dot has a title attribute
          }
          d3.selectAll("g.node").on("click", click);

          zoomAndPan(svg, g);
        };
      });
    }
  }
}]);

