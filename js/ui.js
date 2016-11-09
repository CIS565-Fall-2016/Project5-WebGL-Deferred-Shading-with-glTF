var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.debugScissor = false;
        this.enableScissor = true;
        this.enableBloom = false;
        this.enableCel = false;
        this.bloomTwoPass = false;
    };

    var init = function() {
        cfg = new Cfg();

        var gui = new dat.GUI();
        // TODO: Define any other possible config values
        gui.add(cfg, 'debugView', {
            'None':             -1,
            '0 Depth':           0,
            '1 Position':        1,
            '2 Normal':          2,
            '3 Color map':       3
        });

        var sc = gui.addFolder('Scissor');
        sc.open();
        sc.add(cfg, 'enableScissor');
        sc.add(cfg, 'debugScissor');

        var eff0 = gui.addFolder('Effects');
        eff0.open();
        eff0.add(cfg, 'enableBloom');
        eff0.add(cfg, 'bloomTwoPass');
        eff0.add(cfg, 'enableCel');
        // TODO: add more effects toggles and parameters here
    };

    window.handle_load.push(init);
})();
