var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.debugScissor = false;
        this.enableBloom = true;
		this.bloomThreshold = 0.2;
    };

    var init = function() {
        cfg = new Cfg();

        var gui = new dat.GUI();
        // TODO: Define any other possible config values
        gui.add(cfg, 'debugView', {
            'None':             -1,
            '0 Depth':           0,
            '1 Position':        1,
            '2 Surface normal':  2,
            '3 Color map':       3,
        });
        gui.add(cfg, 'debugScissor');

        var eff = gui.addFolder('EFFECT NAME HERE');
        eff.open();
		var eff0 = eff.addFolder('Bloom');
        eff0.add(cfg, 'enableBloom');
        // TODO: add more effects toggles and parameters here
		eff0.add(cfg, 'bloomThreshold', 0.0, 1.0);
		eff0.open();
    };

    window.handle_load.push(init);
})();
