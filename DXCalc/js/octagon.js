OctagonSimulator = function (opts) {
    opts = opts || {};
    this.opts = $.extend({
        diameter: 100,
        margin: 10,
        stroke_width: 4,
        type: 'plain'
    }, opts);

    var diameter = this.opts.diameter;
    var margin = this.opts.margin;
    var sum = margin * 2 + diameter;
    var center = sum / 2;
    var diagonal = this.opts.diameter * 35 / 100;
    this.each_octagon_coordinate = {
        left:         { x: margin, y: center },
        upper_left:  { x: center - diagonal , y: center - diagonal },
        up:           { x: center, y: margin },
        upper_right: { x: center + diagonal, y: center - diagonal },
        right:        { x: sum - margin, y: center },
        lower_right: { x: center + diagonal, y: center + diagonal },
        bottom:       { x: center, y: sum - margin },
        lower_left:  { x: center - diagonal, y: center + diagonal }
    };
    for (var i in this.each_octagon_coordinate) {
        this.each_octagon_coordinate[i].xy = this.each_octagon_coordinate[i].x + ',' + this.each_octagon_coordinate[i].y;
    }

    this.octagon_coordinates = this.each_octagon_coordinate.left.xy +
                         ' ' + this.each_octagon_coordinate.upper_left.xy +
                         ' ' + this.each_octagon_coordinate.up.xy +
                         ' ' + this.each_octagon_coordinate.upper_right.xy +
                         ' ' + this.each_octagon_coordinate.right.xy +
                         ' ' + this.each_octagon_coordinate.lower_right.xy +
                         ' ' + this.each_octagon_coordinate.bottom.xy +
                         ' ' + this.each_octagon_coordinate.lower_left.xy;
    this.deadzone_width = diameter * 22 / 5;
    this.sum = sum;
    this.center = center;
    this.diagonal = diagonal;
    this.xy_deadzone_width = diameter * 275 / 1000;

    this.initialize();
};

OctagonSimulator.prototype = {
    initialize: function () {
        var $area = $('div.octagon_simulator.' + this.opts.type).html(
            '<svg class="octagon_simulator stick_input_display" width="' + this.sum + '" height="' + this.sum + '">' +
            '    <g>' +
            '        <polygon class="octagon_simulator background" points="' + this.octagon_coordinates + '" fill="#eee" stroke="gray" stroke-width="0" />' +
            '        <line class="octagon_simulator deadzone_x" x1="' + this.center + '" y1="' + 0 + '" x2="' + this.center + '" y2="' + this.sum + '" stroke="#06F" stroke-width="' + this.xy_deadzone_width + '" opacity="0.1" />' +
            '        <line class="octagon_simulator deadzone_y" x1="' + 0 + '" y1="' + this.center + '" x2="' + this.sum + '" y2="' + this.center + '" stroke="#f6f" stroke-width="' + this.xy_deadzone_width + '" opacity="0.1" />' +
            '        <polygon class="octagon_simulator octagon" points="' + this.octagon_coordinates + '" fill="none" stroke="gray" stroke-width="4" />' +
            '        <line class="octagon_simulator input_line" x1="' + this.center + '" y1="' + this.center + '" x2="' + this.center + '" y2="' + this.center + '" stroke="#f00" stroke-width="1" />' +
            '        <circle class="octagon_simulator input_circle" cx="' + this.center + '" cy="' + this.center + '" r="1" fill="gray" />' +
            '        <ellipse class="octagon_simulator stick_circle" cx="' + this.center + '" cy="' + this.center + '" rx="' + (this.opts.diameter / 3) + '" ry="' + (this.opts.diameter / 3) + '" fill="none" stroke="silver" stroke-width="2" opacity=0.1" />' +
            '        <ellipse class="octagon_simulator stick_circle" cx="' + this.center + '" cy="' + this.center + '" rx="' + (this.opts.diameter / 4) + '" ry="' + (this.opts.diameter / 4) + '" fill="none" stroke="silver" stroke-width="4" opacity="0.3" />' +
            '        <ellipse class="octagon_simulator stick_circle" cx="' + this.center + '" cy="' + this.center + '" rx="' + (this.opts.diameter / 6) + '" ry="' + (this.opts.diameter / 6) + '" fill="none" stroke="silver" stroke-width="4" opacity="0.3" />' +
            '        <ellipse class="octagon_simulator stick_circle" cx="' + this.center + '" cy="' + this.center + '" rx="' + (this.opts.diameter / 10) + '" ry="' + (this.opts.diameter / 10) + '" fill="none" stroke="silver" stroke-width="4" opacity="0.3" />' +
            '    </g>' +
            '</svg>'
        );

        this.register_event_handlers();
    },

    register_event_handlers: function () {
        var that = this;

        // スティック入力値の変更
        $('.octagon_simulator.stick_value').on('change', function () {
            var $x = $('#stick_value_x');
            var $y = $('#stick_value_y');
            var x = $x.val();
            var y = $y.val();

            // 入力値がデットゾーンか否かで背景色変更
            $x.css('backgroundColor', Math.abs(x) <= 0.275 ? 'silver' : 'white');
            $y.css('backgroundColor', Math.abs(y) <= 0.275 ? 'silver' : 'white');

            var $svg = $('svg.octagon_simulator.stick_input_display');
            var svg_size = Math.max($svg.attr('width'), $svg.attr('height'));
            // 中央から入力点までのライン
            $('.octagon_simulator.input_line')
                .attr('x2', x * (that.opts.diameter / 2) + (svg_size / 2))
                .attr('y2', -y * (that.opts.diameter / 2) + (svg_size / 2))
                .attr('stroke', (Math.abs(x) <= 0.275 && Math.abs(y) <= 0.275 ? 'gray' : 'red'));

            // 入力点
            $('.octagon_simulator.input_circle')
                .attr('cx', x * (that.opts.diameter / 2) + (svg_size / 2))
                .attr('cy', -y * (that.opts.diameter / 2) + (svg_size / 2))
                .attr('fill', (Math.abs(x) <= 0.275 && Math.abs(y) <= 0.275 ? 'gray' : 'red'));

            // スティックのビジュアル
            $('.octagon_simulator.stick_circle')
                .attr('cx', x * (that.opts.diameter / 2) + (svg_size / 2))
                .attr('cy', -y * (that.opts.diameter / 2) + (svg_size / 2));
        });
    }
};
