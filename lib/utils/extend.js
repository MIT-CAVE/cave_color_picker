import isObject from './isObject.js'

export function extend( o, o1, o2) {
    if( !(o instanceof Object) ) o = {};

    copy(o, o1);
    if( o2 )
        copy(o, o2)

    function copy(a,b){
        for( var key in b )
            if( b.hasOwnProperty(key) ){
                if( isObject(b[key]) ){
                    if( !isObject(a[key]) )
                        a[key] = Object.assign({}, b[key]);
                    else
                        copy(a[key], b[key])
                }
                else
                    a[key] = b[key];
            }
    }

    return o;
}