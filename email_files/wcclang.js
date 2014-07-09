var BRAVO = BRAVO || {};

BRAVO.Translate = BRAVO.Translate ||
(function(){
  var _data = {};


  var load = function( items )
  {
    for( var i in items )
    {
      _data[ i ] = items[ i ];
    }
  }

  var clear = function()
  {
    _data = {};
  }

  var translate = function( key )
  {
    key = key.toUpperCase();
    if( !( key in _data ) )
    {
      throw "INVALID_TRANSLATE_KEY: " + key;
    }

    return _data[ key ];
  }

  return {
    "_" : translate,
    "translate" : translate,
    "load" : load,
    "clear" : clear
  };
})();
