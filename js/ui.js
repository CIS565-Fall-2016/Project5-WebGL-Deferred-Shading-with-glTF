var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.debugScissor = false;
        this.enableScissor = false;
        this.enableBlinnPhong = false;
        this.enableRampShading = false;
        this.debugShaders = 1;
        this.movingLights = true;
        this.bands = 5;
        this.edge = 0;
        this.rampShading = false;
        this.lightRadius = 4.0;
        this.DoFBlur = false;
        this.focus = 1;
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
        });
        gui.add(cfg, 'lightRadius', 0.0, 10.0);
        gui.add(cfg, 'debugScissor');
        gui.add(cfg, 'enableScissor');
        gui.add(cfg, 'movingLights');
        var eff0 = gui.addFolder('Shaders');
        eff0.open();
        eff0.add(cfg, 'debugShaders', {
          'Default': 0,
          'Blinn-Phong': 1,
          'Ramp Shading': 2
        });
        var ramp = gui.addFolder('Ramp Shading');
        ramp.open();
        ramp.add(cfg, 'rampShading');
        ramp.add(cfg, 'bands', 1, 10);
        var edge = gui.addFolder('Edge Highlights');
        edge.open();
        edge.add(cfg, 'edge', {
          'None': 0,
          'One Pass': 1,
          'Two Pass': 2
        });
        var blur = gui.addFolder('Blur Effects');
        blur.open();
        blur.add(cfg, 'DoFBlur');
        blur.add(cfg, 'focus', 0, 1);

        // TODO: add more effects toggles and parameters here
    };

    window.handle_load.push(init);
})();
