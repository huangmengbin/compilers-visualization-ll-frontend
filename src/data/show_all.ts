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

let succeed_ = false;
let initState_: proto.IInitialState;
let globalOptionList_: any[] = [];

let operatorIndex_ = 0;
let operationList_: proto.IOperationWrapper[] = [];

function _setOptionList(list: proto.ISubAugmentedTransitionNetwork[]) {
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
        return "" + data.source + " - " + data.name + " → " + data.target;
      }
    };
    globalOptionList_.push(option);
  }
}

export default function setMainResponse(resp: proto.MainResponse): boolean {
  if (succeed_) {
    console.log("re init");
  }
  if (!resp.initialState) {
    console.log("resp.initialState = " + resp.initialState);
    return false;
  }
  initState_ = resp.initialState;
  if (!resp.initialState.parserATN.subATN) {
    console.log("parserATN = " + resp.initialState.parserATN.subATN);
    return false;
  }
  _setOptionList(resp.initialState.parserATN.subATN);
  {
    operatorIndex_ = 0;
    operationList_ = resp.operation;
  }

  succeed_ = true;
  return true;
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

// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
export function debug(num: number): void {}

export function nextOperation(): void {
  if (operatorIndex_ >= operationList_.length) {
    message.success("finished").then();
  } else {
    resetDefaultColors();
    const operation = operationList_[operatorIndex_];
    operatorIndex_++;
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
          handleAddNewEdge(operation.addNewEdgeOperation);
          return;
        }
        break;
      case proto.OperationType.ReuseState:
        if (operation.reuseStateOperation) {
          handleReuseState(operation.reuseStateOperation);
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

function resetDefaultColors() {
  for (const op of globalOptionList_) {
    for (const data of op.series[0].data) {
      data.itemStyle.color = defaultColor;
    }
  }
}

function handleStartStates(operation: proto.IStartStateClosureOperation): void {
  console.log(operation);
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

function handleAddNewEdge(operation: proto.IAddNewEdgeOperation): void {
  console.log(operation);
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

function handleReuseState(operation: proto.IReuseStateOperation): void {
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
