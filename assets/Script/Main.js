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

        newGameBtn: {
            default: null,       
            type: cc.Button
        },

        scoreLabel: {
            default: null,       
            type: cc.Label
        },
        bestLabel: {
            default: null,       
            type: cc.Label
        },

        _cells: [cc.Node],      // 背景格子
        _blocks: [cc.Node],     // 生成的数字块
        blockMaxNum : 16,
    },

    onLoad () {
        this.initPlayLayout()
        this._cells = this.cellLayout.node.children
        this.addTouchEvent()
        this.score = 0

        this.newGameBtn.node.on('click', function(){ this.reset()}, this)
    },

    start () {
        cc.director.setDisplayStats(false)
        this.addNewBlock(2)
        this.addNewBlock(2)
    },

    initPlayLayout () {
        var cellNum = this.blockMaxNum
        while (cellNum--) {
            var node = cc.instantiate(this.block_bg_prefab)
            node.parent = this.cellLayout.node
            node.cover = null
        }
        this.cellLayout.updateLayout()
    },

    getNewBlockValue () {    
        return Math.random() > 0.68 ? 4 : 2
    },

    getEmptyCellIndex () {
        var emptyCell = []
        for (let key in this._cells) {
            if (this._cells[key].cover == null) {
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
        bgCell.cover = newNode
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
            var lastCellHasBlock = null                 // 上个检测到的数字块的值
            for (let i = move == -1?this.blockMaxNum-1:0; 0 <= i && i < this.blockMaxNum; i += move) {
                if (line != Math.floor(i / MaxBlockInLine)) {   // 换行，把空节点下标清空
                    line = Math.floor(i / MaxBlockInLine)
                    emptyCellIndex = -1
                    lastCellHasBlock = -1
                } 
                var coverNode = this._cells[i].cover 
                if (coverNode == null && emptyCellIndex == -1) {
                    emptyCellIndex = i
                } else if (coverNode != null) {
                    if (lastCellHasBlock != -1 && this._cells[lastCellHasBlock].cover.value == coverNode.value) {   // 可以合并相同数字
                        var lastBlock = this._cells[lastCellHasBlock].cover
                        coverNode.runAction(cc.sequence(
                            cc.moveTo(0.1, this._cells[lastCellHasBlock].position),
                            cc.callFunc((data)=>{
                                this.mergeTwoBlock(lastBlock, data)
                            },this,coverNode)
                        ))
                        this._cells[i].cover = null
                        if (emptyCellIndex == -1) emptyCellIndex = i    //   如果前面没有空块，那么空块就是当前被合并的数字块
                        lastCellHasBlock = -1
                    } else if (emptyCellIndex >= 0) {   // 把当前数字块移到空位
                        lastCellHasBlock = emptyCellIndex
                        coverNode.runAction(cc.moveTo(0.1, this._cells[emptyCellIndex].position))
                        this._cells[emptyCellIndex].cover = coverNode
                        this._cells[i].cover = null
                        emptyCellIndex += move
                    } else {
                        lastCellHasBlock = i
                    }
                }
            }
        } else if (orientation == MOVE.UP || orientation == MOVE.DOWN) {
            var move = orientation == MOVE.UP? -1 : 1   // 数组遍历方向, 1 正向  2 反向
            var emptyCellIndex = []                     // 各列对应空节点下标的数组
            var lastCellHasBlock = []                 // 上个检测到的数字块的值
            for (let i = 0; i < MaxBlockInLine; i++) {
                emptyCellIndex.push(-1)
                lastCellHasBlock.push(-1)
            }
            for (let i = move == -1?this.blockMaxNum-1:0; 0 <= i && i < this.blockMaxNum; i += move) {
                var column = i%MaxBlockInLine           // 遍历的列数
                var coverNode = this._cells[i].cover 
                if (coverNode == null && emptyCellIndex[column] == -1) {
                    emptyCellIndex[column] = i
                } else if (coverNode != null) {
                    if (lastCellHasBlock[column] != -1 && this._cells[lastCellHasBlock[column]].cover.value == coverNode.value) {   // 可以同类合并
                        var lastBlock = this._cells[lastCellHasBlock[column]].cover
                        coverNode.runAction(cc.sequence(
                            cc.moveTo(0.1, this._cells[lastCellHasBlock[column]].position),
                            cc.callFunc((data)=>{
                                this.mergeTwoBlock(lastBlock, data)
                            },this,coverNode)
                        ))
                        this._cells[i].cover = null
                        if (emptyCellIndex[column] == -1) emptyCellIndex[column] = i    //   如果前面没有空块，那么空块就是当前被合并的数字块
                        lastCellHasBlock[column] = -1
                    } else if (emptyCellIndex[column] >= 0) {       // 可以移到下一空块
                        lastCellHasBlock[column] = emptyCellIndex[column]
                        coverNode.runAction(cc.moveTo(0.1, this._cells[emptyCellIndex[column]].position))
                        this._cells[emptyCellIndex[column]].cover = coverNode
                        this._cells[i].cover = null
                        emptyCellIndex[column] += move * MaxBlockInLine
                    } else {
                        lastCellHasBlock[column] = i
                    }
                }
            }
        }
        this.addNewBlock()
    },

    mergeTwoBlock (remindBlock, abondonBlock) {
        if (remindBlock == null || abondonBlock == null) return
        var abondon = abondonBlock
        for (let key in this._blocks) {
            if (this._blocks[key] == abondonBlock) this._blocks.splice(key, 1)
        }
        abondon.destroy()
        var newValue = remindBlock.value * 2
        remindBlock.getComponent('BlockNode').setValue(newValue)
        this.updateScore(newValue)
    },

    updateScore (newScore) {
        this.score += newScore
        this.scoreLabel.string = this.score
        
        var bestScore = Number(this.bestLabel.string)
        if (this.score > bestScore) this.bestLabel.string = this.score
    },

    reset () {
        this.score = 0
        this.scoreLabel.string = 0
        this._blocks.splice(0,this._blocks.length)
        this.blockLayNode.destroyAllChildren()
        for (let cell of this._cells) {
            cell.cover = null
        }
        setTimeout(()=>{
            this.start()
        }, 1)
    }

});