octagon_simulator = function (radius, margin) {
    this.radius = radius || 100;
    this.margin  = margin  || 10;

    this.$area = $('div#octagon_simulator').append('<svg></svg>');
    this.$svg = this.$area.Children('svg')
        .addClass('stick_input_display')
        .attr('width', this.margin * 2 + this.radius)
        .attr('height', this.margin * 2 + this.radius);
    this.$octa = this.$svg.children('svg').append('<g></g>');
    
    

    this.initialize();
};

octagon_simulator.prototype = {
    initialize: function () {
        this.$octa.append('<polygon>').addClass('background');
        this.$octa.append('<line>').addClass('deadzone_x');
        this.$octa.append('<line>').addClass('deadzone_y');
        this.$octa.append('<polygon>').addClass('octagon');
        this.$octa.append('<line>').addClass('input_line');
        this.$octa.append('<circle>').addClass('input_circle');
    }
};
