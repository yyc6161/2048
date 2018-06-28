const {ccclass, property} = cc._decorator;

import {getCellBgColor, getCellValueColor} from './utils'

@ccclass
export default class Cell extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    _value: number = null

    // 属性描述符
    set value(num: number) {
        this._value = num
        this.label.string = num + ''
        this.node.name = 'cell_'+num
        let bgColor = getCellBgColor(num)
        let valueColor = getCellValueColor(num)
        let color = new cc.Color()
        this.node.color = color.fromHEX(bgColor)
        this.label.node.color = color.fromHEX(valueColor)
    }
    get value(): number {
        return this._value
    }

    onLoad () {
        
    }

}
