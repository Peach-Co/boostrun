/**
 * Created by young on 2017. 6. 30..
 */

(function(context) {
    if (context.Model) {
        return;
    }

    var private = {
        game_status:1,
        game_times:1,
        is_login:false,
        user_id:'',
        user_point:0,
        user_nickname:'',
        user_level:0,
        server_time:null,
        into_point:0,
        allow_point:[1000, 5000, 10000, 50000, 100000],
        stop_record:0,
        odds:'1.00',
        is_into:false,
        is_win:false,
        is_reserved:false,
        is_auto:false,
        auto_count:0,
        into_list:[]
    }

    context.Model = (function(){
        var model = {
            history_list:[],
            myinto_list:[],
            reset:function(){
                this.set_status(1);
                private.is_into = false;
                private.is_win = false;
            },
            set_status: function (game_status) {
                private.game_status = game_status;
            },
            get_status: function () {
                return private.game_status;
            },
            set_game_times:function( times ){
                private.game_times = times;
            },
            get_game_times:function(){
                return private.game_times;
            },
            set_server_time: function( time ){
                private.server_time = new Date(time);
            },
            get_server_time: function(){
                return private.server_time;
            },
            set_user_point:function(point){
                private.user_point = point;
            },
            get_cookie: function (name) {
                name = name + '=';
                var cookieData = document.cookie;
                var start = cookieData.indexOf(name);
                var value = '';
                if (start != -1) {
                    start += name.length;
                    var end = cookieData.indexOf(';', start);
                    if (end == -1) {
                        end = cookieData.length;
                    }
                    value = cookieData.substring(start, end);
                }
                return decodeURIComponent(value);
            },
            float_to_fixed: function (x, s) {
                var len = s;

                s = Math.pow(10, s);
                x = Math.round(x * s) / s;

                return x.toFixed(len);
            },
            cal_ypoint: function (k) {
                return Math.pow(1.06, k - 1);
            },
            login:function(userid, nickname, point, level){
                private.user_id = userid;
                private.user_nickname = nickname;
                private.user_point = point;
                private.user_level = level;
                private.is_login = true;
            },
            is_login:function(){
                return private.is_login;
            },
            logout:function(){
                private.user_id = '';
                private.user_nickname = '';
                private.user_point = 0;
                private.user_level = 0;
                private.is_login = false;
            },
            set_into_point:function(point){
                point = parseInt(point);
                if( private.allow_point.indexOf(point) === -1 ){
                    return false;
                }

                if( private.user_point >= point ){
                    private.into_point = point;
                    return true;
                }else{
                    return false;
                }
            },
            get_into_point:function(){
                return private.into_point;
            },
            set_stop_record:function(stop_record){
                private.stop_record = stop_record;
            },
            get_stop_record:function(){
                return private.stop_record;
            },
            set_into:function(point){
                this.add_myinto_list(point, 0);
                private.is_into = true;
                private.is_reserved = false;
            },
            get_is_into:function(){
                return private.is_into;
            },
            get_is_win:function(){
                return private.is_win;
            },
            set_odds:function(odds){
                private.odds = odds;
            },
            get_odds:function(){
                return private.odds;
            },
            set_is_reserved:function(){
                private.is_reserved = true;
            },
            get_is_reserved:function(){
                return private.is_reserved;
            },
            cancel_reserve:function(){
                private.is_reserved = false;
            },
            set_into_list:function( list ){
                var len = list.length;

                if( len > 0 ){
                    list = this.sort_into_list(list);
                }

                private.into_list = list;
            },
            get_into_list:function( list ){
                return private.into_list;
            },
            sort_into_list:function(list){
                return list.sort( function(a, b){
                    if( a.multiple === -1 && b.multiple === -1 ){
                        return b.point - a.point;
                    }
                    if( a.multiple === -1 ){
                        return 1;
                    }
                    if( b.multiple === -1 ){
                        return -1;
                    }
                    if( a.multiple === b.multiple){
                        return b.point - a.point;
                    }

                    return b.multiple - a.multiple;
                } );
            },
            update_into_won:function(msg){
                var sch_id = msg.userid,
                    list = private.into_list;

                for( var idx in list ){
                    if( sch_id == list[idx].userid ){
                        list[idx].multiple = msg.multiple;
                        list[idx].wonPoint = msg.wonPoint;

                        if( (msg.point * msg.multiple / 100) !== msg.wonPoint ){
                            console.error( msg );
                        }

                        if( sch_id === private.user_id ){
                            private.is_into = false;
                            private.is_win = true;

                            this.add_user_point( msg.wonPoint );
                        }

                        break;
                    }
                }

                this.set_into_list(list);
            },
            history_into:function(point){
                this.set_into(point);
                private.into_point = point;
            },
            set_auto:function(count){
                if( count > 0 ){
                    this.is_auto = true;
                    this.auto_count = (count > 50 ? 50 : count);
                }else{
                    this.is_auto = false;
                    this.auto_count = 0;
                }
            },
            get_is_auto:function(){
                return this.is_auto;
            },
            get_auto_count:function(){
                return this.auto_count;
            },
            add_user_point:function(point){
                point = private.user_point - point;
                if( point < 0 ){
                    return false;
                }else{
                    private.user_point = point;
                    return true;
                }
            },
            add_myinto_list:function(point, wonPoint){
                var into_item = {};

                into_item.times = private.game_times;
                into_item.gpoint = point;
                into_item.prize = wonPoint;

                this.myinto_list[ private.game_times ] = into_item;
            }
        }

        return model;
    });
})(window);