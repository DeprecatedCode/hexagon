module.exports = {
    _get: function(req, ret) {
        ret({'random': 'Hello'});
    },
    
    random: function(req, ret) {
        ret(Math.random());
    },
    
    a: function(req, ret) {
        ret('A');
    },
    
    b: {'_*': 'B'}
}