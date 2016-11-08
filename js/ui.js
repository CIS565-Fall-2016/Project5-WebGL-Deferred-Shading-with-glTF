var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.enableScissor = 1;
        this.bloom = 1;
        this.enableMotionBlur = false;
        this.boundingBoxScale = 1.0;
        this.light_dt = 0.03;
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
            '6 Motion blur vectors':  6,
            '7 Brightness filter':    7,
            '8 Blurred brightness':   8,
        });
        gui.add(cfg, 'light_dt', 0.0, 0.10);
        gui.add(cfg, 'enableScissor', {
          'No': 0,
          'Yes': 1,
          'Yes (with debug view)': 2,
        });
        gui.add(cfg, 'boundingBoxScale', 0.0, 2.0);

        gui.add(cfg, 'bloom', {
          'None': 0,
          '2d Gaussian kernel bloom': 1,
          '1d Gaussian kernel bloom': 2,
        });
        gui.add(cfg, 'enableMotionBlur');
    };

    window.handle_load.push(init);
})();
