
cc.Class({
    extends: cc.Component,

    properties: {
        bg: cc.Node = null,

        bar: {
            get () {
                return this._bar;
            },
            set (value) {
                this._bar = value;
            }
        },
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    // update (dt) {},
});
