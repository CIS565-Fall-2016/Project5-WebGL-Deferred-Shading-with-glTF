var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.debugScissor = false;
        this.enableEffect0 = false;
        this.enableEffect1 = false;
        this.enableEffect2 = true;
    };

    var init = function() {
        cfg = new Cfg();

        var gui = new dat.GUI();
        // TODO: Define any other possible config values
        gui.add(cfg, 'debugView', {
            'None':             -1,
            '0 Depth':           0,
            '1 Position':        1,
            '2 Geometry normal': 2,
            '3 Color map':       3,
            '4 Normal map':      4,
            '5 Surface normal':  5
        });
        gui.add(cfg, 'debugScissor');

        var eff0 = gui.addFolder('Toon Shading');
        eff0.open();
        eff0.add(cfg, 'enableEffect0');

        var eff1 = gui.addFolder('Bloom');
        eff1.open();
        eff1.add(cfg, 'enableEffect1');

        var eff2 = gui.addFolder('Motion Blur');
        eff2.open();
        eff2.add(cfg, 'enableEffect2');
        // TODO: add more effects toggles and parameters here
    };

    window.handle_load.push(init);
})();
