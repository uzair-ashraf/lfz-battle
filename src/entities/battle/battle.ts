import { Delay, Task, TaskQueue } from '../../helpers'
import { Observer } from '../'
import { battleData } from '../../data'
import { BattleComponents, BattleData, Levels, Question, QuestionData } from '../../interfaces'
import {
  Arena,
  BackDrop,
  EnemyFighter,
  EnemyUI,
  PlayerFighter,
  PlayerUI,
  HP
} from '.'

export class Battle extends Observer {
  private _acceptedTasks: Set<string>
  private _taskQueue: TaskQueue
  private _currentLevel: keyof Levels
  private _currentQuestions: Question[]
  private _currentQuestion: Question
  private _currentLevelQuestionData: {
    [key: string]: QuestionData
  }
  private _selectedQuestionData: QuestionData
  private _battleData: BattleData
  private _battleComponents: BattleComponents
  constructor(taskQueue: TaskQueue, currentLevel: keyof Levels) {
    super()
    this._acceptedTasks = new Set(['scene-transition-start','battle-start', 'battle'])
    this._currentLevel = currentLevel
    this._taskQueue = taskQueue
    this._battleData = battleData
    this._currentLevelQuestionData = battleData[currentLevel]
    this._currentQuestions = null
    this._selectedQuestionData = null
    this.handlePlayerDeath = this.handlePlayerDeath.bind(this)
    this.handleEnemyDeath = this.handleEnemyDeath.bind(this)
    this._battleComponents = {
      arena: new Arena(),
      backdrop: new BackDrop(),
      enemyFighter: new EnemyFighter(false),
      enemyUI: new EnemyUI(false),
      playerFighter: new PlayerFighter(true),
      playerUI: new PlayerUI(true),
      playerHP: new HP(true, this.handlePlayerDeath),
      enemyHP: new HP(false, this.handleEnemyDeath)
    }
  }
  handleUpdate({ name, action }: Task): void {
    if (!this._acceptedTasks.has(name)) return
    switch (name) {
      case 'battle-start':
        this.handleBattleStart(action)
        break
      case 'scene-transition-start':
        this.handleSceneTransitionStart(action)
        break;
      case 'battle':
        this.handleBattle(action)
        break;
    }
  }
  async handleBattle(action: any): Promise<void> {
    if(!action) {
      this._taskQueue.addTask(
        new Task('disable-input')
      )
      const { playerUI, enemyUI, playerHP, enemyHP } = this._battleComponents
      const isCorrect = playerUI.selectedAnswer === this._currentQuestion.correct
      this._currentQuestion = this._currentQuestions.shift()

      isCorrect
      ? playerUI.setCorrect()
      : playerUI.setWrong()
      await Delay.delay(500)

      isCorrect
      ? enemyHP.damage()
      : playerHP.damage()
      await Delay.delay(500)

      playerUI.hide()
      await Delay.delay(500)
      playerUI.resetSelection()
      playerUI.setAnswers(this._currentQuestion.answers)
      await enemyUI.writeText(this._currentQuestion.question)
      await Delay.delay(500)
      playerUI.show()
      this._taskQueue.addTask(
        new Task(
          'enable-input'
        )
      )
    } else {
      this._battleComponents.playerUI[action]()
    }
  }
  handleSceneTransitionStart({ level }: any): void {
    this._currentLevel = level
    this._currentLevelQuestionData = battleData[level]
  }
  async handleBattleStart({ fighter }: any): Promise<void> {
    if (!this._currentLevelQuestionData) throw new Error('Missing questions for this map.')
    this._selectedQuestionData = this._currentLevelQuestionData[fighter]
    if (!this._selectedQuestionData) throw new Error('Missing questions for this fighter.')
    this._currentQuestions = [...this._selectedQuestionData.questions]
    this.shuffleQuestions()
    this._currentQuestion = this._currentQuestions.shift()
    const  {
      arena,
      backdrop,
      enemyFighter,
      enemyUI,
      playerFighter,
      playerUI,
      playerHP,
      enemyHP
    } = this._battleComponents
    const {
      arena: background,
      name,
      damageToEnemy,
      damageToPlayer,
      title,
      openingMessage,
    } = this._selectedQuestionData
    arena.set(background)
    enemyFighter.set(name)
    enemyHP.setDamageCounter(damageToEnemy)
    playerHP.setDamageCounter(damageToPlayer)
    playerUI.setAnswers(this._currentQuestion.answers)
    backdrop.show()
    await Delay.delay(500)
    arena.show()
    await Delay.delay(500)
    playerFighter.show()
    enemyFighter.show()
    await Delay.delay(500)
    enemyUI.show()
    await Delay.delay(500)
    await enemyUI.writeText(`${title} ${name} challenges you to a battle!`)
    await Delay.delay(500)
    playerHP.show()
    enemyHP.show()
    await Delay.delay(500)
    await enemyUI.writeText(openingMessage)
    await Delay.delay(1000)
    await enemyUI.writeText(this._currentQuestion.question)
    await Delay.delay(500)
    playerUI.show()
    this._taskQueue.addTask(
      new Task(
        'battle-navigate-answer',
        null
      )
    )
  }
  handlePlayerDeath(): void { }
  handleEnemyDeath(): void {}
  shuffleQuestions(): void {
    for(let i = 0; i < this._currentQuestions.length; i++) {
      const randomNum = Math.floor(Math.random() * this._currentQuestions.length)
      const placeHolder = this._currentQuestions[i]
      this._currentQuestions[i] = this._currentQuestions[randomNum]
      this._currentQuestions[randomNum] = placeHolder
    }
  }
  // writeText() {
  //   this.content = ''
  //   this._writingIntervalId = window.setInterval(() => {
  //     if (!this._currentWritingText.length) {
  //       clearInterval(this._writingIntervalId)
  //       return
  //     }
  //     const letter = this._currentWritingText.shift()
  //     this.content = this.content + letter
  //   }, 50)
  // }
  loadPlayerUI(): void {
    throw new Error('Method not implemented.')
  }
  beginQuestion(): void {
    throw new Error('Method not implemented.')
  }
  loadHealthBars(): void {
    throw new Error('Method not implemented.')
  }
  showOpeningMessage(): void {
    throw new Error('Method not implemented.')
  }
  showStartingMessage(): void {
    throw new Error('Method not implemented.')
  }
  loadEnemyUI(): void {
    throw new Error('Method not implemented.')
  }
  loadInCharacters(): void {
    throw new Error('Method not implemented.')
  }
  setupBattleBackground(): void {
    throw new Error('Method not implemented.')
  }
  setupBackdrop(): void {
    throw new Error('Method not implemented.')
  }
}