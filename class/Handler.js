/**
 * Created by young on 2017. 6. 30..
 */
(function(context) {
    if (context.Handler) {
        return;
    }

    var private = {
        model:Model(),
        send_login:function(){
            var phpkey, send_msg;

            phpkey = private.model.get_cookie('PHPSESSID');

            send_msg = {
                mID:"login",
                value:phpkey
            };

            Handler.socket.send( send_msg );
        },
        login:function(msg){
            private.model.login( msg.userid, msg.nickname, msg.gPoint, msg.level );
            View.UI.change_into_info( 'login' );
            View.UI.change_auto_info( 'login' );
            View.UI.change_user_info( 'login' );
            View.UI.view_user_point( msg.gPoint );
        },
        request_into:function(){
            var point, stop_record;

            if(private.model.is_login() === false){
                View.UI.view_alert('로그인이 필요합니다.');
                return false;
            }

            if (private.model.get_status() === 1) {
                View.UI.set_select_tab(1);
                point = View.UI.get_select_point();
                stop_record = View.UI.get_stop_record();

                if( stop_record > 1 ){
                    if( private.model.set_into_point(point) === true ) {
                        private.model.set_stop_record( stop_record );
                        private.send_into();
                    }else{
                        var msg = '포인트 부족';
                        View.UI.view_alert(msg);
                        return false;
                    }
                }

            }
        },
        reserve_into:function(){
            var point, stop_record, msg;

            if(private.model.is_login() === false){
                View.UI.view_alert('로그인이 필요합니다.');
                return false;
            }

            if ( private.model.get_status() > 1 ) {
                if( private.model.get_is_reserved() === true ){
                    msg = '중복 예약';
                    View.UI.view_alert(msg);
                    return false;
                }

                View.UI.set_select_tab(1);
                point = View.UI.get_select_point();
                stop_record = View.UI.get_stop_record();

                if( stop_record > 1 ){
                    if( private.model.set_into_point(point) === true ) {
                        private.model.set_stop_record( stop_record );
                        private.model.set_is_reserved();
                        return true;
                    }else{
                        msg = '포인트 부족';
                        View.UI.view_alert(msg);
                        return false;
                    }
                }
            }
        },
        auto_into:function(){
            var point, stop_record, count, msg;

            if(private.model.is_login() === false){
                View.UI.view_alert('로그인이 필요합니다.');
                return false;
            }

            View.UI.set_select_tab(2);
            count = View.UI.get_auto_count();

            if ( private.model.get_status() === 1 && private.model.get_is_into() === false ) {
                point = View.UI.get_select_point();
                stop_record = View.UI.get_stop_record();

                if( stop_record > 1 ){
                    if( private.model.set_into_point(point) === true ) {
                        private.model.set_stop_record( stop_record );
                        private.send_into();
                    }else{
                        msg = '포인트 부족';
                        View.UI.view_alert(msg);
                        return false;
                    }
                }
                count--;
            }

            if( count > 0 ) {
                point = View.UI.get_select_point();
                stop_record = View.UI.get_stop_record();

                if( stop_record > 1 ){
                    if( private.model.set_into_point(point) === true ) {
                        private.model.set_stop_record( stop_record );
                        private.model.set_auto(count);
                        View.UI.change_auto_info('auto');
                        return true;
                    }else{
                        msg = '포인트 부족';
                        View.UI.view_alert(msg);
                        return false;
                    }
                }
            }
        },
        send_into:function() {
            var send_msg, point, stop_record, msg;

            point = private.model.get_into_point();
            stop_record = private.model.get_stop_record();

            if( point > 100 && stop_record > 1 ){
                if( private.model.add_user_point(point * -1) ){
                    stop_record = Math.round((stop_record * 100));
                    send_msg = {
                        mID: "buyin",
                        autoStop: stop_record,
                        point: point
                    };

                    Handler.socket.send(send_msg);
                }else{
                    msg = '포인트 부족';
                    View.UI.view_alert(msg);
                }
            }
        },
        into:function(msg){
            View.UI.change_into_info( 'into' );

            private.model.set_into(msg.point);
        },
        send_stop:function(){
            var send_msg;

            send_msg = {
                mID: "manualStop"
            };

            Handler.socket.send(send_msg);
        },
        stop:function(msg){
            // TODO : 수동구매 정상. 수동 구매 별도 처리시
            // {"mID":"manualStop","timeTag":13331,"multiple":205,"point":1000,"wonPoint":2050}
        },
        click_into_btn:function(){
            if( private.model.is_login() === false ){
                View.UI.view_alert('로그인 후 이용할 수 있습니다.');
            }else{
                if( private.model.get_is_into() === true ){
                    if( private.model.get_status() === 2 ){
                        private.send_stop();
                    }
                }else{
                    if( private.model.get_status() === 1 ){
                        private.request_into();
                    }else{
                        if( private.model.get_is_reserved() === false ){
                            if( private.reserve_into() === true ){
                                View.UI.change_into_info( 'reserve' );
                                private.model.set_auto(0);
                                View.UI.change_auto_info( 'login' );
                            }
                        }else{
                            private.model.cancel_reserve();
                            View.UI.change_into_info( 'login' );
                        }
                    }
                }
            }
        },
        click_auto_btn:function(){
            var msg;

            if( private.model.is_login() === false ){
                View.UI.view_alert('로그인 후 이용할 수 있습니다.');
            }else{
                if( (private.model.get_is_into() === true || private.model.get_is_reserved() === true)
                    && private.model.get_is_auto() === false ){
                    msg = '구매중 혹은 예약 상태.';
                    View.UI.view_alert(msg);
                }else{
                    if( private.model.get_is_auto() === true ){
                        private.model.set_auto(0);
                        View.UI.change_auto_info( 'login' );
                    }else{
                        private.auto_into();
                    }
                }
            }
        },
        history_into:function(cart){
            if( cart.wonPoint === -1 ){
                private.model.history_into( cart.point );
            }else{
                // 처리할 필요없음.
            }
        },
        check_is_game_ing:function(){
            if( private.model.get_is_into() || private.model.get_is_reserved() || private.model.get_is_auto() ){
                return true;
            }else{
                return false;
            }
        }
    };

    context.Handler = {
        socket:Library.util.WebSocket(),
        init:function(){
            this.socket.onConnect( "bustabit.score888.com:3000", function(){
                private.send_login();
                View.Animation.init( $("#playground") );
                View.UI.init( $("#into_info"), $("#recent_info"), $("#into_list") );

                View.UI.onClickPointBtn( private.check_is_game_ing );
                View.UI.onClickIntoBtn( private.click_into_btn );
                View.UI.onClickAutoBtn( private.click_auto_btn );
                View.UI.onClickListTab();
            });

            this.socket.onConnectError( function(){
                private.model.set_status(0);
                View.Animation.inspection();
                View.UI.draw_inspection('점검중입니다.');
            });

            this.socket.onRecive( function(msg){
                if( msg.errorCode ){
                    Handler.error( msg.errorCode );
                }else{
                    switch (msg.mID){
                        case 'status':
                            Handler.play( msg );
                            private.model.set_game_times( msg.times );
                            break;
                        case 'login':
                            private.login( msg );
                            if( msg.cart !== null ){
                                private.history_into( msg.cart );
                            }
                            break;
                        case 'logout':
                            Handler.logout( );
                            break;
                        case 'userPoint':
                            private.model.set_user_point( msg.gPoint );
                            View.UI.view_user_point( msg.gPoint );
                            break;
                        case 'serverTime':
                            private.model.set_server_time( msg.value );
                            break;
                        case "buyin":
                            private.into( msg );
                            break;
                        case "manualStop":
                            private.stop(msg);
                            break;
                        case "won":
                            var ori_is_into = private.model.get_is_into();

                            private.model.update_into_won(msg);
                            View.UI.draw_into_list( private.model.get_into_list() );
                            if( (private.model.get_is_win() === true) && (ori_is_into === true)){
                                private.model.add_myinto_list(msg.point, msg.wonPoint);
                                View.UI.change_into_info( 'login' );
                            }
                            break;
                        case "list":
                            Handler.view_list(msg.value);
                            break;
                        case "gameHistory":
                            Handler.view_history_list( msg.value );
                            break;
                        case "userHistory":
                            Handler.draw_myinto_list( msg.value );
                            break;
                        default :
                            console.log('default', msg);
                            break;
                    }
                }

            });

            this.socket.onDisConnect( function(){
                Handler.logout();
            });
        },
        play:function(msg){
            switch (msg.value){
                case 1:
                    if( private.model.get_status() === 0 ){
                        View.Animation.init( $("#playground") );
                        View.UI.remove_inspection(msg);
                    }
                    private.model.reset();
                    View.Animation.ready( msg.startTime - msg.serverTime );
                    if(private.model.is_login() === true && private.model.get_is_reserved() === false ){
                        View.UI.change_into_info( 'login' );
                    }
                    View.UI.draw_into_list([]);

                    if( private.model.get_is_reserved() === true ){
                        private.send_into();
                    }
                    if( private.model.get_is_auto() === true ){
                        private.send_into();
                        private.model.set_auto( private.model.get_auto_count() - 1 );
                        if( private.model.get_auto_count() < 1 ){
                            View.UI.change_auto_info( 'login' );
                        }
                    }
                    break;
                case 21:
                    // start
                    private.model.set_status(2);

                    if( msg.timeTag ){
                        View.Animation.reset();
                        View.Animation.run( private.model, msg.timeTag );
                    }

                    if( private.model.get_is_into() === true ){
                        View.UI.view_stop_point( private.model.get_into_point(), private.model.get_odds() );
                    }
                    break;
                case 22:
                    // run
                    if( private.model.get_status() != 2 ){
                        View.Animation.virtual_run( private.model, msg.timeTag );
                    }

                    private.model.set_status(2);
                    View.Animation.run( private.model, msg.timeTag );

                    if( private.model.get_is_into() === true ){
                        View.UI.view_stop_point( private.model.get_into_point(), private.model.get_odds() );
                    }
                    break;
                case 23:
                    // stop
                    private.model.set_status(2);
                    View.Animation.run( private.model, msg.timeTag );

                    if(private.model.is_login() === true && private.model.get_is_reserved() === false){
                        View.UI.change_into_info( 'login' );
                    }
                    break;
                case 3:
                    // 결과값
                    private.model.set_status(3);
                    View.Animation.end( private.model, msg.timeTag );
                    View.UI.end_into_list( private.model.get_into_list() );
                    break;
                case 4:
                    // 점검
                    private.model.set_status(0);
                    View.Animation.inspection();
                    View.UI.draw_inspection(msg.msg);
                    break;
            }
        },
        logout:function(){
            private.model.logout();
            View.UI.change_into_info( 'logout' );
            View.UI.change_auto_info( 'logout' );
            View.UI.change_user_info( 'logout' );
        },
        error:function( code ){
            var msg;

            switch (code){
                case -1:    //  ERROR_NOT_LOGINED
                    msg = '로그인 실패';
                    break;
                case -2:    //  ERROR_UNDEFINED_USER
                    msg = '알수없는 사용자';
                    break;
                case -3:    //  ERROR_DUPLICATE_LOGIN
                    msg = '중복 로그인';
                    break;
                case -4:    //  ERROR_NOT_BETTING_TIME
                    msg = '구매시간 종료';
                    break;
                case -5:    //  ERROR_NOT_ENOUGH_POINT
                    msg = '포인트 부족';
                    break;
                case -6:    //  ERROR_WRONG_BET_VALUE
                    msg = '구매값 오류';
                    break;
                case -7:    //  ERROR_DUPLICATE_BET_VALUE
                    msg = '중복 구매';
                    break;
                case -8:    //  ERROR_WRONG_PARAM
                    msg = '파라메타 오류';
                    break;
                case -9:    //  ERROR_UNSUPPORTED_PACKET
                    msg = '패킷 오류';
                    break;
                case -10:    //  ERROR_NOT_MANUAL_STOP_TIME
                    msg = '시간 초과';
                    break;
                case -11:    //  ERROR_NOT_FIND_BETTING
                    msg = '구매내역 없음';
                    break;
                case -12:    //  ERROR_ALREADY_BETSTOP
                    msg = '이미 정지됨';
                    break;
                case -13:    //  ERROR_NO_LOGIN_SESSION
                    // msg = '로그인 중지';
                    break;
                case -14:    // ERROR_MULTIPLE_100
                    // msg = '1배당에 중지 금지.';
                    break;
                case -998:  //  ERROR_DB
                    msg = '데이터베이스 오류';
                    break;
                case -999:  //  ERROR_UNKNOWN
                    msg = '알수없는 오류';
                    break;
                default:
                    msg = '시스템 에러';
                    break;
            }

            if( msg ) {
                console.error( 'error', msg);
                View.UI.view_alert(msg);
            }
        },
        view_list:function( list ){
            private.model.set_into_list( list );
            View.UI.draw_into_list( private.model.get_into_list() );
        },
        view_history_list:function( list ){
            var list_len=0, last_times = 0,
                myinto_list = private.model.myinto_list,
                add_history = [], add_myinto_list = [],
                item;

            if( private.model.history_list.length ){
                list_len = list.length;
                last_times = private.model.history_list[0].game_times;

                for( var i=0; i<list_len; i++){
                    item = list[i];
                    if( item.game_times <= last_times ){
                        break;
                    }
                    add_history.push( item );

                    if( typeof myinto_list[item.game_times] !== 'undefined' ){
                        add_myinto_list.push( myinto_list[item.game_times] );
                    }
                }

                private.model.history_list = list;
                View.UI.redraw_simple_history( add_history );
                View.UI.redraw_history( add_history );
                View.UI.draw_myinto_list( add_myinto_list );
            }else{
                private.model.history_list = list;
                View.UI.draw_simple_history( list );
                View.UI.draw_history( list );
            }
        },
        draw_myinto_list:function( list ){
            private.model.myinto_list = list;
            View.UI.draw_myinto_list( list );
        }
    };
})(window);