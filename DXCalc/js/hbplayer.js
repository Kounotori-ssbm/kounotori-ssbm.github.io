HBPlayer = function (id) {
    if (id) {
        id = '#' + id;
        this.video_id = id;
    } else {
        id = '';
        this.video_id = '';
    }

    this.letter = {
        play: '&#9658;',
        pause: '<b>||</b>',
        stop: '&#9637;',
        previous: '|&#9668;',
        next: '&#9658;|'
    };

    this.video = $('video.hbplayer' + id);
    this.v = this.video.get(0);
    this.duration;
    this.initialize();
};

HBPlayer.prototype = {
    initialize: function () {
        var that = this;
        this.append_ui();
        this.register_event_handlers();
        this.video.on('timeupdate', function () {
            that.duration = Math.floor(that.v.duration * 60);
            $('span.duration').text(that.duration);
        });
    },


    register_event_handlers: function () {
        var that = this;

        this.video.on('click', function () {
            that.play_pause_toggle();
        });
        $('button.play_pause').on('click', function () {
            that.play_pause_toggle();
        });
        $('button.stop').on('click', function () {
            that.stop();
        });
        $('button.previous_frame').on('click', function () {
            that.previous_frame();
        });
        $('button.next_frame').on('click', function () {
            that.next_frame();
        });
        $('input.speed').on('change', function () {
            that.speed_change();
        });

        // キー入力
        $(document).on('keydown', function (e) {
            if (e.shiftKey) {
                switch (e.keyCode) {
                    //case x: that.(); break;
                    case 37: that.previous_frame(); break;
                    case 39: that.next_frame(); break;
                    case 38: that.speed_up(); break;
                    case 40: that.speed_down(); break;
                }
            } else if (e.ctrlKey) {
                switch (e.keyCode) {
                    case 32: that.play_pause_toggle(); break;
                }
            }
        });

    }, 

    current_frame: function () {
        var current_frame = 1 + Math.floor(this.v.currentTime * 60);
        return current_frame < this.duration ? current_frame : 1;
    },

    play_pause_toggle: function () {
        if (this.v.paused) {
            this.v.play();
            $('span.current_frame').text('-');
            $('button.play_pause').html(this.letter.pause);
        } else {
            this.v.pause();
            $('span.current_frame').text(this.current_frame());
            $('button.play_pause').html(this.letter.play);
        }
    },

    stop: function () {
        this.v.pause();
        this.v.currentTime = 0;
        $('span.current_frame').text(this.current_frame());
        $('button.play_pause').html(this.letter.play);
    },

    previous_frame: function () {
        this.v.pause();
        this.v.currentTime -= 1/60;
        $('span.current_frame').text(this.current_frame());
    },

    next_frame: function () {
        this.v.pause();
        this.v.currentTime += 1/60;
        $('span.current_frame').text(this.current_frame());
    },

    speed_change: function () {
        this.v.playbackRate = $('input.speed').val();
    },

    speed_down: function () {
        if (this.v.playbackRate >= 0.2) {
            this.v.playbackRate -= 0.1;
            $('input.speed').val(this.v.playbackRate.toFixed(1));
        }
    },
    
    speed_up: function () {
        this.v.playbackRate += 0.1;
        $('input.speed').val(this.v.playbackRate.toFixed(1));
    },

    append_ui: function () {
        var id = this.video_id ? ' id="' + this.video_id + '"' : '';

        this.video.after(
            '<div class="hbplayer"' + id + ' style="background-color: silver; width: 640px;">' +
            '<span class="speed_block">' +
            'Speed: <input type="number" min="0.1" step="0.1" class="speed" value="1.0" />' +
            '</span>' +
            ' ｜ ' +
            '<span class="frame_block">' +
            '<span class="current_frame">-</span> / <span class="duration"></span> frames ' +
            '<button class="previous_frame">' + this.letter.previous + '</button>' +
            '<button class="next_frame">' + this.letter.next + '</button>' +
            '</span>' +
            ' ｜ ' +
            '<span class="play_pause_block">' +
            '<button class="stop">' + this.letter.stop + '</button>' +
            '<button class="play_pause">' + this.letter.pause + '</button>' +
            '</span>' +
            '' +
            '</div>'
        );
    }
};
