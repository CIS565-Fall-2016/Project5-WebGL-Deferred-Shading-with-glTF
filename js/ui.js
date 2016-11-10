var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.debugScissorOrSphere = false; 
        this.enableToon= false;
        this.enableSphere=false;
        this.enableBloom=false;
        this.enableBloomBang=false;
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
        gui.add(cfg, 'debugScissorOrSphere');

        var eff0 = gui.addFolder('EFFECT NAME HERE');
        eff0.open(); 
        // TODO: add more effects toggles and parameters here
        eff0.add(cfg, 'enableToon');
        eff0.add(cfg, 'enableSphere');
        eff0.add(cfg, 'enableBloom');
        eff0.add(cfg, 'enableBloomBang');
    };

    window.handle_load.push(init);
})();
