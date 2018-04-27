cc.Class({
    extends: cc.Component,

    properties: {
        block_prefab: {
            default: null,       
            type: cc.Prefab
        },
        block_bg_prefab: {
            default: null,       
            type: cc.Prefab
        },

        blockLayout: {
            default: null,       
            type: cc.Layout
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initPlayLayout()
    },

    start () {
        // var node = cc.instantiate(this.block_prefab)
        // node.getComponent('BlockNode').setValue(1024)
        // node.parent = this.node
        // node.setPosition(0, 0)
    },

    initPlayLayout () {
        var blockNum = 16
        while (blockNum--) {
            var node = cc.instantiate(this.block_bg_prefab)
            node.parent = this.blockLayout.node
        }
    }

    // update (dt) {},
});