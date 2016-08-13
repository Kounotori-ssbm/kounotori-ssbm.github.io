var hitbox_hexdata = {
    code_effect: ["Normal", "Flame", "Electric", "Slash", "Coin", "Freezing", "Sleep", "[7]",
                  "Grab", "Bury", "Reverse", "Inert", "Stun", "Darkness", "Screw", "Flower", "None"],
    code_sfx_type: ["\[0\]", "Punch", "Kick", "Slash", "Coin", "Bat", "Paper", "Shock",
                    "Burn", "Chew", "Shell", "\[11\]", "\{Pc\}", "Ice", "\[14\]", "\[15\]",
                    "\[\[0\]\]", "\[Punch\]", "\[Kick\]", "\[Slash\]", "\[Coin\]", "\[Bat\]", "\[Paper\]", "\[Shock\]",
                    "\[Burn\]", "\[Chew\]", "\[Shell\]", "\[\[11\]\]", "\[\{Pc\}\]", "\[Ice\]", "\[\[14\]\]", "\[\[15\]\]"],
    code_sfx_size: ["S", "M", "L", "H"],

    convert: function (hexdata) {
        var converted_params = {};

        converted_params.cmd =
            (("0000000" + parseInt(hexdata[0].substr(0,2),16).toString(2)).slice(-8)).substr(0,6);
        converted_params.id =
            parseInt(parseInt(
                (("0000000" + parseInt(hexdata[0].substr(1,2),16).toString(2)).slice(-8)).substr(2,3)
            ,2));

        if (hexdata[4] !== undefined) { // パラメータが 5 つの通常の hitbox

            converted_params.is_throw = false;
            converted_params.unknown1 =
                (("0000000" + parseInt(hexdata[0].substr(2,2),16).toString(2)).slice(-8)).substr(1,5);
            converted_params.bone =
                parseInt(parseInt((
                    (("000" + parseInt(hexdata[0].substr(3,1),16).toString(2)).slice(-4))
                  + (("0000000" + parseInt(hexdata[0].substr(4,2),16).toString(2)).slice(-8))
                ).substr(2,7),2));
            converted_params.unknown2 =
                (("000" + parseInt(hexdata[0].substr(5,1),16).toString(2)).slice(-4)).substr(1,2);
            converted_params.damage =
                parseInt(parseInt(hexdata[0].substr(6,2),16));
            converted_params.size =
                parseInt(parseInt(hexdata[1].substr(0,4),16));
                if (converted_params.size >= 32768) { converted_params.size -= 65536; }
            converted_params.x_pos =
                parseInt(parseInt(hexdata[1].substr(4,4),16));
                if (converted_params.x_pos >= 32768) { converted_params.x_pos -= 65536; }
            converted_params.y_pos =
                parseInt(parseInt(hexdata[2].substr(0,4),16));
                if (converted_params.y_pos >= 32768) { converted_params.y_pos -= 65536; }
            converted_params.z_pos =
                parseInt(parseInt(hexdata[2].substr(4,4),16));
                if (converted_params.z_pos >= 32768) { converted_params.z_pos -= 65536; }
            converted_params.angle =
                Math.floor(parseInt(hexdata[3].substr(0,3),16) / 8);
            converted_params.kb_growth =
                Math.floor(parseInt(parseInt(hexdata[3].substr(2,3),16)) / 4)
              - (512 * Math.floor((parseInt(hexdata[3].substr(2,1),16) / 8)));
            converted_params.weight_based_kb =
                parseInt(parseInt(
                    (("0000000" + parseInt(hexdata[3].substr(4,2),16).toString(2)).slice(-8)).substr(2,6)
                  + (("0000000" + parseInt(hexdata[3].substr(6,2),16).toString(2)).slice(-8)).substr(0,3)
                ,2));
            converted_params.unknown3 =
                (("0000000" + parseInt(hexdata[3].substr(6,2),16).toString(2)).slice(-8)).substr(3,3);
            converted_params.clang =
                parseInt(parseInt(
                    (("000" + parseInt(hexdata[3].substr(7,1),16).toString(2)).slice(-4)).substr(2,2)
                ,2));
            converted_params.base_kb =
                Math.floor(parseInt(parseInt(hexdata[4].substr(0,3),16)) / 8);
            converted_params.effect = this.code_effect[
                parseInt(parseInt(
                    (("0000000" + parseInt(hexdata[4].substr(2,2),16).toString(2)).slice(-8)).substr(1,5)
                ,2))
            ];
            converted_params.unknown4 =
                (("000" + parseInt(hexdata[4].substr(3,1),16).toString(2)).slice(-4)).substr(2,1);
            converted_params.shield_damage =
                ((parseInt(parseInt(hexdata[4].substr(3,1),16))) % 2) * 64
              + Math.floor(parseInt(parseInt(hexdata[4].substr(4,2),16)) / 4);
            converted_params.sfx_size = this.code_sfx_size[
                parseInt(parseInt(
                    (("000" + parseInt(hexdata[4].substr(5,1),16).toString(2)).slice(-4)).substr(3,1)
                  + (("000" + parseInt(hexdata[4].substr(6,1),16).toString(2)).slice(-4)).substr(0,1)
                ,2))
            ];
            converted_params.sfx_type = this.code_sfx_type[
                parseInt(parseInt(
                (("000" + parseInt(hexdata[4].substr(6,1),16).toString(2)).slice(-4)).substr(1,3)
              + (("000" + parseInt(hexdata[4].substr(7,1),16).toString(2)).slice(-4)).substr(0,2)
                ,2))
            ];
            converted_params.ground_borne =
                parseInt((("000" + parseInt(hexdata[4].substr(7,1),16).toString(2)).slice(-4)).substr(2,1),2) ? true : false;
            converted_params.air_borne =
                parseInt((("000" + parseInt(hexdata[4].substr(7,1),16).toString(2)).slice(-4)).substr(3,1),2) ? true : false;
            converted_params.sfx =
                Math.floor(parseInt(parseInt(hexdata[4].substr(5,3),16)) / 4)
              - (256 * Math.floor( parseInt(parseInt(hexdata[4].substr(5,1),16)) / 4 ));

        } else { // hexdata が 5 つない場合（投げ技）

            converted_params.is_throw = true;
            converted_params.damage =
                parseInt(parseInt(hexdata[0].substr(5,3),16));
            converted_params.angle =
                Math.floor(parseInt(hexdata[1].substr(0,3),16) / 8);
            converted_params.kb_growth =
                Math.floor((parseInt(parseInt(hexdata[1].substr(2,3),16)) / 4))
              - (512 * Math.floor((parseInt(hexdata[1].substr(2,1),16) / 8)));
            converted_params.weight_based_kb =
                parseInt((("000" + parseInt(hexdata[1].substr(4,1),16).toString(2)).slice(-4)).substr(2,2)) * 128
              + parseInt(parseInt(hexdata[1].substr(5,1),16)) * 8
              + parseInt((("000" + parseInt(hexdata[1].substr(6,1),16).toString(2)).slice(-4)).substr(0,3));
            converted_params.base_kb =
                Math.floor(parseInt(parseInt(hexdata[2].substr(0,3),16)) / 8);
            converted_params.effect = this.code_effect[
                parseInt(parseInt(
                    (("0000000" + parseInt(hexdata[2].substr(2,2),16).toString(2)).slice(-8)).substr(1,4)
                ,2))
            ];
            converted_params.unknown1      = "";
            converted_params.bone          = "";
            converted_params.unknown2      = "";
            converted_params.size          = "";
            converted_params.x_pos         = "";
            converted_params.y_pos         = "";
            converted_params.z_pos         = "";
            converted_params.unknown3      = "";
            converted_params.clang         = "";
            converted_params.unknown4      = "";
            converted_params.shield_damage = "";
            converted_params.sfx_size      = "";
            converted_params.sfx_type      = "";
            converted_params.ground_borne  = "";
            converted_params.air_borne     = "";
            converted_params.sfx           = "";

        }

        return converted_params;
    }
};


