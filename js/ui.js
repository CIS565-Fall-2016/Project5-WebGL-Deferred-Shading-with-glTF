var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = -1;
        this.debugScissor = false;
        //this.enableEffect0 = false;
        this.enableScissorTest = true;

        // bloom related
        this.enableBloom = true;
        this.bloomThreshold = 0.5;

        // toon related
        this.enableToon = false;
        this.rampLevel = 3;
        this.edgeThreshold = 0.5;
    
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
            '3 Color map':       3
        });
        gui.add(cfg, 'debugScissor');
    
        var scissor_test = gui.addFolder('Scissor Test');
        scissor_test.open();
        scissor_test.add(cfg, 'enableScissorTest');

        // TODO: add more effects toggles and parameters here
        var effect_bloom = gui.addFolder('Bloom Effect');
        effect_bloom.open();
        effect_bloom.add(cfg, 'enableBloom');
        effect_bloom.add(cfg, 'bloomThreshold', 0, 1);

        // TOON Shading
        var effect_toon = gui.addFolder('Toon Shading Effect');
        effect_toon.open();
        effect_toon.add(cfg, 'enableToon');
        effect_toon.add(cfg, 'rampLevel', 1, 16).step(1);
        effect_toon.add(cfg, 'edgeThreshold', 0.1, 2.0);
    };

    window.handle_load.push(init);
})();
