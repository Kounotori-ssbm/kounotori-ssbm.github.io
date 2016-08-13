DXCalcUI = function (character, language) {
    this.character = character || "all";
    this.language  = language  || "English";
    this.attacker_char_val;
    this.victim_char_val;
    this.move_val;
    this.displaying_data = [];
    this.calc_adv = [];
    this.stored_data = [];

    this.icon_dir_path    =  '/DXCalc/js/DXCalc/icon';
    this.table_columns_json = '/DXCalc/js/DXCalc/data/table_columns.json';
    this.char_data_json   = '/DXCalc/js/DXCalc/data/character.json';
    this.hitbox_data_json = '/DXCalc/js/DXCalc/data/hitbox.json';
    this.move_data_json   = '/DXCalc/js/DXCalc/data/move.json';
    this.stage_data_json  = '/DXCalc/js/DXCalc/data/stage.json';

    this.letter = {
        store: '<font size="+1">&#x2611;</font>',
        remove: '<font size="+1">&#x2610;</font>'
    };

    this.initialize();
};


DXCalcUI.prototype = {
    initialize: function () {
        this.stalemoves_scale = ssbmcalc.stalemoves_scale($('.dxcalc[name=stalemoves_queue]'));
        this.frame_adv_conds = {};
        this.get_frame_adv_conds();
        
        var that = this;

        // 各種 JSON のオブジェクト化、テーブルの見出し・セレクトボックスを埋める
        var jsons = [
            {json: this.table_columns_json, name: 'table_columns'},
            {json: this.char_data_json    , name: 'char_data'},
            {json: this.hitbox_data_json  , name: 'hitbox_data'},
            {json: this.move_data_json    , name: 'move_data'},
            {json: this.stage_data_json   , name: 'stage_data'}
        ];
        var unloaded_json_cnt = jsons.length;
        jsons.forEach(function (each) {
            $.getJSON(each.json, function (data) {
                that[each.name] = data;
                if (each.name === 'table_columns') {
                    $.merge(that[each.name]['display_data'], that[each.name]['hitbox']);
                    $.merge(that[each.name]['stored_data'], that[each.name]['hitbox']);
                    that.fill_table_header();
                } else if (each.name === 'char_data') {
                    that.fill_list(data, '.dxcalc.list.attacker');
                    that.fill_list(data, '.dxcalc.list.victim');
                } else if (each.name === 'stage_data') {
                    that.fill_list(data, '.dxcalc.list.stage');
                    
                }
                unloaded_json_cnt--;
                // 最後の getJSON まで読み込み終わっていたら
                if (unloaded_json_cnt === 0) {
                    that.random_select('attacker');
                    $('select.dxcalc.list.victim').val('Fx');
                    that.select_list('victim');
                    that.select_list('stage');
                }
            });
        });

        this.register_event_handlers();
    },


    random_integer: function (min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    },


    random_select: function (list) {
        var $list = $('select.dxcalc.list.' + list);
        var $options = $list.children('option');
        var random_val = $options.eq(this.random_integer(0, $options.length - 1)).val();
        $list.val(random_val);
        this.select_list(list);
    },


    register_event_handlers: function () {
        var that = this;

        // キャラ／対象キャラ／ワザ／ステージ選択
        ['attacker', 'move', 'victim', 'stage'].forEach(function (each) {
            $('select.dxcalc.list.' + each).on('change', function () {
                that.select_list(each);
            });
        });
        // Store ボタン
        $('table.dxcalc').on('click', 'button.store', function () {
            that.update_stored_data(function () {
                var i = $('button.store').index(this);
                $(this).parents('tr').animate({'background-color': 'yellow'}, 'fast');
                $(this).parents('tr').queue(function () {
                    $(this).animate({'background-color': 'white'}, 'fast');
                    $(this).dequeue();
                });
                that.stored_data.push($.extend({}, that.displaying_data[i], that.calc_adv));
            }.bind(this));
        });
        // StoreAll ボタン
        $('table.dxcalc').on('click', 'button#store_all', function () {
            that.update_stored_data(function () {
                for (var i = 0; i < that.displaying_data.length; i++) {
                    $('tr.data_row').eq(i).queue(function () {
                        $('tr.data_row').eq(i).animate({'background-color': 'yellow'}, 'fast');
                        $('tr.data_row').eq(i).animate({'background-color': 'white'}, 'fast');
                        $('tr.data_row').eq(i).dequeue();
                    });
                    that.stored_data.push($.extend({}, that.displaying_data[i], that.calc_adv));
                }
            });
        });
        // Remove ボタン
        $('table.dxcalc').on('click', 'button.remove', function () {
            that.update_stored_data(function () {
                var i = $('button.remove').index(this);
                that.stored_data.splice(i, 1);
            }.bind(this));
        });
        // RemoveAll ボタン
        $('table.dxcalc').on('click', 'button#remove_all', function () {
            that.update_stored_data(function () {
                that.stored_data = [];
            });
        });

        // HitboxSlider チェックボックス
        $('.dxcalc#show_hitbox_slider').on('change', function () {
            that.hitbox_slider(that.attacker_char_val, that.move_name);
        });
        // ワンパターン相殺 チェックボックス
        $('.dxcalc[name=stalemoves_queue]').on('change', function () {
            that.stalemoves_scale = ssbmcalc.stalemoves_scale($('.dxcalc[name=stalemoves_queue]'));
            $('span.dxcalc#stalemoves_scale').text(that.stalemoves_scale);
            that.update_stored_data();
        });
        // Hit Frame ドロップダウン
        $('table.dxcalc#frame_advantage').on('change', 'select.hit_frames', function () {
            var i = $('select.hit_frames').index(this);
            that.stored_data[i].hit_frame = parseInt($('select.hit_frames').eq(i).val(), 10);
            that.display_values(that.frame_advantage(that.stored_data), 'frame_advantage');
            that.display_values(that.hit_calculator(that.stored_data), 'hit_calculator');
        });
        // Frame Advantage 条件
        $('input.dxcalc.frame_adv_cond').on('change', function () {
            that.get_frame_adv_conds();
            that.display_values(that.frame_advantage(that.stored_data), 'frame_advantage');
            that.display_values(that.hit_calculator(that.stored_data), 'hit_calculator');
        });
        // 対象キャラ状態変更
        $('.dxcalc.victim').on('change', function () {
            that.display_values(that.hit_calculator(that.stored_data), 'hit_calculator');
        });
        // スティック入力値の変更を入力角度に反映
        $('.octagon_simulator.stick_value').on('change', function () {
            var $x = $('input#stick_value_x');
            var $y = $('input#stick_value_y');
            var x = $x.val();
            var y = $y.val();
            var angle;

            if (Math.abs(x) <= 0.275 && Math.abs(y) <= 0.275) {
                angle = 'null';
            } else {
                angle = ssbmcalc.actual_angle(Math.abs(x) <= 0.275 ? 0 : x, Math.abs(y) <= 0.275 ? 0 : y);
            } 
            $('input.dxcalc#stick_angle').val(angle);

            that.display_values(that.hit_calculator(that.stored_data), 'hit_calculator');
        });
        
    },


    fill_table_header: function () {
        var columns, i, key, name, selector,
            tables_ids = ['display_data', 'stored_data', 'frame_advantage', 'hit_calculator'],
            that = this;

        tables_ids.forEach(function (each) {
            columns = that.table_columns[each];
            for (i = 0; i < columns.length; i++) {
                key = Object.keys(columns[i])[0];
                if (columns[i][key].visible) {
                    selector = 'table.dxcalc#' + each + ' > thead > tr';
                    if (that.language === "Japanese") {
                        name = columns[i][key].name_ja;
                    } else {
                        name = columns[i][key].name_en;
                    }
                    if (key === 'char') {
                        name = '<div style="white-space: nowrap;">' + name + '<img src="' + that.icon_dir_path + '/space_charcolumn.png" style="vertical-align:middle;" /></div>';
                    }
                    if (each === 'display_data' && key === 'store') {
                        name = '<button id="store_all">' + that.letter.store + ' All</button>';
                    } else if (each === 'stored_data' && key === 'remove') {
                        name = '<button id="remove_all">' + that.letter.remove + ' All</button>';
                    }
                    $(selector).append('<th class="' + key + '">' + name + '</th>');
                }
            }
        });
    },

    fill_list: function (data, selector) {
        if (this.language === "Japanese") {
            $.each(data, function(key, each) {
                $(selector).append('<option value="' + key + '">' + each.name_ja + '</option>');
            });
        } else {
            $.each(data, function(key, each) {
                each.name_en = each.name_en || key;
                $(selector).append('<option value="' + key + '">' + each.name_en + '</option>');
            });
        }
    },


    select_list: function (list) {
        var that = this;
        var value = $('select.dxcalc.list.' + list).val();
        
        if (list === 'attacker' || list === 'victim') {
            $('.dxcalc.icon.' + list).children().remove();
            if (list === 'attacker') {
                this.remove_list('move');
                this.attacker_char_val = value;
            } else if (list === 'victim') {
                this.victim_char_val = value;
            }
        } else if (list === 'move') {
            this.move_val = value;
        } else if (list === 'stage') {
            this.stage_val = value;
        }

        if (value !== undefined) {
            if (list === 'attacker') {
                $.getJSON(this.move_data_json, function (data) {
                    that.fill_list(data[value], '.dxcalc.list.move');
                    that.random_select('move');
                });
            }

            if (list === 'attacker' || list === 'victim') {
                $('.dxcalc.icon.' + list).append('<img src="' + this.icon_dir_path + '/' + value + '.png" />');
            } else if (list === 'stage') {
                var height = this.stage_data[$('.dxcalc.list.stage').val()].ground_height;
                $('.dxcalc#start_y').val(height);
            }

            if (list === 'move') {
                this.move_name = value.replace(/ \(.*\)/g, "");
                $('.dxcalc#display_move_data').show();
                // 一旦クリア
                $('table.dxcalc#display_move_data tr').children().remove();
                $('table.dxcalc#display_data > tbody').children().remove();

                this.hitbox_slider(this.attacker_char_val, this.move_name);

                // モーションデータ読み込み
                this.get_move_data(this.attacker_char_val, this.move_name);

                // Hitbox Data 表示
                this.displaying_data = this.get_hitbox_data(this.attacker_char_val, this.move_name);
                this.display_values(this.displaying_data, 'display_data');
            }

            if (this.stored_data.length && (list === 'victim' || list === 'stage')) {
                this.hit_calculator(this.stored_data);
            }
        }
    },


    remove_list: function (list) {
        if (list === 'move') {
            $('.dxcalc.list.move').children().remove();
            $('.dxcalc#char_icon').children().remove();
            $('.dxcalc#display_move_data tr').children().remove();
            $('tr.dataRow').remove();
            $('.dxcalc#hitbox').children().remove();
        }
    },


    hit_frames_array: function (hit) {
        var duration, duration_start, duration_last, hits = [];
        if (!isNaN(hit)) {
            // Hit に持続がなく 1 F で数値で表されている場合
            hits.push(hit);
        } else {
            // Hit に持続があり、文字列で "2-5" などと表わされる場合
            duration = hit.split('-');
            duration_start = parseInt(duration[0]);
            duration_last = parseInt(duration[1]);

            // Hit のフレーム番号を作成し配列へ
            for (var i = duration_start; i <= duration_last; i++) {
                hits.push(i);
            }
        }
        
        return hits;
    },


    hitbox_slider: function(char_val, move_name) {
        $('div.dxcalc#hitbox_slider').children().remove();
        if (/*$('input.dxcalc#show_hitbox_slider').prop('checked') &&*/
            char_val !== undefined && move_name !== undefined) {
            $('div.dxcalc#hitbox_slider').append(
                '<video class="hbplayer" autoplay loop><source src="' +
                'http://dx.smashbr0s.com/hitbox_movies/' + char_val + '/' +
                move_name + '.mp4" type="video/mp4" /></video>'
            );
            // startHitboxSlider();
            new HBPlayer();
        }
    },


    get_move_data: function(char_val, move_name) {
        var data = this.move_data[char_val][move_name]['Data'];
        var datum, i, calc_adv = { Hit: [] };

        for (datum in data) {
            // モーションデータ表示
            $('table.dxcalc#display_move_data > thead > tr').append(
                '<th>' + datum + '</th>'
            );
            $('table.dxcalc#display_move_data > tbody > tr').append(
                '<td>' + data[datum] + '</td>'
            );

            // フレーム計算用
            if (datum === 'Total' || datum === 'IASA' || datum === 'Landing-lag') {
                calc_adv[datum] = data[datum];
            } else if (datum === 'Hit') {
                for (i = 0; i < data[datum].length; i++) {
                    this.hit_frames_array(data[datum][i]).map(function (x) {
                        calc_adv.Hit.push(x);
                    });
                }
            }
        }

        // stored_data に含める this.calc_adv を生成
        this.calc_adv = calc_adv;
        $.extend(this.calc_adv, { hit_frame: calc_adv.Hit[0] });
    },


    get_hitbox_data: function(char_val, move_name) {
        var i, hex_data, converted = [], data_array = [];
        for (i in this.hitbox_data) {
            if (this.hitbox_data[i].Char === char_val &&
                this.hitbox_data[i].Move.replace(/ \(.*\)/g, "") === move_name) {
                hex_data = [this.hitbox_data[i].Data1,
                            this.hitbox_data[i].Data2,
                            this.hitbox_data[i].Data3,
                            this.hitbox_data[i].Data4,
                            this.hitbox_data[i].Data5
                ];
                converted = hitbox_hexdata.convert(hex_data);
                converted.char = $('.dxcalc.list.attacker option:selected').val();
                converted.move = this.hitbox_data[i].Move;
                data_array.push(converted);
            }
        }
        return data_array;
    },


    display_values: function(data, table_id) {
        var i, j, key, column, content, $rows,
            selector = 'table.dxcalc#' + table_id,
            $table = $(selector),
            that = this;

        $table.children('tbody').children().remove();

        for (i = 0; i < data.length; i++) {
            $table.children('tbody').append('<tr class="data_row"></tr>');
            $rows = $table.find('tbody > tr.data_row');
            var hitbox_columns = that.table_columns[table_id];

            for (j = 0; j < hitbox_columns.length; j++) {
                key = Object.keys(hitbox_columns[j])[0];
                content = '';
                if (key === 'store') {
                    content = '<button class="store">' + that.letter.store + '</button>';
                } else if (key === 'remove') {
                    content = '<button class="remove">' + that.letter.remove + '</button>';
                }

                if (hitbox_columns[j][key].visible) {
                    var custom_attr = (hitbox_columns[j][key].toFixed === undefined) ? '' : ' data-decimal_places="' + hitbox_columns[j][key].toFixed + '"';
                    $rows.eq(i).append('<td class="' + key + '"' + custom_attr + '>' + content + '</td>');
                }
            }
            for (column in data[i]) {
                var $cell = $rows.eq(i).find('td.' + column);
                if (column === 'char') {
                    $cell.append('<img src="' + this.icon_dir_path + '/' + data[i][column] + '.png" />');
                } else if (column === 'hit_frame') {
                    $cell.append('<select class="hit_frames"></select>');
                    for (var k = 0; k < data[i][column].length; k++) {
                        $cell.find('select').append('<option value="' + data[i][column][k] + '">' + data[i][column][k] + '</option>');
                    }
                    $rows.eq(i).find('select.hit_frames').val(data[i].hit);
                } else {
                    if ($cell.data('decimal_places') === undefined) {
                        $cell.text(data[i][column]);
                    } else {
                        $cell.attr('data-full_value', data[i][column]);
                        $cell.text(data[i][column].toFixed($cell.data('decimal_places')));
                    }
                }
            }
        }
    },


    update_stored_data: function (update_array) {
        update_array = update_array || function () {};
        update_array();
        this.display_values(this.stored_data, 'stored_data');
        this.display_values(this.frame_advantage(this.stored_data), 'frame_advantage');
        if (this.victim_char_val) {
            ccchart.init('graph', this.kb_graph(this.stored_data));
            this.display_values(this.hit_calculator(this.stored_data), 'hit_calculator');
        }
    },


    get_frame_adv_conds: function (conds) {
        conds = conds || ['iasa', 'land', 'l_cancel', 'auto_cancel'];
        var that = this;
        conds.forEach(function (each) {
            that.frame_adv_conds[each] = $('.dxcalc.frame_adv_cond#' + each).prop('checked');
        });
    },

    frame_advantage: function (stored_data) {
        var i, objs = [], staled_damage, shield_stun, attackers_total_stun;

        for (i = 0; i < stored_data.length; i++) {
            staled_damage = ssbmcalc.staled_damage(stored_data[i].damage, this.stalemoves_scale);
            shield_stun = ssbmcalc.shield_stun(staled_damage);
            if (stored_data[i].Total === null) {
                attackers_total_stun = NaN;
            } else {
                attackers_total_stun = ssbmcalc.attackers_total_stun(this.frame_adv_conds, stored_data[i].Total, stored_data[i].hit_frame, stored_data[i].IASA, stored_data[i]['Landing-lag'], this.char_data[stored_data[i].char].normal_land_lag);
            }

            objs.push({
                char: stored_data[i].char,
                move: stored_data[i].move,
                id: stored_data[i].id,
                staled_damage: staled_damage,
                hitlag: ssbmcalc.hitlag(staled_damage),
                shield_stun: shield_stun,
                hit_frame: stored_data[i].Hit,
                hit: stored_data[i].hit_frame,
                guard_advantage_frame: ssbmcalc.frame_advantage(attackers_total_stun, stored_data[i].hit_frame, shield_stun, 0)
            });
        }
        return objs;
    },


    hit_calculator: function (stored_data) {
        var i, objs = [];
        var char_data = this.char_data[$('.dxcalc.list.victim').val()],
            stage_data = this.stage_data[$('.dxcalc.list.stage').val()];
        var weight = char_data.weight,
            gravity = char_data.gravity,
            terminal_velocity = char_data.terminal_velocity;
        var current_percent = parseInt($('.dxcalc#current_percent').val(), 10),
            stick_angle = $('.dxcalc#stick_angle').val(),
            borne = $('.dxcalc[name=borne]:checked').val();
        var deadline_up = stage_data.deadline_up,
            start_y = parseInt($('.dxcalc#start_y').val(), 10);
        var is_crouch = $('.dxcalc#crouch:checked').val(),
            is_smash_charge = $('.dxcalc#smash_charge:checked').val(),
            is_funbari = $('.dxcalc#funbari:checked').val();

        for (i = 0; i < stored_data.length; i++) {
            var is_electric = stored_data[i].effect === 'Electric' ? true : false;
            var damage = stored_data[i].damage;
            var staled_damage = ssbmcalc.staled_damage(damage, this.stalemoves_scale);
            var hitlag = ssbmcalc.hitlag(staled_damage);
            var victims_hitlag = ssbmcalc.victim_hitlag(staled_damage, is_electric, is_crouch);
            var total_percent = staled_damage + current_percent;
            var knockback = ssbmcalc.knockback(current_percent, weight, staled_damage, damage, stored_data[i].base_kb, stored_data[i].kb_growth, stored_data[i].weight_based_kb, stored_data[i].is_throw);
            var launch_speed = ssbmcalc.launch_speed(knockback, stored_data[i].angle, borne);
            var actual_angle = ssbmcalc.actual_angle(launch_speed.x, launch_speed.y);
            var di_angle = ssbmcalc.DIed_angle(stick_angle, actual_angle);
            var di_launch_speed = ssbmcalc.di_launch_speed(di_angle, launch_speed.x, launch_speed.y);
            var hit_stun = ssbmcalc.hit_stun(knockback);
            var attackers_total_stun = ssbmcalc.attackers_total_stun(this.frame_adv_conds, stored_data[i].Total, stored_data[i].hit_frame, stored_data[i].IASA, stored_data[i]['Landing-lag'], this.char_data[stored_data[i].char].normal_land_lag);
            var victim_status = {
                is_throw: stored_data[i].is_throw,
                is_crouch: is_crouch,
                is_smash_charge: is_smash_charge,
                is_funbari: is_funbari
            };

            objs.push({
                char: stored_data[i].char,
                move: stored_data[i].move,
                id: stored_data[i].id,
                hitlag: hitlag,
                victims_hitlag: victims_hitlag,
                total_percent: total_percent,
                knockback: knockback,
                hit_stun: hit_stun,
                hit_advantage: ssbmcalc.frame_advantage(attackers_total_stun, stored_data[i].hit_frame, hit_stun, victims_hitlag - hitlag),
                di_angle: di_angle,
                launch_speed: di_launch_speed.xy,
                launch_speed_x: di_launch_speed.x,
                launch_speed_y: di_launch_speed.y,
                can_floortech: ssbmcalc.can_floortech(di_launch_speed.y, actual_angle, gravity),
                is_death: ssbmcalc.evaluate_death(di_launch_speed.x, di_launch_speed.y, -gravity, -terminal_velocity, deadline_up, start_y),
                kb32_percent: ssbmcalc.before_percent_to_specific_kb(32, staled_damage, damage, stored_data[i].base_kb, stored_data[i].kb_growth, weight, victim_status),
                kb80_percent: ssbmcalc.before_percent_to_specific_kb(80, staled_damage, damage, stored_data[i].base_kb, stored_data[i].kb_growth, weight, victim_status),
            });
        }
        return objs;
    },


    kb_graph: function (stored_data) {
        var graph = {
            "config": {
                "title": "Knockback Graph",
                "subTitle": "No crouch, no smash charge. Up to 10 hitboxes supported.",
                "type": "line",
                "width": 600,
                "height": 400,
                "paddingRight": 200,
                "xLines": [
                      {"val": 32,"color":"rgba(238,255,238, 0.6)","width":"1","font":"900 8px 'Times'"},
                      {"val": 80,"color":"rgba(238,255,238, 0.6)","width":"1","font":"900 16px 'Times'"}
                    ],
                "colorSet": []
            },

            "data": [
                ["%",0,20,40,60,80,100,120,140,160,180,200]
            ]
        };

        var graph_colors = [
            "#FFF","#E99","#9E9","#99E","#F3F","#3FF","#FF3","#F55","#5F5","#55F"
        ];
        var victim_weight = this.char_data[$('.dxcalc.list.victim').val()].weight;

        for (var i = 0; i < stored_data.length; i++) {
            graph.config.colorSet.push(graph_colors[i]);

            var char = stored_data[i].char,
                move = stored_data[i].move,
                id   = stored_data[i].id,
                damage = stored_data[i].damage,
                staled_damage = ssbmcalc.staled_damage(damage, this.stalemoves_scale),
                base_kb = stored_data[i].base_kb,
                kb_growth = stored_data[i].kb_growth,
                weight_based_kb = stored_data[i].weight_based_kb,
                is_throw = stored_data[i].is_throw;

            var kb = function (percent) {
                return ssbmcalc.knockback(
                    percent, victim_weight, staled_damage, damage,
                    base_kb, kb_growth,weight_based_kb, is_throw
                );
            };

            graph.data.push([
                "("+ char + ")" + move + "[" + id + "]",
                kb(0), kb(20), kb(40), kb(60), kb(80), kb(100),
                kb(120), kb(140), kb(160), kb(180), kb(200)
            ]);
        }

        return graph;
    }
};
