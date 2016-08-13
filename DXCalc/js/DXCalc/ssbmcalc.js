var ssbmcalc = {
    stalemoves_scale: function (checkboxes) {
        var i, scale = 100;
        for (i = 0; i < checkboxes.length; i++) {
            if (checkboxes.eq(i).prop('checked')) {
                scale -= (9 - i);
            }
        }
        return scale;
    },


    staled_damage: function (damage, stale_scale) {
        return damage * stale_scale / 100;
    },


    hitlag: function (staled_damage) {
        return Math.floor((staled_damage / 3) + 3);
    },


    victim_hitlag: function (staled_damage, is_electric, is_crouch) {
        var hitlag = this.hitlag(staled_damage),
            effect_scale = !!is_electric ? 3/2 : 1,
            crouch_scale = !!is_crouch ? 2/3 : 1,
            victimHitlag = Math.floor(hitlag * effect_scale) * crouch_scale;
        return Math.floor(victimHitlag);
    },

    shield_stun: function (staled_damage) {
        return Math.floor((staled_damage * 1000 + 4450) / 2235);
    },

    knockback: function (
        current_percent, weight, staled_damage, damage, 
        base_knockback, knockback_growth, weight_based_knockback, is_throw) {
        if (is_throw) {
            weight = 100;
        }
        var temporary_total_percent = staled_damage + current_percent;
        var x = damage * temporary_total_percent / 20;
        var y = temporary_total_percent / 10;
        var z = 1;
        var w = 200 / (weight + 100);
        var altered_part;

        if (weight_based_knockback === 0 ) {
            altered_part = x + y;
        } else { // When WBKb is set
            altered_part = (weight_based_knockback * 10) / 20 + 1;
        }
        var knockback = base_knockback + ((knockback_growth / 100) *
                        (18 + (((w * 14 / 10) * z) * altered_part)));

        return knockback;
    },


    hit_stun: function(knockback) {
        return Math.floor(knockback * 4 / 10) - 1;
    },


    launch_speed: function (knockback, angle_data, borne) {
        var angle = angle_data;
        if (angle === 361) {
            if (borne === 'air') {
                angle = 45;
            } else if (borne === 'ground' && knockback < 32) {
                angle = 0;
            } else {
                angle = 44;
            }
        }
        var theta = angle * Math.PI / 180;

        var obj = { xy: knockback * 3 / 100 };
        obj.x = obj.xy * Math.cos(theta);
        if (borne === 'ground' && (angle === 0 || (180 <= angle && angle <= 360))) {
            if (knockback < 80) {
                obj.y = 0;
            } else {
                obj.y = -(obj.xy * Math.sin(theta) * 8 / 10);
            }
        } else {
            obj.y = obj.xy * Math.sin(theta);
        }
        return obj;
    },


    actual_angle: function (x, y) {
        return Math.atan2(y, x) * 180 / Math.PI;
    },


    // X, Y ふっとび速度から計算される角度とスティックの入力角度から、DI された後の角度を計算
    DIed_angle: function (input, actual_angle) {
        var DIed_angle = actual_angle;
        input = (0 <= input && input < 360) ? input : null;

        if (input !== null) {
            var theta = (actual_angle - input) * (Math.PI / 180);
            DIed_angle = 18 * Math.pow(Math.sin(theta), 2);
            if (90 < input && input < 270) {
                DIed_angle += actual_angle;
            } else {
                DIed_angle = actual_angle - DIed_angle;
            }
        }

        return DIed_angle;
    },


    // DI 後の合成ふっとび速度と、X/Y ふっとび速度の再計算
    di_launch_speed: function (di_angle, launch_speed_x, launch_speed_y) {
        // X, Y ふっとび速度の合成
        var xy = Math.sqrt(Math.pow(launch_speed_x, 2) + Math.pow(launch_speed_y, 2));
        var theta = di_angle * Math.PI / 180;
        var obj = {
            xy: xy,
            x: xy * Math.cos(theta),
            y: xy * Math.sin(theta),
            x_1st: (xy - 0.051) * Math.cos(theta),
            y_1st: (xy - 0.051) * Math.sin(theta)
        };
console.log(obj.x_1st);
console.log(obj.y_1st);
        return obj;
    },


    // ASDI（移動距離 3）によって、ふっとび 1 F目で地面にめり込めるか
    can_floortech: function (launch_speed_y, DIed_angle, gravity) {
        var theta = DIed_angle * Math.PI / 180;
        var initial_velocity_y = launch_speed_y - gravity - (51 * Math.sin(theta) / 1000);
        return initial_velocity_y <= 3 ? true : false;
    },


    // ヒット後の座標や速度からバーストするか否かを返す（現状スターフィニッシュのみ）
    //evaluate_death: function (DIed_angle, initial_velocity, freefall_acceleration, terminal_velocity, deadline_up, start_y) {
    evaluate_death: function (initial_velocity_x, initial_velocity_y, freefall_acceleration, terminal_velocity, deadline_up, start_y) {
        //var is_death_up = false;
        //var is_death_side = false;
        var INNER_ACCELERATION = -0.051;
        var STEPOVER_THRESHOLD = 2.4;

        // 現在 X 座標による判定は未対応
        var theta = Math.atan2(initial_velocity_y, initial_velocity_x);
        var inner_acceleration_x = INNER_ACCELERATION * Math.cos(theta);
        var inner_acceleration_y = INNER_ACCELERATION * Math.sin(theta);

        // Y ふっとび初速による非スターフィニッシュ判定
        if (initial_velocity_y < STEPOVER_THRESHOLD) {
            return false;//is_death_up = false;
        } else { // ふっとび終了時の位置によるスターフィニッシュ判定
            var critical_frame = Math.floor(-(initial_velocity_y - Math.max(STEPOVER_THRESHOLD, -terminal_velocity)) / inner_acceleration_y);
            var critical_inner_velocity_y = initial_velocity_y + critical_frame * inner_acceleration_y;
            var critical_inner_position_y = 0.5 * (initial_velocity_y + inner_acceleration_y + critical_inner_velocity_y) * critical_frame;
            var frames_before_reaching_terminal_velocity = Math.floor(terminal_velocity / freefall_acceleration);
            var freefall_velocity_y_before_terminal_velocity = freefall_acceleration * frames_before_reaching_terminal_velocity;
            var freefall_position_y_before_terminal_velocity = 0.5 * (freefall_acceleration + freefall_velocity_y_before_terminal_velocity) * frames_before_reaching_terminal_velocity;
            var remaining_frames_to_critical_frame = critical_frame - frames_before_reaching_terminal_velocity;
            var freefall_position_y_to_critical_frame = terminal_velocity * remaining_frames_to_critical_frame;
            var critical_freefall_position_y = freefall_position_y_before_terminal_velocity + freefall_position_y_to_critical_frame;
            var critical_position_y = start_y + critical_inner_position_y + critical_freefall_position_y;

            if (critical_position_y > deadline_up) {
                return true;//is_death_up = true;
            } else {
                return false;//is_death_up = false;
            }
        }
        
        // x 死亡判定
        //is_death_side = true;
        //return is_death_up = true || is_death_side === true ? true : false;
    },


    attackers_total_stun: function (frame_adv_conds, attackers_total_frames, hit_frame, IASA, aerial_landing_lag, normal_landing_lag) {
        attackers_total_stun = attackers_total_frames;
        if (frame_adv_conds.iasa && IASA !== undefined) {
            attackers_total_stun = IASA - 1;
        }
        if (frame_adv_conds.land && aerial_landing_lag !== undefined) {
            attackers_total_stun = hit_frame + aerial_landing_lag;
            if (frame_adv_conds.l_cancel) {
                attackers_total_stun = hit_frame + Math.floor(aerial_landing_lag / 2);
            }
            if (frame_adv_conds.auto_cancel && normal_landing_lag !== undefined) {
                attackers_total_stun = hit_frame + normal_landing_lag;
            }
        }
        return attackers_total_stun;
    },


    // diff には防御側の方が硬直がどれくらい長いかを渡す。省略可
    frame_advantage: function (attackers_total_stun, hit_frame, defender_stun, diff) {
        diff = diff || 0;
        var attacker_stun = attackers_total_stun - hit_frame;
        return defender_stun + diff - attacker_stun;
    },


    before_percent_to_specific_kb: function(knockback_value, staled_damage, damage, base_kb, kb_growth, weight, options) {
        options = $.extend({
            is_throw: false,
            is_crouch: false,
            is_smash_charge: false,
            is_funbari: false
        }, options);
        weight = options.is_throw ? 100 : weight;
        var crouch = options.is_crouch ? 2/3 : 1;
        var smash_charge = options.is_smash_charge ? 12/10 : 1;
        var funbari = options.is_funbari ? -120 : 0;

        return (
            (
                (
                    (
                        (
                            (
                                (knockback_value + funbari) / (crouch * smash_charge)
                            ) - base_kb
                        ) / (kb_growth / 100)
                    ) - 18
                ) / 1.4 / (200 / (weight + 100)) * 20
            ) - 2 * staled_damage - (staled_damage * damage)
        ) / (2 + damage);
    }
};
