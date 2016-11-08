var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.enableScissor = 1;
        this.enableBlur = 0;
        this.enableMotionBlur = false;
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
        gui.add(cfg, 'enableScissor', {
          'No': 0,
          'Yes': 1,
          'Yes (with debug view)': 2,
        });

        var gaussBlur = gui.addFolder('Blur');
        gaussBlur.open();
        gaussBlur.add(cfg, 'enableBlur', {
          'None': 0,
          '2d kernel Gaussian blur': 1,
          '1d kernel Gaussian blur (x2, convolved)': 2,
        });
        gaussBlur.add(cfg, 'enableMotionBlur');
    };

    window.handle_load.push(init);
})();
