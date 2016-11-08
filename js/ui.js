var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.scissorLights = true;
        this.tiled = true;
        this.debugScissor = false;
        this.debugTiles = false;
        this.enableBloom = false;
        this.bloomAmount = 2;
        this.bloomIterations = 10; 
    };

    var init = function() {
        cfg = new Cfg();

        var gui = new dat.GUI();
        // TODO: Define any other possible config values

        var debug = gui.addFolder('Debug');
        debug.open();
        debug.add(cfg, 'debugView', {
            'None':             -1,
            '0 Depth':           0,
            '1 Position':        1,
            '2 Geometry normal': 2,
            '3 Color map':       3,
            '4 Normal map':      4,
            '5 Surface normal':  5
        });
        debug.add(cfg, 'debugScissor');
        debug.add(cfg, 'debugTiles');

        var optim = gui.addFolder('Optimizations');
        optim.open();
        optim.add(cfg, 'scissorLights');
        optim.add(cfg, 'tiled');

        var bloom = gui.addFolder('Bloom');
        bloom.open();
        bloom.add(cfg, 'enableBloom');
        bloom.add(cfg, 'bloomAmount', 0, 10);
        bloom.add(cfg, 'bloomIterations', 0, 50);
    };

    window.handle_load.push(init);
})();
