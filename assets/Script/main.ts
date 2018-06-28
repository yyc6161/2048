const {ccclass, property} = cc._decorator;

import Cell from './cell'
import {adjustCells, calculateTouchOrientation, getTouchLocation, getEmptyBgCellIndex} from './utils'

@ccclass
export default class Main extends cc.Component {

    @property(cc.Prefab)
    cellPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    cellBgPrefab: cc.Prefab = null;

    @property(cc.Layout)
    bgCellLayout: cc.Layout = null;

    @property(cc.Node)
    cellLayNode: cc.Node = null;

    @property(cc.Button)
    newGameBtn: cc.Button = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    bestLabel: cc.Label = null;

    _bgCells: Array<{pos: cc.Vec2, cover: cc.Node}> = []    // 背景格子信息
    _cells: Array<cc.Node> = []    // 生成的数字块
    cellMaxNum = 16

    score = 0

    startEvent: Function
    endEvent: Function

    onLoad () {
        this.initPlayLayout()
        this.addInputEvent()

        this.newGameBtn.node.on('click', this.reset, this)
    }

    onDestroy () {
        this.cellLayNode.off(cc.Node.EventType.TOUCH_START, this.startEvent, this)
        this.cellLayNode.off(cc.Node.EventType.TOUCH_END, this.endEvent, this)
        this.newGameBtn.node.off('click', this.reset, this)
    }

    start () {
        cc.director.setDisplayStats(false)
        this.addNewCell(2)
        this.addNewCell(2)
    }

    /**
     * 初始化背景格子
     */
    initPlayLayout () {
        let cellNum = this.cellMaxNum
        while (cellNum--) {
            let node = cc.instantiate(this.cellBgPrefab)
            node.parent = this.bgCellLayout.node
        }
        this.bgCellLayout.updateLayout()

        for (let i = 0; i < this.bgCellLayout.node.children.length; i++) {
            let bgCell = this.bgCellLayout.node.children[i]
            this._bgCells.push({pos: bgCell.position, cover: null})
        }
    }

    getNewCellValue () {    
        return Math.random() > 0.68 ? 4 : 2
    }

    /**
     * 添加新的数字块
     * @param value 
     */
    addNewCell (value: number = this.getNewCellValue()) {
        console.log('添加新的数字块', value)
        // 获得新数字块位置
        let bgCellIndex = getEmptyBgCellIndex(this._bgCells) 
        if (bgCellIndex < 0) return

        // 生成新的数字块
        let cell = cc.instantiate(this.cellPrefab)
        let cellSrc = cell.getComponent(Cell)

        // 配置新数字块参数
        cellSrc.value = value
        cell.parent = this.cellLayNode
        let bgCell = this._bgCells[bgCellIndex]
        cell.position = bgCell.pos
        bgCell.cover = cell
        this._cells.push(cell)

        // 添加新节点的动画
        cell.scale = 0
        cell.runAction(cc.scaleTo(0.1, 1))
    }

    /**
     * 添加触控事件
     */
    addInputEvent () {
        let startPointVec

        let startEvent = function (event) {
            let touchLocation = getTouchLocation(this.cellLayNode, event)
            startPointVec = touchLocation
        }

        let endEvent = function (event) {
            let touchLocation = getTouchLocation(this.cellLayNode, event)
            let orientation = calculateTouchOrientation(startPointVec, touchLocation)

            adjustCells(orientation, this._cells, this._bgCells, this.updateScore.bind(this))
            this.scheduleOnce(()=>{
                this.addNewCell()
            }, 0.1)
        }.bind(this)

        this.startEvent = startEvent
        this.endEvent = endEvent

        this.cellLayNode.on(cc.Node.EventType.TOUCH_START, startEvent, this);
        this.cellLayNode.on(cc.Node.EventType.TOUCH_END, endEvent, this);
    }

    /**
     * 更新分数
     * @param newScore 新的分数
     */
    updateScore (newScore) {
        this.score += newScore
        this.scoreLabel.string = this.score.toString()
        
        let bestScore = Number(this.bestLabel.string)
        if (this.score > bestScore) this.bestLabel.string = this.score.toString()
    }

    reset () {
        this.score = 0
        this.scoreLabel.string = '0'
        this._cells.splice(0,this._cells.length)
        this.cellLayNode.destroyAllChildren()
        for (let cell of this._bgCells) {
            cell.cover = null
        }
        setTimeout(()=>{
            this.start()
        }, 1)
    }


}
