/**
 * Created by young on 2017. 6. 30..
 */

(function(context) {
    if (context.View) {
        return;
    }

    var private = {
        game_status:1,
        _$plot:null,
        _$overlay:null,
        remain_time:0,
        status_timer:(function() {
            return setInterval(function(){
                if (private._$plot && private._$overlay) {
                    private.remain_time = Math.round(private.remain_time);
                    if( private.remain_time >= 0 && private.game_status === 1 ){
                        var view_status = '게임 시작 ' + (private.remain_time/1000).toFixed(1) + '초전',
                            plot_width, plot_height;

                        plot_width = private._$plot.width();
                        plot_height = private._$plot.height();;

                        private._$overlay.save();
                        private._$overlay.clearRect(0, plot_height/2 - 50, plot_width + 50, plot_height/2 + 50 );
                        private._$overlay.translate(plot_width/2 + 40, plot_height/2);
                        private._$overlay.textAlign = "center";
                        private._$overlay.font = "25px Courier";

                        private._$overlay.fillText(view_status, 0, 10);
                        private._$overlay.restore();

                        private.remain_time -= 100;
                    }
                }
            }, 100);
        })(),
        fn_view_status:function($plot, $overlay){
            !private._$plot && (private._$plot = $plot);
            !private._$overlay && (private._$overlay = $overlay);
            var plot_width, plot_height,
                view_status;

            plot_width = $plot.width();
            plot_height = $plot.height();

            if( private.game_status !== 1 ){
                $overlay.save();
                $overlay.translate(plot_width/2 + 40, plot_height/2);
                $overlay.textAlign = "center";
                $overlay.font = "bold 50px Courier";

                $overlay.rect(0, 0, 55, 50);
            }

            switch (private.game_status){
                case 1:
                    break;
                case 2:
                    view_status = View.Animation.ypt + 'x';
                    $overlay.fillText(view_status, 0, 10);
                    $overlay.restore();
                    break;
                case 3:
                    $overlay.font = "bold 30px Courier";
                    $overlay.fillStyle = "#ff0000";
                    $overlay.fillText('게임결과', 0, -20);
                    view_status = View.Animation.ypt + 'x';
                    $overlay.fillText(view_status, 0, 10);
                    $overlay.restore();
                    break;
                default:
                    view_status = '';
                    break;
            }

        }
    };

    context.View = {
        Animation:{
            $plot:null,
            plot:[[]],
            options:{},
            xpt:0,
            ypt:1,
            timeTag:null,
            AnimationRun:null,
            set_timeTag:function(timeTag){
                this.timeTag = timeTag;
            },
            get_timeTag:function(timeTag){
                return this.timeTag;
            },
            init:function($playground){
                this.options = {
                    canvas: true,
                    series: {
                        shadowSize: 0,	// Drawing is faster without shadows
                        lines: { lineWidth: 3 }
                    },
                    colors: ['#000000'],
                    xaxis: {
                        min: 0,
                        max: 10,
                        tickLength: 0
                    },
                    yaxis: {
                        min: 1.0,
                        max: 2.0,
                        tickLength: 0,
                        tickFormatter: function(value, axis) {
                            return value.toFixed(1) + "x";
                        }
                    },
                    grid: {
                        show: true,
                        borderWidth:{
                            top:0,
                            right:0,
                            bottom:2,
                            left:2
                        },
                        backgroundColor:"#eeeeee"
                    },
                    bars: {
                        show: false
                    },
                    hooks: { drawOverlay: [
                        private.fn_view_status
                    ] }
                };

                this.$plot = $.plot($playground, [{data:this.plot, label:''}], this.options);
                var $plot = this.$plot;

                $playground.resize(function(){
                    $plot.resize();
                    $plot.setupGrid();
                    $plot.draw();
                });

                if( this.AnimationRun == null ){
                    this.AnimationRun = this.ACTOR();
                    this.AnimationRun.init( $("#runground") );
                }
            },
            reset:function(){
                private.game_status = 1;
                this.plot = [[]];
                this.xpt = 0;
                this.ypt = 1;

                if( this.$plot ){
                    this.$plot.getOptions().xaxes[0].max = 10;
                    this.$plot.getOptions().yaxes[0].max = 2;
                }
            },
            ready:function( remain_time ){
                this.reset();
                private.remain_time = remain_time;

                if( this.$plot ){
                    this.$plot.setData( [this.plot] );
                    this.$plot.setupGrid();
                    this.$plot.draw();
                }

                if( this.AnimationRun ){
                    this.AnimationRun.ready();
                }
            },
            virtual_run:function(model, timeTag){
                var tTag = 1000, tmpYPoint;

                this.timeTag = timeTag;

                this.plot = [[]];
                while(tTag < timeTag){
                    tTag += 100;
                    tmpYPoint = model.float_to_fixed( model.cal_ypoint(tTag/1000) , 2 );
                    this.plot.push([(tTag-1000)/1000, tmpYPoint]);
                }
            },
            run:function(model, timeTag){
                var k;

                this.timeTag = timeTag;
                k = timeTag/1000;

                private.game_status = model.get_status();
                this.ypt = model.float_to_fixed( (k === 0 ? 0 : model.cal_ypoint(k)) , 2 );
                model.set_odds( this.ypt );

                this.plot.push([k-1,this.ypt]);
                this.$plot.setData( [this.plot] );

                if( this.ypt>2 ){
                    this.$plot.getOptions().xaxes[0].max = null;
                    this.$plot.getOptions().yaxes[0].max = this.ypt;

                    this.$plot.setupGrid();
                }else if( k-1>10 ){
                    this.$plot.getOptions().xaxes[0].max = null;
                    this.$plot.setupGrid();
                }

                this.$plot.draw();

                if( this.AnimationRun ){
                    this.AnimationRun.run( this.ypt );
                }
            },
            end:function(model, timeTag){
                var k;

                this.timeTag = timeTag;
                k = timeTag/1000;

                private.game_status = model.get_status();
                this.ypt = model.float_to_fixed( (k === 0 ? 0 : model.cal_ypoint(k)) , 2 );
                model.set_odds( this.ypt );

                if( this.$plot ){
                    this.$plot.setData( [] );
                    this.$plot.draw();
                }

                if( this.AnimationRun ){
                    this.AnimationRun.end();
                }
            },
            inspection:function(){
                if( this.$plot ){
                    this.$plot.shutdown();
                }
                if( this.AnimationRun ){
                    this.AnimationRun.end();
                }
            },
            ACTOR:(function(){
                var ACTOR = {
                    PLAY_WIDTH: 1000,
                    PLAY_HEIGHT: 275,
                    RUNNER_WIDTH: 250,
                    RUNNER_HEIGHT: 200,
                    REFRESH_RATE : 30,
                    BG_RATE : 150,
                    FAST_SPEED : 4,
                    ACTOR_RATE: 250,
                    BG_IMAGE_URL: [
                        './resource/image/bg-far.png',
                        './resource/image/bg-middle.png',
                        './resource/image/bg-close.png'
                    ],
                    ACTOR_IMAGE_URL: './resource/image/rabbit_run10.png',
                    NUM_FRAME_ON_STAY: 2,
                    NUM_FRAME_ON_READY: 1,
                    NUM_FRAME_ON_RUN: 2,
                    NUM_FRAME_ON_FRUN: 2,
                    NUM_FRAME_ON_STOP: 1,
                    NUM_FRAME_ON_END: 2,
                    $run_actor: null,
                    bg_speed: [1, 1, 2, 2, 10, 10],
                    game_speed: 1,
                    isSpeedUp: false,
                    actorRate: 250,
                    aniBackground: [],
                    aniActor: null,
                    is_run: false,
                    sliding_timer:null,
                    init: function ($playground) {
                        var _this = this,
                            bg_cnt = this.BG_IMAGE_URL.length * 2;

                        $playground.playground({height: this.PLAY_HEIGHT, width: this.PLAY_WIDTH, refreshRate: this.REFRESH_RATE});

                        this.aniActor = new $.gQ.Animation({
                            imageURL: this.ACTOR_IMAGE_URL,
                            numberOfFrame: this.NUM_FRAME_ON_STAY,
                            delta: this.RUNNER_WIDTH,
                            rate: this.ACTOR_RATE,
                            type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK
                        });

                        for (var i = 0; i < bg_cnt; i++) {
                            this.aniBackground[i] = new $.gameQuery.Animation({
                                imageURL: this.BG_IMAGE_URL[ Math.floor(i/2) ],
                                type: $.gQ.ANIMATION_VERTICAL
                            });
                        }

                        $.playground()
                            .addGroup("background", {width: this.PLAY_WIDTH, height: this.PLAY_HEIGHT})
                            .addSprite("background0", {
                                animation: this.aniBackground[0],
                                width: this.PLAY_WIDTH,
                                height: this.PLAY_HEIGHT
                            })
                            .addSprite("background1", {
                                animation: this.aniBackground[1],
                                width: this.PLAY_WIDTH,
                                height: this.PLAY_HEIGHT,
                                posx: this.PLAY_WIDTH
                            })
                            .addSprite("background2", {
                                animation: this.aniBackground[2],
                                width: this.PLAY_WIDTH,
                                height: this.PLAY_HEIGHT
                            })
                            .addSprite("background3", {
                                animation: this.aniBackground[3],
                                width: this.PLAY_WIDTH,
                                height: this.PLAY_HEIGHT,
                                posx: this.PLAY_WIDTH
                            })
                            .addSprite("background4", {
                                animation: this.aniBackground[4],
                                width: this.PLAY_WIDTH,
                                height: this.PLAY_HEIGHT
                            })
                            .addSprite("background5", {
                                animation: this.aniBackground[5],
                                width: this.PLAY_WIDTH,
                                height: this.PLAY_HEIGHT,
                                posx: this.PLAY_WIDTH
                            }).end()
                            .addGroup("actors", {width: this.PLAY_WIDTH, height: this.PLAY_HEIGHT})
                            .addSprite("run_actor", {
                                animation: this.aniActor,
                                posx: 20,
                                posy: this.PLAY_HEIGHT - this.RUNNER_HEIGHT,
                                width: this.RUNNER_WIDTH,
                                height: this.RUNNER_HEIGHT
                            });

                        this.$run_actor = $("#run_actor");

                        $.playground().startGame(function () {});

                        $.playground().registerCallback(function(){
                            var up_speed;

                            if( private.game_status === 2 ){
                                up_speed = (Math.round( _this.BG_RATE / (_this.REFRESH_RATE-10) ) - _this.aniActor.rate);

                                _this.move_bg(up_speed);

                                if( _this.isSpeedUp === false && _this.game_speed > 2 ){
                                    _this.isSpeedUp = true;

                                    _this.aniActor.rate = _this.FAST_SPEED;
                                    _this.aniActor.offsetx = _this.RUNNER_WIDTH * (_this.NUM_FRAME_ON_STAY + _this.NUM_FRAME_ON_READY + _this.NUM_FRAME_ON_RUN);
                                    _this.aniActor.numberOfFrame = _this.NUM_FRAME_ON_FRUN;
                                    _this.$run_actor.setAnimation(_this.aniActor, function(){});
                                }
                            }

                            if( private.game_status === 3 && _this.sliding_timer === null ){
                                up_speed = (Math.round( _this.BG_RATE / (_this.REFRESH_RATE-10) ) - _this.aniActor.rate);

                                _this.sliding_timer = setInterval(function(){
                                    up_speed -= 0.1;

                                    if( up_speed < 0 ){
                                        clearInterval(_this.sliding_timer);
                                        delete up_speed;
                                        return false;
                                    }

                                    _this.move_bg(up_speed);

                                }, _this.REFRESH_RATE);
                            }
                        }, this.REFRESH_RATE);
                    },
                    move_bg:function(speed){
                        var bg_cnt = this.aniBackground.length,
                            newPos = [];

                        for (var i = 0; i < bg_cnt; i++) {
                            newPos[i] = (parseInt($("#background" + i).css("left")) - parseInt(this.bg_speed[i] + (this.bg_speed[i] * speed)) - this.PLAY_WIDTH)
                                % (-2 * this.PLAY_WIDTH) + this.PLAY_WIDTH;
                        }

                        for (var i = 0; i < bg_cnt; i++) {
                            $("#background" + i).css("left", newPos[i]);
                        }
                    },
                    ready:function(){
                        var aniActor = this.aniActor,
                            $run_actor = this.$run_actor;

                        this.is_run = false;
                        aniActor.offsetx = 0;
                        aniActor.numberOfFrame = this.NUM_FRAME_ON_STAY;
                        this.game_speed = 1;
                        this.isSpeedUp = false;
                        this.sliding_timer = null;

                        $run_actor.fadeIn(500);

                        $run_actor.setAnimation(aniActor, function() {});
                        $run_actor.resumeAnimation();
                    },
                    run:function( speed ){
                        var aniActor = this.aniActor,
                            $run_actor = this.$run_actor,
                            _this = this;

                        this.game_speed = speed;

                        if( this.is_run === false ){
                            this.is_run = true;

                            aniActor.offsetx = this.RUNNER_WIDTH * this.NUM_FRAME_ON_STAY;
                            aniActor.numberOfFrame = (this.NUM_FRAME_ON_READY + this.NUM_FRAME_ON_RUN);
                            $run_actor.setAnimation(aniActor, function(){
                                // 출발상태에서 뛰는 상태
                                aniActor.offsetx = _this.RUNNER_WIDTH * (_this.NUM_FRAME_ON_STAY + _this.NUM_FRAME_ON_READY);
                                aniActor.numberOfFrame = _this.NUM_FRAME_ON_RUN;
                                $run_actor.setAnimation(aniActor, function(){
                                });
                            });
                        }
                    },
                    end:function(){
                        var aniActor = this.aniActor,
                            $run_actor = this.$run_actor,
                            _this = this;

                        this.is_run = false;
                        aniActor.offsetx = this.RUNNER_WIDTH * (this.NUM_FRAME_ON_STAY + this.NUM_FRAME_ON_READY + this.NUM_FRAME_ON_RUN + this.NUM_FRAME_ON_FRUN);
                        aniActor.numberOfFrame = this.NUM_FRAME_ON_STOP + this.NUM_FRAME_ON_END;
                        $run_actor.setAnimation(aniActor, function(){
                            // 머리 위에 별(회전)
                            actorRate = _this.ACTOR_RATE;
                            aniActor.rate = Math.round( actorRate / _this.REFRESH_RATE );
                            aniActor.offsetx = _this.RUNNER_WIDTH * (_this.NUM_FRAME_ON_STAY + _this.NUM_FRAME_ON_READY + _this.NUM_FRAME_ON_RUN + _this.NUM_FRAME_ON_FRUN + _this.NUM_FRAME_ON_STOP);
                            aniActor.numberOfFrame = _this.NUM_FRAME_ON_END;
                            $run_actor.setAnimation(aniActor, function() {
                                game_state = 3;

                                // 사라지는 상태
                                $run_actor.fadeOut(1500, '', function(){
                                    $run_actor.pauseAnimation();
                                });
                            });
                        });
                    }
                }

                return ACTOR;
            })
        },
        Theme:{
            bg:{
            },
            actor:{
            }
        },
        UI:{
            $into_info:null,
            $buy_button:null,
            $recent_info:null,
            $into_list_box:null,
            $manual_stop:null,
            $btn_buy:null,
            $into_list:null,
            $auto_point:null,
            $auto_stop:null,
            $auto_count:null,
            $btn_auto:null,
            $simple_hiotory_list:null,
            $history_list:null,
            $history_list_item:[],
            $login_info:null,
            $user_info:null,
            $user_point:null,
            $sp_exchange_btn:null,
            $sp_free_btn:null,
            auto_counts:[1,2,3,4,5,10,15,20,30,40,50],
            select_tab:1,
            simple_view_cnt:9,
            $alert_layer:null,
            init:function( $into_info, $recent_info, $into_list_box ){
                var _this = this;

                this.$into_info = $into_info;
                this.$recent_info = $recent_info;
                this.$into_list_box = $into_list_box;
                this.$buy_button = $into_info.find('.tab_con1 .buy_button button');
                this.$btn_buy = $into_info.find("#btn_buy");
                this.$manual_stop = $into_info.find("#manual_stop");
                this.$auto_point = $into_info.find('.tab_con2 .buy_button button');
                this.$auto_stop = $into_info.find("#auto_stop");
                this.$auto_count = $into_info.find(".auto_select select");
                this.$btn_auto = $into_info.find("#btn_set");
                this.$into_list = $into_list_box.find("#list1 .list_con tbody");
                this.$simple_hiotory_list = $recent_info.find("ul");
                this.$history_list = $into_list_box.find("#list2 .list_con tbody");
                this.$login_info = $("#game_user .logout");
                this.$user_info = $("#afterLogin");
                this.$user_point = this.$user_info.find("input");
                this.$sp_exchange_btn = $("#sp_exchange");
                this.$sp_free_btn = $("#free_exchange");

                this.$alert_layer = $("#b_layer_pop");
                $('#b_pop_close').click(function(){
                    _this.$alert_layer.hide();
                });

                this.draw_auto_count_select();

                // this.onClickPointBtn();
                // this.onClickListTab();
                this.onClickExchangeBtn();
                this.onClickFreeBtn();

                this.onKeydownCheck();
            },
            set_select_tab:function(tab){
                this.select_tab = tab;
            },
            onClickExchangeBtn:function( ){
                this.$sp_exchange_btn.click( function(){
                    var pop = window.open('/mypage/exchange_point.php?gameType=6', 'exchange_point', "height=360, width=550, top=100;left=100,scrollbars=no, resizable=no");
                    pop.focus();
                } );
            },
            onClickFreeBtn:function( ){
                this.$sp_free_btn.click( function(){
                    var pop = window.open('/mypage/free_charge_spoint.php?gameType=6', 'free_point', "height=370, width=550, top=100;left=100,scrollbars=no, resizable=no");
                    pop.focus();
                } );
            },
            onClickPointBtn:function( chk_fn ){
                this.$into_info.find('.buy_button button').click(function(){
                    var $this, $parent;

                    $this = $(this);
                    if( chk_fn() === false ){
                        $parent = $this.closest('.buy_button');
                        $parent.find('button').removeClass('on');
                        $this.addClass('on');
                    }
                });
            },
            onClickIntoBtn:function( ret_fn ){
                var $btn_buy = this.$btn_buy;
                $btn_buy.off('click');
                $btn_buy.on('click', ret_fn );
            },
            onClickAutoBtn:function( ret_fn ){
                var $btn_auto = this.$btn_auto;
                $btn_auto.off('click');
                $btn_auto.on('click', ret_fn );
            },
            onClickListTab:function(){
                $('.tab_navi a').click(function(){
                    var $parent = $(this).closest('.g_tab');

                    $parent.find('.tab_navi a').removeClass('active');
                    $parent.find('.tab_con').hide();
                    $(this).addClass('active');
                    $($(this).attr('href')).show();

                    return false;
                });
            },
            onKeydownCheck:function(){
                this.$into_info.find('input').keydown(function(e){
                    var key = (e) ? e.keyCode : event.keyCode,
                        ctrl = (e) ? e.ctrlKey  : event.ctrlKey,
                        alt = (e) ? e.altKey  : event.altKey,
                        shift = (e) ? e.shiftKey  : event.shiftKey,
                        cmd = (e) ? e.metaKey  : event.metaKey;

                    if(ctrl || alt || shift || cmd){
                        return false;
                    }
                    if(!((key>=48 && key<=57) || (key>=37 && key<=40) || (key>=96 && key<=105)
                        || key === 8 || key === 46 || key === 190 || key === 144 || key === 110)){
                        return false;
                    }
                });
            },
            get_select_point:function(){
                var $btn, len;

                if( this.select_tab === 1 ){
                    $btn = this.$buy_button;
                }else{
                    $btn = this.$auto_point;
                }

                len = $btn.length;

                for(var i=0; i<len; i++){
                    if( $btn[i].className === 'on' ){
                        return $btn[i].value;
                    }
                }
            },
            change_into_info:function( type ){
                var view_text;

                switch (type){
                    case 'login':
                        view_text = '구매하기';
                        break;
                    case 'logout':
                        view_text = '로그인';
                        break;
                    case 'into':
                        view_text = '대기중..';
                        break;
                    case 'reserve':
                        view_text = '대기중..(Cancel)';
                        break;
                    default:
                        view_text = '';
                        break;
                }

                this.$btn_buy.text(view_text);
            },
            change_auto_info:function( type ){
                var view_text;

                switch (type){
                    case 'login':
                        view_text = '설정하기';
                        break;
                    case 'logout':
                        view_text = '로그인';
                        break;
                    case 'auto':
                        view_text = '취소하기';
                        break;
                    default:
                        view_text = '';
                        break;
                }

                this.$btn_auto.text(view_text);
            },
            change_user_info:function( type ){
                switch (type){
                    case 'login':
                        this.$user_info.show();
                        this.$login_info.hide();
                        break;
                    case 'logout':
                        this.$user_info.hide();
                        this.$login_info.show();
                        break;
                    default:
                        break;
                }
            },
            view_user_point:function(point){
                point = this.set_comma(point);
                this.$user_point.val( point );
            },
            get_stop_record:function(){
                var stop_odds;

                if( this.select_tab === 1 ){
                    stop_odds = this.$manual_stop.val()
                }else{
                    stop_odds = this.$auto_stop.val();
                }

                return (stop_odds ? parseFloat(stop_odds) : 0);
            },
            get_auto_count:function(){
                var auto = this.$auto_count.val();

                return parseInt(auto);
            },
            view_stop_point:function(point, odds){
                var view_text;

                view_text = 'STOP : ' + this.set_comma(Math.round(point * odds)) + 'p';

                this.$btn_buy.text(view_text);
            },
            set_comma: function(x) {
                var temp = "",
                    is_minus = false;

                x = this.set_uncomma(x);

                if (x < 0) {
                    is_minus = true;
                    x = x * -1;
                }

                x = String(x);

                num_len = x.length;
                co = 3;
                while (num_len > 0) {
                    num_len = num_len - co;
                    if (num_len < 0) {
                        co = num_len + co;
                        num_len = 0;
                    }
                    temp = "," + x.substr(num_len, co) + temp;
                }

                temp = temp.substr(1);
                if (is_minus) {
                    temp = '-' + temp;
                }

                return temp;
            },
            set_uncomma: function(x) {
                var reg = /(,)*/g;
                x = parseInt(String(x).replace(reg, ""), 10);
                return (isNaN(x)) ? 0 : x;
            },
            draw_into_list:function(into_list){
                var into_html=[], win_html=[], c_color, item,
                    multi, point, win_point, nick, itemData, lists = [];

                this.$into_list.children().hide();
                for (var i = 0; i < into_list.length; ++i) {
                    itemData = into_list[i];

                    multi = itemData.multiple;
                    nick = itemData.username;

                    if(!itemData.multiple){
                        multi = itemData.manualValue;
                    }

                    if (this.$into_list.children()[i]) {
                        item = $(this.$into_list.children()[i]);
                    }
                    else {
                        item = this.draw_new_list_item();
                    }

                    if( multi !== -1 ){
                        c_color = 'c_green';
                        point = this.set_comma(itemData.point);
                        win_point = this.set_comma(itemData.wonPoint);
                        multi = this.get_view_multi(multi/100);
                        win_html.push(item);
                    }else{
                        c_color = 'c_orange';
                        multi = '-';
                        win_point = '-';

                        if( itemData.point === -1 ){
                            point = '?';
                        }else{
                            point = this.set_comma(itemData.point);
                        }
                        into_html.push(item);
                    }

                    this.draw_mod_list_item(item, nick, multi, point, win_point, c_color);

                    item.show();
                }

                this.$into_list.append(into_html, win_html);
            },
            draw_mod_list_item:function(el, nick, multi, point, win_point, c_color) {
                el.removeClass();
                el.addClass(c_color);
                el.addClass("listItem");
                el.find(".td_nick").text(nick);
                el.find(".td_point").text(point);
                el.find(".td_multi").text(multi);
                el.find(".td_winpoint").text(win_point);

                return el;
            },
            draw_new_list_item:function() {
                var $item = $("<tr>", {}),
                    $nick = $("<td>", {class:"td_nick"}),
                    $point = $("<td>", {class:"td_point"}),
                    $multiple = $("<td>", {class:"td_multi"}),
                    $winPoint = $("<td>", {class:"td_winpoint"});

                $item.append($nick);
                $item.append($point);
                $item.append($multiple);
                $item.append($winPoint);

                return $item;
            },
            end_into_list:function( into_list ){
                var $trs = this.$into_list.children('.c_orange'),
                    $tds = $trs.children('td'),
                    lose_list=[], lose_point, item, tidx;

                $trs.removeClass('c_orange').addClass('c_red');

                for( var idx in into_list ){
                    item = into_list[idx];
                    multi = item['multiple'];

                    if( multi === -1 ){
                        lose_list.push(item);
                    }
                }

                if( lose_list.length ){
                    for( var idx in lose_list ){
                        item = lose_list[idx];
                        lose_point = 0; //item['point'] * -1;

                        tidx = (parseInt(idx) + 1) * 4 - 1;
                        if( typeof $tds[tidx] !== 'undefined' ){
                            $tds[tidx].innerText = this.set_comma(lose_point);
                        }else{
                            console.error( idx, tidx, lose_list, $tds );
                        }
                    }
                }
            },
            draw_auto_count_select:function(){
                var html=[];

                for(var idx in this.auto_counts){
                    html.push('<option value="'+this.auto_counts[idx]+'">'+this.auto_counts[idx]+'</option>');
                }

                this.$auto_count.html( html.join('') );
            },
            draw_simple_history:function( list ){
                var html=[], view_cnt = this.simple_view_cnt,
                    item;

                for( var i=0; i<view_cnt; i++ ) {
                    item = list[i];
                    if( item ){
                        html.unshift( this.draw_simple_history_item(item.game_times, item.game_result ).join('') );
                    }else{
                        break;
                    }
                }

                this.$simple_hiotory_list.html( html.join('') );
            },
            redraw_simple_history:function( list ){
                var html=[], max_view_cnt = this.simple_view_cnt, list_cnt, remove_cnt,
                    item, $li, $tmp_li;

                list_cnt = list.length;

                $li = this.$simple_hiotory_list.children('li');

                for( var i=0; i<list_cnt; i++ ) {
                    item = list[i];
                    if( item ){
                        html.unshift( this.draw_simple_history_item(item.game_times, item.game_result ).join('') );
                    }else{
                        break;
                    }
                }

                if( $li.length > max_view_cnt-list_cnt ){
                    remove_cnt = $li.length - (max_view_cnt-list_cnt);
                    for( var i=0; i<remove_cnt; i++){
                        $tmp_li = $li[i];
                        if( $tmp_li ){
                            this.$simple_hiotory_list[0].removeChild($tmp_li);
                        }
                    }
                }

                this.$simple_hiotory_list.append( html.join('') );
            },
            draw_simple_history_item:function(times, multiple){
                var html=[], multi, multi_class;

                multi = this.get_view_multi(multiple);

                if( multiple >= 2.00){
                    multi_class = 'c_green';
                }else{
                    multi_class = 'c_red';
                }

                html.push( '<li>' );
                html.push( '    <h3>' + times + '회</h3>' );
                html.push( '    <p class="'+multi_class+'">' + multi + '</p>' );
                html.push( '</li>' );

                return html;
            },
            draw_history:function( list ){
                var html=[], item;

                for( var idx in list ) {
                    item = list[idx];
                    this.$history_list_item[item.game_times] = $( this.draw_history_item(item.game_times, item.game_result ).join('') );
                }

                for( var idx in this.$history_list_item ){
                    this.$history_list.prepend( this.$history_list_item[idx] );
                }
            },
            redraw_history:function( list ){
                var html=[], max_view_cnt = 300, list_cnt, remove_cnt,
                    item, $li, $tmp_li, li_cnt;

                list_cnt = list.length;

                $li = this.$history_list.children('tr');
                li_cnt = $li.length;

                for( var i=0; i<list_cnt; i++ ) {
                    item = list[i];
                    if( item ){
                        this.$history_list_item[item.game_times] = $( this.draw_history_item(item.game_times, item.game_result ).join('') );
                        this.$history_list.prepend( this.$history_list_item[item.game_times] );
                    }else{
                        break;
                    }
                }

                if( $li.length > max_view_cnt-list_cnt ){
                    remove_cnt = $li.length - (max_view_cnt-list_cnt);
                    for( var i=0; i<remove_cnt; i++){
                        $tmp_li = $li[li_cnt - i - 1];
                        if( $tmp_li ){
                            this.$history_list[0].removeChild($tmp_li);
                        }
                    }
                }
            },
            draw_history_item:function(times, multiple){
                var html=[], multi, multi_class;

                multi = this.get_view_multi(multiple);

                if( multiple >= 2.00){
                    multi_class = 'c_green';
                }else{
                    multi_class = 'c_red';
                }

                html.push( '<tr>' );
                html.push( '    <td class="td_round">' + times + '회</td>' );
                html.push( '    <td class="' + multi_class + ' td_result">' + multi + '</td>' );
                html.push( '    <td>-</td>' );
                html.push( '    <td>-</td>' );
                html.push( '</tr>' );

                return html;
            },
            get_view_multi:function(multi){
                if( multi == -1 ){
                    multi = '-';
                }else if( multi >= 1000.00 ){
                    multi = (multi/1000).toFixed(2)+'k';
                }else{
                    multi = (multi).toFixed(2)+'x';
                }
                return multi;
            },
            draw_myinto_list:function(list){
                var item, list_item, $item_td;

                for( var idx in list ){
                    item = list[idx];
                    item.times;
                    list_item = this.$history_list_item[item.times];
                    if( typeof list_item !== 'undefined' ){
                        $item_td = list_item.children('td');
                        $item_td[2].innerText = this.set_comma( item.gpoint );
                        $item_td[3].innerText = this.set_comma( item.prize );
                    }
                }
            },
            draw_inspection:function(msg){
                var html = [],
                    $div,
                    height = $(window).height();

                $div = $("#inspection_view");
                if( $div.length ){
                    $div.show();
                    return true;
                }

                html.push('<div id="inspection_view" style="height: '+height+'px;">');
                html.push(' <img src="/image/boostrun_notice_0720.jpg" alt="">');
                html.push('</div>');

                $("body").prepend( html.join('') );
            },
            remove_inspection:function(){
                var $div;

                $div = $("#inspection_view");
                if( $div.length ){
                    $div.hide();
                }
            },
            view_alert:function(msg){
                this.$alert_layer.find("p")[0].innerText = msg;
                this.$alert_layer.show();
            }
        }
    };
})(window);