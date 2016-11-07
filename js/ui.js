var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.debugScissor = false;
        this.enableBloom = true;
        this.bloomSize = 0.003;
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
            '5 Surface normal':  5,
            '6 Light scissors':  6,
        });
        gui.add(cfg, 'debugScissor');

        var eff0 = gui.addFolder('EFFECT NAME HERE');
        eff0.open();
        eff0.add(cfg, 'enableBloom');
        // TODO: add more effects toggles and parameters here
        eff0.add(cfg, 'bloomSize', {
            '0.002':      0.002,
            '0.003':      0.003,
            '0.005':      0.005,
            '0.01':       0.01,
            '0.05':       0.05,
        });
    };

    window.handle_load.push(init);
})();
