var MOVE = cc.Enum({
    LEFT: 0,
    RIGHT: 1,
    UP: 2,
    DOWN: 3
});

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

        cellLayout: {
            default: null,       
            type: cc.Layout
        },

        blockLayNode: {
            default: null,       
            type: cc.Node
        },

        _cells: [cc.Node],      // 背景格子
        _blocks: [cc.Node],     // 生成的数字块
        blockMaxNum : 16,
    },

    onLoad () {
        this.initPlayLayout()
        this._cells = this.cellLayout.node.children
        this.addTouchEvent()
    },

    start () {
        this.addNewBlock(2)
        this.addNewBlock(2)
    },

    initPlayLayout () {
        var cellNum = this.blockMaxNum
        while (cellNum--) {
            var node = cc.instantiate(this.block_bg_prefab)
            node.parent = this.cellLayout.node
            node.cover = -1
        }
        this.cellLayout.updateLayout()
    },

    getNewBlockValue () {    
        return Math.random() > 0.68 ? 4 : 2
    },

    getEmptyCellIndex () {
        var emptyCell = []
        for (let key in this._cells) {
            if (this._cells[key].cover == -1) {
                emptyCell.push(key)
            }
        }
        var emptyCellIndex = Math.floor(Math.random()*emptyCell.length)
        return emptyCell[emptyCellIndex]?emptyCell[emptyCellIndex]:-1
    },

    addNewBlock (value) {
        var createNode = (value) => {
            var node = cc.instantiate(this.block_prefab)
            node.getComponent('BlockNode').setValue(value)
            return node
        }

        var bgCellIndex = this.getEmptyCellIndex()
        if (bgCellIndex < 0) return
        var newNodeValue = value? value:this.getNewBlockValue()
        var newNode = createNode(newNodeValue)
        newNode.parent = this.blockLayNode
        var bgCell = this._cells[bgCellIndex]
        newNode.position = bgCell.position
        bgCell.cover = this._blocks.length
        this._blocks.push(newNode)

        // 添加新节点的动画
        newNode.scale = 0
        newNode.runAction(cc.scaleTo(0.1, 1))
    },

    addTouchEvent () {

        var getTouchRelativeLocation = (touchEvent)=>{
            var location = this.blockLayNode.convertTouchToNodeSpace(touchEvent);
            return location
        }

        var calculateTouchOrientation = (startPoint, endPoint)=>{ 
            var orientation
            var horizontal = endPoint.x - startPoint.x   
            var vertical = endPoint.y - startPoint.y

            if (Math.abs(horizontal) > Math.abs(vertical)) {
                if (horizontal > 0) orientation = MOVE.LEFT
                else orientation = MOVE.RIGHT
            } else {
                if (vertical > 0) orientation = MOVE.UP
                else orientation = MOVE.DOWN
            }

            return orientation
        }

        var startPointVec
        this.blockLayNode.on(cc.Node.EventType.TOUCH_START,  (event) => {
            var touchLocation = getTouchRelativeLocation(event)
            startPointVec = touchLocation
        }, this);

        this.blockLayNode.on(cc.Node.EventType.TOUCH_END, function (event) {
            var touchLocation = getTouchRelativeLocation(event)
            var orientation = calculateTouchOrientation(startPointVec, touchLocation)
            // 输入触碰方向，调试用
            for (var key in MOVE) {
                if (MOVE[key]==orientation) console.log('orientation => '+key);
            }

            this.adjustBlocksPositon(orientation)
        }, this);
    },

    adjustBlocksPositon (orientation) {
        if (this._blocks.length == 0) return

        var MaxBlockInLine = 4      // 一行最大的数字块个数
        if (orientation == MOVE.LEFT || orientation == MOVE.RIGHT) {
            var move = orientation == MOVE.LEFT? -1 : 1 // 数组遍历方向, 1 正向  2 反向
            var line = -1                               // 遍历的行数
            var emptyCellIndex = -1                     // 空节点的下标
            for (let i = move == -1?this.blockMaxNum-1:0; 0 <= i && i < this.blockMaxNum; i += move) {
                if (line != Math.floor(i / MaxBlockInLine)) {   // 换行，把空节点下标清空
                    line = Math.floor(i / MaxBlockInLine)
                    emptyCellIndex = -1
                } 
                var coverIndex = this._cells[i].cover 
                if (coverIndex < 0 && emptyCellIndex == -1) {
                    emptyCellIndex = i
                } else if (coverIndex >= 0 && emptyCellIndex >= 0) {
                    this._blocks[coverIndex].runAction(cc.moveTo(0.1, this._cells[emptyCellIndex].position))
                    this._cells[emptyCellIndex].cover = coverIndex
                    this._cells[i].cover = -1
                    emptyCellIndex += move
                }
            }
        } else if (orientation == MOVE.UP || orientation == MOVE.DOWN) {
            var move = orientation == MOVE.UP? -1 : 1   // 数组遍历方向, 1 正向  2 反向
            var emptyCellIndex = []                     // 各列对应空节点下标的数组
            for (let i = 0; i < MaxBlockInLine; i++) {
                emptyCellIndex.push(-1)
            }
            for (let i = move == -1?this.blockMaxNum-1:0; 0 <= i && i < this.blockMaxNum; i += move) {
                var column = i%MaxBlockInLine           // 遍历的列数
                var coverIndex = this._cells[i].cover 
                if (coverIndex < 0 && emptyCellIndex[column] == -1) {
                    emptyCellIndex[column] = i
                } else if (coverIndex >= 0 && emptyCellIndex[column] >= 0) {
                    this._blocks[coverIndex].runAction(cc.moveTo(0.1, this._cells[emptyCellIndex[column]].position))
                    this._cells[emptyCellIndex[column]].cover = coverIndex
                    this._cells[i].cover = -1
                    emptyCellIndex[column] += move * MaxBlockInLine
                }
            }
        }
        this.addNewBlock()
    }

});