/**
 * Created by young on 2017. 6. 30..
 */

(function(context) {
    if (context.Library) {
        return;
    }

    var private = {

    }

    context.Library = {
        util:{
            WebSocket:(function(){
                var socket = {
                    socket:null,
                    onConnect:function( url, ret_fn ){
                        try{
                            this.socket = io( url );
                            this.socket.on("connect", ret_fn);
                        }catch (e){
                            // console.error( e );
                        }
                    },
                    send:function( msg, ret_fn ){
                        if( this.socket ){
                            this.socket.emit("message", msg);

                            if( typeof ret_fn === 'function' ){
                                ret_fn();
                            }
                        }
                    },
                    onRecive:function( ret_fn ){
                        if( this.socket ) {
                            this.socket.on("message", ret_fn);
                        }
                    },
                    onDisConnect:function( ret_fn ){
                        if( this.socket ) {
                            this.socket.on("disconnect", ret_fn);
                        }
                    },
                    onConnectError:function( ret_fn ){
                        if( this.socket ) {
                            this.socket.on('connect_error', ret_fn);
                        }
                    }
                }

                return socket;
            })

        }
    };
})(window);