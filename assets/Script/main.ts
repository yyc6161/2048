const {ccclass, property} = cc._decorator;

import Cell from './cell'
import {MOVE, adjustCells} from './utils'

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

    _bgCells: Array<{pos: cc.Vec2, cover: cc.Node}> = []     // 背景格子
    _cells: Array<cc.Node> = []    // 生成的数字块
    cellMaxNum = 16

    score = 0

    onLoad () {
        this.initPlayLayout()
        for (let i = 0; i < this.bgCellLayout.node.children.length; i++) {
            let bgCell = this.bgCellLayout.node.children[i]
            this._bgCells.push({pos: bgCell.position, cover: null})
        }
        this.addTouchEvent()

        this.newGameBtn.node.on('click', function(){ this.reset() }, this)
    }

    start () {
        cc.director.setDisplayStats(false)
        this.addNewCell(2)
        this.addNewCell(2)
    }

    initPlayLayout () {
        let cellNum = this.cellMaxNum
        while (cellNum--) {
            let node = cc.instantiate(this.cellBgPrefab)
            node.parent = this.bgCellLayout.node
        }
        this.bgCellLayout.updateLayout()
    }

    getNewBlockValue () {    
        return Math.random() > 0.68 ? 4 : 2
    }

    getEmptyCellIndex () {
        let emptyCell = []
        for (let key in this._bgCells) {
            if (this._bgCells[key].cover == null) {
                emptyCell.push(key)
            }
        }
        let emptyCellIndex = Math.floor(Math.random()*emptyCell.length)
        return emptyCell[emptyCellIndex]? emptyCell[emptyCellIndex]: -1
    }

    /**
     * 添加新的数字块
     * @param value 
     */
    addNewCell (value: number = this.getNewBlockValue()) {
        console.log('添加新的数字块', value)
        // 获得新数字块位置
        let bgCellIndex = this.getEmptyCellIndex() 
        if (bgCellIndex < 0) return

        // 生成新的数字块
        let cell = cc.instantiate(this.cellPrefab)
        let cellSrc = cell.getComponent(Cell)

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

    addTouchEvent () {

        let getTouchRelativeLocation = (touchEvent)=>{
            let location = this.cellLayNode.convertTouchToNodeSpace(touchEvent);
            return location
        }

        let calculateTouchOrientation = (startPoint, endPoint)=>{ 
            let orientation
            let horizontal = endPoint.x - startPoint.x   
            let vertical = endPoint.y - startPoint.y

            if (Math.abs(horizontal) > Math.abs(vertical)) {
                if (horizontal > 0) orientation = MOVE.LEFT
                else orientation = MOVE.RIGHT
            } else {
                if (vertical > 0) orientation = MOVE.UP
                else orientation = MOVE.DOWN
            }

            return orientation
        }

        let startPointVec
        this.cellLayNode.on(cc.Node.EventType.TOUCH_START,  (event) => {
            let touchLocation = getTouchRelativeLocation(event)
            startPointVec = touchLocation
        }, this);

        this.cellLayNode.on(cc.Node.EventType.TOUCH_END, function (event) {
            let touchLocation = getTouchRelativeLocation(event)
            let orientation = calculateTouchOrientation(startPointVec, touchLocation)

            adjustCells(orientation, this)
            this.addNewCell()
        }, this);
    }

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
