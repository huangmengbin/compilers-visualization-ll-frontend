/* eslint-disable @typescript-eslint/no-explicit-any */

import { hmb } from "../gen/proto";
import { message } from "ant-design-vue";
import { input } from "../router";
import proto = hmb.protobuf;

const globalConstOption = {
  title: {
    text: "",
    textStyle: {
      color: "rgb(0,0,255)",
      fontSize: 15
    }
  },
  tooltip: {},
  animationDurationUpdate: 1,
  animationEasingUpdate: "quinticInOut",
  series: [
    {
      type: "graph",
      layout: "force",
      symbolSize: 13,
      animation: false,
      draggable: true,
      roam: true,
      label: {
        show: true
      },
      edgeSymbol: ["circle", "arrow"],
      edgeSymbolSize: [3, 4],
      edgeLabel: {
        fontSize: 8,
        color: "rgb(0, 0, 0, 0.9)"
      },
      tooltip: {},
      data: [],
      links: [],
      lineStyle: {
        opacity: 0.9,
        width: 2
      },
      autoCurveness: true,
      force: {
        repulsion: 2000,
        edgeLength: [50, 100],
        layoutAnimation: false,
        // friction: 1,
        gravity: 0.4
      }
    }
  ]
};

let sleepTime_ = 200;

let treeOption_ = {
  tooltip: {
    trigger: "item",
    triggerOn: "mousemove"
  },
  series: [
    {
      type: "tree",
      data: [
        {
          name: "program",
          children: [],
          itemStyle: {
            color: "rgb(254,254,254)"
          }
        }
      ],
      left: "2%",
      right: "2%",
      top: "12%",
      bottom: "12%",
      symbol: "emptyCircle",
      orient: "vertical",
      expandAndCollapse: true,
      initialTreeDepth: -1,
      label: {
        position: "top",
        rotate: -90,
        verticalAlign: "middle",
        align: "right",
        fontSize: 9
      },
      leaves: {
        label: {
          position: "bottom",
          rotate: -90,
          verticalAlign: "middle",
          align: "left"
        }
      },
      animationDurationUpdate: sleepTime_
    }
  ]
};

export function getTreeOption(): any {
  return treeOption_;
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function listenTreeOption(list: any): void {
  treeOption_ = list;
  console.log(treeOption_);
}

function setTreeData(root: proto.ITreeNode): void {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  treeOption_.series[0].data = [root];
}

let _MainResponseByteBuffer_ = new Uint8Array();
let succeed_ = false;
let initState_: proto.IInitialState;
let globalOptionList_: any[] = [];

let operatorIndex_ = 0;
let operationList_: proto.IOperationWrapper[] = [];

let currentTokenIndex_ = 0;
let tryPredictTokenIndex_ = 0;
let tokenList_: proto.ITokenMsg[] = [];

export function getOperatorIndex(): number {
  return operatorIndex_;
}

function setOptionList_(list: proto.ISubAugmentedTransitionNetwork[]) {
  globalOptionList_ = []; //必须要清空，否则会元素重复
  for (const subATNElement of list) {
    const option = JSON.parse(JSON.stringify(globalConstOption));
    option.title.text = subATNElement.ruleName;
    option.series[0].data = subATNElement.graphNode;
    option.series[0].links = subATNElement.graphEdge;
    option.series[0].links.forEach(
      (link: any) => (link.label.formatter = (v: any) => v.data.name)
    );
    option.tooltip.formatter = (v: any) => {
      const data = v.data;
      if (data.source === undefined || data.target == undefined) {
        return data.name;
      } else {
        return "" + data.source + " — " + data.name + " → " + data.target;
      }
    };
    globalOptionList_.push(option);
  }
}

export default function setMainResponse(resp: proto.MainResponse): boolean {
  if (succeed_) {
    console.log("re init");
  }
  _MainResponseByteBuffer_ = Uint8Array.from(
    proto.MainResponse.encode(resp).finish()
  );
  if (!init_(resp)) {
    return false;
  }
  succeed_ = true;
  return true;
}

function init_(resp: proto.MainResponse): boolean {
  if (!resp.initialState) {
    console.log("resp.initialState = " + resp.initialState);
    return false;
  }
  initState_ = resp.initialState;
  if (!resp.initialState.parserATN.subATN) {
    console.log("parserATN = " + resp.initialState.parserATN.subATN);
    return false;
  }
  setOptionList_(resp.initialState.parserATN.subATN);
  {
    operatorIndex_ = 0;
    operationList_ = resp.operation;
  }
  {
    setTokenList(resp.token);
  }
  {
    treeOption_.series[0].data = [];
  }
  return true;
}

export function reload(): void {
  const resp: proto.MainResponse = proto.MainResponse.decode(
    _MainResponseByteBuffer_
  );
  if (!init_(resp)) {
    message.error("reload failed").then();
  }
}

export function loaded(): boolean {
  return succeed_;
}

function check(): void {
  if (!succeed_) {
    message.error("unloaded!").then();
    input().then(() => {
      throw "";
    });
  }
}

export function getInitState(): proto.IInitialState {
  return initState_;
}

export function getOptionsList(): any[] {
  check();
  return globalOptionList_;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const colorList = [
  "rgb(0,0,255)",
  "rgb(0,255,0)",
  "rgb(255,0,0)",
  "rgb(0,255,255)",
  "rgb(255,255,0)",
  "rgb(255,0,255)"
];

export function listenOptionList(optionList: any[]): void {
  globalOptionList_ = optionList;
  resetDefaultColors();
}

// eslint-disable-next-line
let nextButtonStringOnChanged = (next: string) => {};
export function setNextButtonStringOnChanged(func: (s: string) => void): void {
  nextButtonStringOnChanged = func;
  changeNextButtonString();
}
function changeNextButtonString(): void {
  if (operatorIndex_ < operationList_.length) {
    nextButtonStringOnChanged(
      getNextOperationString(operationList_[operatorIndex_])
    );
  } else {
    nextButtonStringOnChanged("");
  }
}
function getNextOperationString(operation: proto.IOperationWrapper): string {
  switch (operation.operationType) {
    case proto.OperationType.StartStateClosure:
      if (operation.startStateClosureOperation) {
        return "开始计算闭包";
      }
      break;
    case proto.OperationType.AddNewDFAState:
      if (operation.addNewDFAStateOperation) {
        return (
          "添加DFA新状态 " +
          operation.addNewDFAStateOperation.newDfaState.dfaStateNumber
        );
      }
      break;
    case proto.OperationType.AddNewEdge:
      if (operation.addNewEdgeOperation) {
        return (
          "添加DFA状态边 " +
          operation.addNewEdgeOperation.newEdge.from.dfaStateNumber +
          " — " +
          operation.addNewEdgeOperation.newEdge.upon +
          " → " +
          operation.addNewEdgeOperation.newEdge.to.dfaStateNumber
        );
      }
      break;
    case proto.OperationType.ReuseState:
      if (operation.reuseStateOperation) {
        return (
          "命中DFA缓存 " +
          operation.reuseStateOperation.reuse.from.dfaStateNumber +
          " — " +
          operation.reuseStateOperation.reuse.upon +
          " → " +
          operation.reuseStateOperation.reuse.to.dfaStateNumber
        );
      }
      break;
    case proto.OperationType.SwitchTable:
      if (operation.switchTableOperation) {
        return "SwitchTable";
      }
      break;
    case proto.OperationType.ConsumeToken:
      if (operation.consumeTokenOperation) {
        return (
          "消耗当前token " +
          operation.consumeTokenOperation.tokenConsumed.tokenText
        );
      }
      break;
    case proto.OperationType.EditTree:
      if (operation.editTreeOperation) {
        return operation.editTreeOperation.type;
      }
      break;
    case proto.OperationType.EndAdaptive:
      if (operation.endAdaptiveOperation) {
        return (
          "成功自适应预测，选择第" +
          operation.endAdaptiveOperation.alt +
          "个分支"
        );
      }
      break;
    default:
      return "Unknown Type " + operation.operationType;
  }
  return "Error " + operation.operationType;
}

export function getTokenList(): proto.ITokenMsg[] {
  check();
  return tokenList_;
}

function resetTokenColor(): void {
  tokenList_.forEach(token => (token.background = "rgb(255, 255, 255)"));
  for (let i = 0; i < currentTokenIndex_; i++) {
    tokenList_[i].background = visitedTokenColor;
  }
  if (currentTokenIndex_ < tokenList_.length) {
    tokenList_[currentTokenIndex_].background = currentIndexTokenColor;
  }
  for (let i = currentTokenIndex_; i < tryPredictTokenIndex_; i++) {
    tokenList_[i].background = tryAdaptivePredictColor;
  }
}

function setTokenList(list: proto.ITokenMsg[]): void {
  tokenList_ = list;
  currentTokenIndex_ = 0;
  tryPredictTokenIndex_ = 0;
  resetTokenColor();
}

export function listenTokenList(list: proto.ITokenMsg[]): void {
  setTokenList(list);
}

function nextToken(): void {
  currentTokenIndex_++;
}

function adaptivePredict(): void {
  tryPredictTokenIndex_++;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
export function debug(num: number): void {
  reload();
}

export async function playbackAllOperations(times: number): Promise<void> {
  const sleepTime = sleepTime_;
  const animationDurationUpdate = treeOption_.series[0].animationDurationUpdate;
  {
    sleepTime_ = 0;
    treeOption_.series[0].animationDurationUpdate = 1; // 严禁为0，原因不明
  }
  for (let i = 0; i < times; i++) {
    await nextOperation();
  }
  {
    sleepTime_ = sleepTime;
    treeOption_.series[0].animationDurationUpdate = animationDurationUpdate;
  }
}

export async function nextOperation(): Promise<void> {
  if (operatorIndex_ >= operationList_.length) {
    message.success("finished").then();
  } else {
    const operation = operationList_[operatorIndex_];
    operatorIndex_++;
    changeNextButtonString();
    switch (operation.operationType) {
      case proto.OperationType.StartStateClosure:
        if (operation.startStateClosureOperation) {
          handleStartStates(operation.startStateClosureOperation);
          return;
        }
        break;
      case proto.OperationType.AddNewDFAState:
        if (operation.addNewDFAStateOperation) {
          handleAddNewDFAState(operation.addNewDFAStateOperation);
          return;
        }
        break;
      case proto.OperationType.AddNewEdge:
        if (operation.addNewEdgeOperation) {
          await handleAddNewEdge(operation.addNewEdgeOperation);
          return;
        }
        break;
      case proto.OperationType.ReuseState:
        if (operation.reuseStateOperation) {
          await handleReuseState(operation.reuseStateOperation);
          return;
        }
        break;
      case proto.OperationType.SwitchTable:
        if (operation.switchTableOperation) {
          handleSwitchTable(operation.switchTableOperation);
          return;
        }
        break;
      case proto.OperationType.ConsumeToken:
        if (operation.consumeTokenOperation) {
          handleConsumeToken(operation.consumeTokenOperation);
          return;
        }
        break;
      case proto.OperationType.EditTree:
        if (operation.editTreeOperation) {
          handleEditTree(operation.editTreeOperation);
          return;
        }
        break;
      case proto.OperationType.EndAdaptive:
        if (operation.endAdaptiveOperation) {
          handleEndAdaptive(operation.endAdaptiveOperation);
          return;
        }
        break;
      default:
        message.error("unknown type " + operation.operationType).then();
    }
    message.error("empty operation").then();
  }
}

const defaultColor = "rgb(0,0,192)";
const startStatesColor = "rgb(128, 128, 255)";
const addNewDFAStateColor = "rgb(0, 255, 255)";
const addNewEdgeFromColor = "rgb(255, 0, 0)";
const addNewEdgeToColor = "rgb(64, 0, 0)";
const reuseFromColor = "rgb(168, 255, 0)";
const reuseToColor = "rgb(255, 168, 0)";

const currentIndexTokenColor = "rgb(0, 128, 255)";
const visitedTokenColor = "rgb(192, 192, 192)";
const tryAdaptivePredictColor = "rgb(0, 255, 255)";

function resetDefaultColors() {
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      data.itemStyle.color = defaultColor;
    }
  }
}

function handleStartStates(operation: proto.IStartStateClosureOperation): void {
  console.log(operation);
  resetDefaultColors();
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      if (operation.startingClosure.atnState) {
        for (const n of operation.startingClosure.atnState) {
          if (parseInt(data.id) === n.atnStateNumber) {
            data.itemStyle.color = startStatesColor;
            break;
          }
        } // end-for
      }
    }
  }
}
function handleAddNewDFAState(operation: proto.IAddNewDFAStateOperation): void {
  console.log(operation);
  resetDefaultColors();
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      if (operation.newDfaState.atnState) {
        for (const n of operation.newDfaState.atnState) {
          if (parseInt(data.id) === n.atnStateNumber) {
            data.itemStyle.color = addNewDFAStateColor;
            break;
          }
        } // end-for
      }
    }
  }
}

async function handleAddNewEdge(
  operation: proto.IAddNewEdgeOperation
): Promise<void> {
  console.log(operation);
  resetDefaultColors();
  adaptivePredict();
  resetTokenColor();
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      if (operation.newEdge.from.atnState) {
        for (const n of operation.newEdge.from.atnState) {
          if (parseInt(data.id) === n.atnStateNumber) {
            data.itemStyle.color = addNewEdgeFromColor;
            break;
          }
        } // end-for
      }
    }
  }
  await sleep(sleepTime_);
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      if (operation.newEdge.to.atnState) {
        for (const n of operation.newEdge.to.atnState) {
          if (parseInt(data.id) === n.atnStateNumber) {
            data.itemStyle.color = addNewEdgeToColor;
            break;
          }
        } // end-for
      }
    }
  }
}

async function handleReuseState(
  operation: proto.IReuseStateOperation
): Promise<void> {
  resetDefaultColors();
  adaptivePredict();
  resetTokenColor();
  console.log(operation);
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      if (operation.reuse.from.atnState) {
        for (const n of operation.reuse.from.atnState) {
          if (parseInt(data.id) === n.atnStateNumber) {
            data.itemStyle.color = reuseFromColor;
            break;
          }
        } // end-for
      }
    }
  }
  await sleep(sleepTime_);
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      if (operation.reuse.to.atnState) {
        for (const n of operation.reuse.to.atnState) {
          if (parseInt(data.id) === n.atnStateNumber) {
            data.itemStyle.color = reuseToColor;
            break;
          }
        } // end-for
      }
    }
  }
}

function handleSwitchTable(operation: proto.ISwitchTableOperation): void {
  console.log(operation);
}

function handleConsumeToken(operation: proto.IConsumeTokenOperation): void {
  console.log(operation);
  nextToken();
  tryPredictTokenIndex_ = currentTokenIndex_;
  resetTokenColor();
  setTreeData(operation.parserState.root);
}

function handleEditTree(operation: proto.IEditTreeOperation): void {
  console.log(operation);
  console.log(treeOption_.series[0].data);
  setTreeData(operation.parserState.root);
}

function handleEndAdaptive(operation: proto.IEndAdaptiveOperation): void {
  console.log(operation);
  tryPredictTokenIndex_ = currentTokenIndex_;
  resetTokenColor();
}
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
