const {ccclass, property} = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    @property(cc.Prefab)
    blockPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    blockBgPrefab: cc.Prefab = null;

    @property(cc.Layout)
    cellLayout: cc.Layout = null;

    @property(cc.Node)
    blockLayNode: cc.Label = null;

    @property(cc.Button)
    newGameBtn: cc.Button = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    bestLabel: cc.Label = null;

    _cells: [cc.Node] = null     // 背景格子
    _blocks: [cc.Node] = null    // 生成的数字块
    blockMaxNum : number = null

    onLoad () {
        this.initPlayLayout()
        this._cells = this.cellLayout.node.children
        this.addTouchEvent()
        this.score = 0

        this.newGameBtn.node.on('click', function(){ this.reset()}, this)
    }

    start () {
        cc.director.setDisplayStats(false)
        this.addNewBlock(2)
        this.addNewBlock(2)
    }

    initPlayLayout () {
        let cellNum = this.blockMaxNum
        while (cellNum--) {
            let node = cc.instantiate(this.block_bg_prefab)
            node.parent = this.cellLayout.node
            node.cover = null
        }
        this.cellLayout.updateLayout()
    }

    getNewBlockValue () {    
        return Math.random() > 0.68 ? 4 : 2
    }

    getEmptyCellIndex () {
        let emptyCell = []
        for (let key in this._cells) {
            if (this._cells[key].cover == null) {
                emptyCell.push(key)
            }
        }
        let emptyCellIndex = Math.floor(Math.random()*emptyCell.length)
        return emptyCell[emptyCellIndex]?emptyCell[emptyCellIndex]:-1
    }

    addNewBlock (value) {
        let createNode = (value) => {
            let node = cc.instantiate(this.block_prefab)
            node.getComponent('BlockNode').setValue(value)
            return node
        }

        let bgCellIndex = this.getEmptyCellIndex()
        if (bgCellIndex < 0) return
        let newNodeValue = value? value:this.getNewBlockValue()
        let newNode = createNode(newNodeValue)
        newNode.parent = this.blockLayNode
        let bgCell = this._cells[bgCellIndex]
        newNode.position = bgCell.position
        bgCell.cover = newNode
        this._blocks.push(newNode)

        // 添加新节点的动画
        newNode.scale = 0
        newNode.runAction(cc.scaleTo(0.1, 1))
    }

    addTouchEvent () {

        let getTouchRelativeLocation = (touchEvent)=>{
            let location = this.blockLayNode.convertTouchToNodeSpace(touchEvent);
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
        this.blockLayNode.on(cc.Node.EventType.TOUCH_START,  (event) => {
            let touchLocation = getTouchRelativeLocation(event)
            startPointVec = touchLocation
        }, this);

        this.blockLayNode.on(cc.Node.EventType.TOUCH_END, function (event) {
            let touchLocation = getTouchRelativeLocation(event)
            let orientation = calculateTouchOrientation(startPointVec, touchLocation)

            this.adjustBlocksPositon(orientation)
        }, this);
    }

    adjustBlocksPositon (orientation) {
        if (this._blocks.length == 0) return

        let MaxBlockInLine = 4      // 一行最大的数字块个数
        if (orientation == MOVE.LEFT || orientation == MOVE.RIGHT) {
            let move = orientation == MOVE.LEFT? -1 : 1 // 数组遍历方向, 1 正向  2 反向
            let line = -1                               // 遍历的行数
            let emptyCellIndex = -1                     // 空节点的下标
            let lastCellHasBlock = null                 // 上个检测到的数字块的值
            for (let i = move == -1?this.blockMaxNum-1:0; 0 <= i && i < this.blockMaxNum; i += move) {
                if (line != Math.floor(i / MaxBlockInLine)) {   // 换行，把空节点下标清空
                    line = Math.floor(i / MaxBlockInLine)
                    emptyCellIndex = -1
                    lastCellHasBlock = -1
                } 
                let coverNode = this._cells[i].cover 
                if (coverNode == null && emptyCellIndex == -1) {
                    emptyCellIndex = i
                } else if (coverNode != null) {
                    if (lastCellHasBlock != -1 && this._cells[lastCellHasBlock].cover.value == coverNode.value) {   // 可以合并相同数字
                        let lastBlock = this._cells[lastCellHasBlock].cover
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
            let move = orientation == MOVE.UP? -1 : 1   // 数组遍历方向, 1 正向  2 反向
            let emptyCellIndex = []                     // 各列对应空节点下标的数组
            let lastCellHasBlock = []                 // 上个检测到的数字块的值
            for (let i = 0; i < MaxBlockInLine; i++) {
                emptyCellIndex.push(-1)
                lastCellHasBlock.push(-1)
            }
            for (let i = move == -1?this.blockMaxNum-1:0; 0 <= i && i < this.blockMaxNum; i += move) {
                let column = i%MaxBlockInLine           // 遍历的列数
                let coverNode = this._cells[i].cover 
                if (coverNode == null && emptyCellIndex[column] == -1) {
                    emptyCellIndex[column] = i
                } else if (coverNode != null) {
                    if (lastCellHasBlock[column] != -1 && this._cells[lastCellHasBlock[column]].cover.value == coverNode.value) {   // 可以同类合并
                        let lastBlock = this._cells[lastCellHasBlock[column]].cover
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
    }

    mergeTwoBlock (remindBlock, abondonBlock) {
        if (remindBlock == null || abondonBlock == null) return
        let abondon = abondonBlock
        for (let key in this._blocks) {
            if (this._blocks[key] == abondonBlock) this._blocks.splice(key, 1)
        }
        abondon.destroy()
        let newValue = remindBlock.value * 2
        remindBlock.getComponent('BlockNode').setValue(newValue)
        this.updateScore(newValue)
    }

    updateScore (newScore) {
        this.score += newScore
        this.scoreLabel.string = this.score
        
        let bestScore = Number(this.bestLabel.string)
        if (this.score > bestScore) this.bestLabel.string = this.score
    }

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


}
