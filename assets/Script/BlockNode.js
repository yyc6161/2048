cc.Class({
    extends: cc.Component,

    properties: {

        bg: {
            default: null,       
            type: cc.Node
        },
        label: {
            default: null,       
            type: cc.Label
        },

    },

    setValue (num) {
        this.node.value = num
        this.label.string = num
        this.node.name = 'block_'+num
        var color_bg = ''
        var color_value = '#F2E9DA'
        if (num <= 4) {
            color_value = '#787065'
        } 
        switch(num) {
            case 2: 
                color_bg = '#F2EADF'
                break
            case 4:
                color_bg = '#EFE0C9'
                break
            case 8:
                color_bg = '#F2B17B'
                break
            case 16:
                color_bg = '#EC986C'
                break
            case 32:
                color_bg = '#F47D5F'
                break
            case 64:
                color_bg = '#FB5E3D'
                break
            case 128:
                color_bg = '#E8D078'
                break
            case 256:
                color_bg = '#E9CA70'
                break
            case 512:
                color_bg = '#EDC762'
                break
            case 1024:
                color_bg = '#EAC157'
                break
            case 2048:
                color_bg = '#E7BF4E'
                break
            default:
                color_bg = '#000000'
        }
        var color = new cc.Color()
        this.bg.color = color.fromHEX(color_bg)
        this.label.node.color = color.fromHEX(color_value)
    },

});