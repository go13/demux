var Graph = function (canvas) {

    this.nodeId = 0;

    this.edges = [];
    this.nodes = [];

    this.inputX = 20;
    this.yStep = 40;
    this.levelWidth = 50;
    this.canvas = canvas;

    var Node = function (id, canvas, obj, graph) {
        this.id = id;
        this.obj = obj;
        this.radius = 10;
        this.level = null;
        this.color = 'blue';
        this.canvas = canvas;
        this.graph = graph;

        this.x = 20;
        this.y = 20;

        this.setX = function (x) {
            this.x = x;
            return this;
        };
        this.setY = function (y) {
            this.y = y;
            return this;
        };
        this.setLabel = function (label) {
            this.label = label;
            return this;
        };
        this.setColor = function (color) {
            this.color = color;
            return this;
        };
        this.setLevel = function (level) {
            this.level = level;
            return this;
        };
        this.click = function () {
            this.graph.onClick.call(this);
        };
        this.draw = function (context) {
            context = context || this.canvas.getContext('2d');

            var lineWidth = 1;
            context.beginPath();
            context.arc(this.x, this.y, this.radius - lineWidth, 0, 2 * Math.PI, false);
            context.fillStyle = this.color;
            context.fill();
            context.lineWidth = lineWidth;
            context.strokeStyle = this.color;
            context.stroke();
        };
    };

    var Edge = function (from, to) {
        this.from = from;
        this.to = to;
        this.color = 'blue';

        this.setColor = function (color) {
            this.color = color;
            return this;
        };
        function drawArrow(context, fromx, fromy, tox, toy, color) {
            context.beginPath();
            context.moveTo(fromx, fromy);
            context.lineTo(tox, toy);
            context.lineWidth = 1;
            context.strokeStyle = color;
            context.stroke();
        }
        this.draw = function (context) {
            drawArrow(context, this.from.x, this.from.y, this.to.x, this.to.y, this.color)
        };
    };
    this.setOnClick = function (onClick) {
        this.onClick = onClick;
        return this;
    };
    this.onClick = function (value) {

    };

    this.addNode = function (node) {
        this.nodes.push(node);
        return node;
    };
    this.addEdge = function (edge) {
        this.edges.push(edge);
        return edge;
    };
    this.findEdge = function(from, to){
        for(var i = 0; i < this.edges.length; i++){
            var edge = this.edges[i];
            if(edge.to == to && edge.from == from){
                return edge;
            }
        }
        return null;
    };
    this.removeEdge = function (from, to) {
        var edge = this.findEdge(from, to);
        var ind = this.edges.indexOf(edge);
        if(ind >= 0){
            this.edges.splice(ind, 1);
        }
    };

    this.createEdge = function (from, to) {
        return this.addEdge(new Edge(from, to));
    };

    this.createNode = function (obj) {
        return this.addNode(new Node(++this.nodeId, this.canvas, obj, this));
    };
    this.position = function () {
        var levelMap = [];
        for (var i = 0; i < this.nodes.length; i++) {
            var node = this.nodes[i];
            if (node.level in levelMap) {
                levelMap[node.level]++;
            } else {
                levelMap[node.level] = 1;
            }
            node.setX(this.inputX + node.level * this.levelWidth).setY((levelMap[node.level]) * this.yStep);
        }
    };

    this.draw = function () {
        this.position();

        var context = this.canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].draw(context);
        }

        for (i = 0; i < this.edges.length; i++) {
            this.edges[i].draw(context);
        }
    };

    this.setInputX = function (x) {
        this.inputX = x;
        return this;
    };
    this.findNode = function (x, y) {
        var result = null;
        this.nodes.forEach(function (n) {
            if ((x - n.x) * (x - n.x) + (y - n.y) * (y - n.y) < n.radius * n.radius) {
                result = n;
            }
        });
        return result;
    };
    this.findNodeByObj = function (obj) {
        var result = null;
        this.nodes.forEach(function (n) {
            if (n.obj == obj) {
                result = n;
            }
        });
        return result;
    };
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    this.init = function () {
        var self = this;
        canvas.addEventListener('click', function (evt) {
            var pos = getMousePos(self.canvas, evt);
            var n = self.findNode(pos.x, pos.y);
            if (n != null) {
                self.onClick.call(n);
            }
        }, false);
        return this;
    }
};
