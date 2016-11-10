var cfg;

MyScissorEnum = {
    None            : 0,
    ScissorQuad     : 1,
    ScissorSphere   : 2,
};

(function() {
    'use strict';

    var Cfg = function() {
        // TODO: Define config fields and defaults here
        this.debugView = 0;
        this.scissorMode = MyScissorEnum.None;
        this.enableBloom = false;
        this.bloomIterations = 5;
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
            '6 Scissor map':     6,
        });

       gui.add(cfg, 'scissorMode', {
            '0 None':     0,
            '1 Quad':   1,
            '2 Sphere': 2,
        });

        var effect_bloom = gui.addFolder('Bloom');
        effect_bloom.open();
        effect_bloom.add(cfg, 'enableBloom');
        effect_bloom.add(cfg, 'bloomIterations', 0, 25);
        // TODO: add more effects toggles and parameters here
    };

    window.handle_load.push(init);
})();
