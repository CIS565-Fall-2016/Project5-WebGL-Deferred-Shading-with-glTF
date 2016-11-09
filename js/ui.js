var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.pause = false;
        this.debugView = -1;
        this.debugScissor = false;
        this.enableBloom = false;
        this.bloomSize = 0.01;
        this.useLightProxy = true;
        this.useInvertedDepthTestForLightProxy = true;
    };

    var init = function() {
        cfg = new Cfg();

        var gui = new dat.GUI();
        gui.add(cfg, 'pause');
        // TODO: Define any other possible config values
        gui.add(cfg, 'debugView', {
            'None':             -1,
            '0 Depth':           0,
            '1 Position':        1,
            '2 Color map':       2,
            '3 Normal':          3,
            '4 Light scissors':  4,
        });
        gui.add(cfg, 'debugScissor');
        gui.add(cfg, 'useLightProxy');
        gui.add(cfg, 'useInvertedDepthTestForLightProxy')

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
