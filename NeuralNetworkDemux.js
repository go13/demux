/**
 * Created by dmytro on 09/12/2014.
 */
function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

function rgbToHex(R, G, B) {
    return "#" + toHex(R) + toHex(G) + toHex(B)
}

function toHex(n) {
    if (isNaN(n)) return "00";
    n = Math.max(0, Math.min(n, 255));
    return "0123456789ABCDEF".charAt((n - n % 16) / 16) + "0123456789ABCDEF".charAt(n % 16);
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

var NeuralNetwork = function () {
        var funct = sigmoid;

        var Neuron = function (id) {

            var Synapse = function (w, ni, no) {
                assert(!isNaN(w), "A weight is not a number!");
                this.w = w;
                this.ni = ni;
                this.no = no;
            };
            this.id = id;
            this.val = false;
            this.inputs = [];
            this.outputs = [];
            this.calculated = true;
            this.learned = false;
            this.partial = false;

            this.onAddSynapse = function (synapse) {
            };
            this.setOnAddSynapse = function (onAddSynapse) {
                this.onAddSynapse = onAddSynapse;
                return this;
            };
            this.onRemoveSynapse = function (synapse) {
            };
            this.setOnRemoveSynapse = function (onRemoveSynapse) {
                this.onRemoveSynapse = onRemoveSynapse;
                return this;
            };

            this.addSynapse = function (neuron, weight) {
                var synapse = new Synapse(weight, neuron, this);
                this.inputs.push(synapse);
                //this.onAddSynapse(synapse);
                return synapse;
            };
            this.addOutput = function (synapse) {
                this.outputs.push(synapse);
            };
            this.getOutputs = function () {
                return this.outputs;
            };
            this.addInput = function (neuron, weight) {
                this.inputs.push(new Synapse(weight, neuron));
            };
            this.getSynapse = function (i) {
                return this.inputs[i];
            };
            this.getVal = function () {
                return this.val;
            };
            this.setVal = function (v) {
                this.val = v;
                this.onValChange(v);
                return v;
            };
            this.getDepthFromRoot = function(nodeSet){
                if(nodeSet[this.id] == undefined) {
                    var d = 0;
                    for (var i = 0; i < this.inputs.length; i++) {
                        var nd = this.inputs[i].ni.getDepthFromRoot(nodeSet) + 1;
                        if (d < nd) {
                            d = nd;
                        }
                    }
                    nodeSet[this.id] = d;
                    return d;
                } else {
                    return nodeSet[this.id];
                }
            };
            this.getDepth = function(){
                return this.getDepthFromRoot([]);
            };
            this.onValChange = function (nVal) { };
            this.setOnValChange = function (onValChange) {
                this.onValChange = onValChange;
                return this;
            };

            this.reset = function () {
                if (this.inputs.length > 0) {
                    this.calculated = false;
                    this.learned = false;
                    this.setVal(false);

                    for (var i = 0; i < this.inputs.length; i++) {
                        this.inputs[i].ni.reset();
                    }
                }
            };

            this.isLearned = function () {
                return this.learned;
            };
            this.setLearned = function (learned) {
                this.learned = learned;
            };

            this.isPartial = function () {
                return this.partial;
            };

            this.link = function (node, weight) {
                var synapse = this.addSynapse(node, weight);
                node.addOutput(synapse);
                return synapse;
            };

            this.unlink = function (synapse) {
                synapse.ni.outputs.splice(synapse.ni.outputs.indexOf(synapse), 1);
                this.inputs.splice(this.inputs.indexOf(synapse), 1);
                return synapse;
            };

            this.canSeeNodeBackwardsFromRoot = function (node) {
                return this.canSeeNodeBackwards(node, []);
            };

            this.canSeeNodeBackwards = function (node, nodeSet) {
                if (nodeSet[this.id] == undefined) {
                    nodeSet[this.id] = node;

                    if (node.id == this.id)
                        return true;

                    for (var i = 0; i < this.inputs.length; i++) {
                        var synapse = this.inputs[i];
                        if (synapse.ni.canSeeNodeBackwards(node, nodeSet)) {
                            return true;
                        }
                    }
                }
                return false;
            };

            this.calc = function () {
                if (this.inputs.length > 0 && !this.calculated) {
                    var activeNum = 0;
                    this.partial = false;
                    var nVal = true;

                    for (var i = 0; i < this.inputs.length; i++) {
                        var s = this.inputs[i];

                        var by = s.ni.calc();
                        var w = s.w;

                        var active = by == w;

                        if (active) {
                            activeNum++;
                            if (activeNum > 1) {
                                this.partial = true;
                            }
                        }

                        nVal = nVal && active;

                        if (nVal) {
                            this.partial = false;
                        }
                        this.calculated = true;
                    }
                    return this.setVal(nVal);
                } else {
                    return this.val;
                }
            }
        };

        this.inputs = [];
        this.outputs = [];
        this.neuronId = 0;

        this.learn = function () {
            var front = this.inputs.slice();
            var nextFront = [];

            var newNode = this.abstractNeuronCreate();
            var network = this;
            var newNeurons = [];
            var newSynapses = [];
            var removedSynapses = [];
            //newNeurons.push(newNode);

            while (front.length > 0) {

                front.forEach(function (node) {
                    var outputs = node.getOutputs();

                    outputs.forEach(function (next) {
                        var nextNode = next.no;

                        if (!nextNode.isLearned()) {

                            if (nextNode.getVal()) {

                                nextFront[nextNode.id] = nextNode;

                            } else if (nextNode.isPartial()) {

                                var splitNode = network.splitNode(nextNode, newNode, newSynapses, removedSynapses);
                                newNeurons.push(splitNode);
                            }

                        }
                    });
                });

                front = nextFront;
                nextFront = [];
            }
            this.inputs.forEach(function (node) {
                if (!newNode.canSeeNodeBackwardsFromRoot(node)) {
                    newSynapses.push(newNode.link(node, node.getVal()));
                }
            });

            this.outputs.push(newNode);

            this.onOutputCreate(newNode.id, newNode);

            for(var i = 0; i < newNeurons.length; i++){
                var n = newNeurons[i];
                this.onNeuronAdded(n.id, n);
            }

            for(i = 0; i < newSynapses.length; i++){
                this.onAddSynapse(newSynapses[i]);
            }

            for(i = 0; i < removedSynapses.length; i++){
                this.onRemoveSynapse(removedSynapses[i]);
            }


            return this;
        };

        this.splitNode = function (oldParent, newParent, newSynapses, removedSynapses) {
            var toRemove = [];
            var toLeave = [];
            var newNode = this.abstractNeuronCreate();

            oldParent.inputs.forEach(function (synapse) {
                if (synapse.ni.getVal() == synapse.w) {
                    toRemove.push(synapse);
                } else {
                    toLeave.push(synapse);
                }
            });

            if (toRemove.length > 1) {
                toRemove.forEach(function (synapse) {
                    removedSynapses.push(oldParent.unlink(synapse));
                    newSynapses.push(newNode.link(synapse.ni, synapse.ni.getVal()));
                });
                newSynapses.push(oldParent.link(newNode, true));
                newSynapses.push(newParent.link(newNode, true));
            }

            if (toRemove.length == 1) {
                newSynapses.push(newParent.link(toRemove[0], true));
            }

            oldParent.setLearned(true);

            return newNode;
        };

        this.calc = function () {
            for (var i = 0; i < this.outputs.length; i++) {
                this.outputs[i].reset();
            }
            for (i = 0; i < this.outputs.length; i++) {
                this.outputs[i].calc();
            }
        };

        this.initialize = function (inputNumber) {
            this.inputNumber = inputNumber;

            for (var i = 0; i < this.inputNumber; i++) {
                var neuron = this.createInput();
                this.inputs.push(neuron);
            }

            return this;
        };

        this.abstractNeuronCreate = function(){
            var id = this.neuronId++;
            return new Neuron(id)
                .setOnValChange(this.onValChange)
                .setOnAddSynapse(this.onAddSynapse)
                .setOnRemoveSynapse(this.onRemoveSynapse);
        };

        this.createOutput = function(){
            var neuron = this.abstractNeuronCreate();
            this.onOutputCreate(neuron.id, neuron);
            return neuron;
        };

        this.createInput = function(){
            var neuron = this.abstractNeuronCreate();
            this.onInputCreate(neuron.id, neuron);
            return neuron;
        };

        this.createNeuron = function () {
            var neuron = this.abstractNeuronCreate();
            this.onNeuronAdded(neuron.id, neuron);
            return neuron;
        };

        this.setInput = function (arr) {
            for (var i = 0; i < this.inputs.length; i++) {
                var inp = arr[i];
                this.inputs[i].setVal(inp);
            }
        };

        this.onInputCreate = function (id, neuron) { };
        this.setOnInputCreate = function (onInputCreate) {
            this.onInputCreate = onInputCreate;
            return this;
        };
        this.onOutputCreate = function (id, neuron) { };
        this.setOnOutputCreate = function (onOutputCreate) {
            this.onOutputCreate = onOutputCreate;
            return this;
        };

        this.onValChange = function (nVal) { };
        this.setOnValChange = function (onValChange) {
            this.onValChange = onValChange;
            return this;
        };

        this.onNeuronAdded = function (id, neuron) { };
        this.setOnNeuronAdded = function (onNeuronAdded) {
            this.onNeuronAdded = onNeuronAdded;
            return this;
        };

        this.onAddSynapse = function (synapse) {
        };
        this.setOnAddSynapse = function (onAddSynapse) {
            this.onAddSynapse = onAddSynapse;
            return this;
        };

        this.onRemoveSynapse = function (synapse) {
        };
        this.setOnRemoveSynapse = function (onRemoveSynapse) {
            this.onRemoveSynapse = onRemoveSynapse;
            return this;
        };

        this.getOutput = function (i) {
            return this.outputs[i].getVal();
        };
    };
