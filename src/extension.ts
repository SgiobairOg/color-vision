// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { isNull } from "util";

const MAX_DECORATIONS_PER_TYPE = 200;
const DECORATION_UPDATE_DELAY = 200;

const hexColorDecorationType = vscode.window.createTextEditorDecorationType({
  before: {
    contentText: " ",
    border: "solid 0.1em #000",
    margin: "0.1em 0.2em -0.1em 0.2em",
    width: "1.8em",
    height: "1.2em"
  },
  dark: {
    before: {
      borderColor: "white"
    }
  }
});

const rgbxColorDecorationType = vscode.window.createTextEditorDecorationType({
  before: {
    contentText: " ",
    border: "solid 0.1em #000",
    margin: "0.1em 0.2em 0 0.2em",
    width: "1.8em",
    height: "1.2em"
  },
  dark: {
    before: {
      borderColor: "white"
    }
  }
});

export function activate(context: vscode.ExtensionContext) {
  let timeout: NodeJS.Timer | undefined = undefined;
  let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
  let disposables: vscode.Disposable[] = [];

  const hexColorsPattern = /(#[0-9A-Fa-f]{8}\b|#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b)/gim;
  // You can view and debug this regex at https://www.debuggex.com/r/NXCGLPeNmZf8yl35

  const rgbxColorsPattern = /(rgba\((1?[0-9]{1,2}|2[0-4][0-9]|25[0-5]),(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5]),(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5]),(0?.?[0-9]+|1.0+|1)\)|rgb\((1?[0-9]{1,2}|2[0-4][0-9]|25[0-5]),(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5]),(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\))/gim;
  // You can view and debug this regex at https://www.debuggex.com/r/UqTPyhSv1LWC4eKV

  disposables.push(hexColorDecorationType);
  disposables.push(rgbxColorDecorationType);

  function updateDecorations() {
    if (!editor) {
      return null;
    }

    const text = editor.document.getText();
    const hexDecorations: vscode.DecorationOptions[] = [];
    const rgbxDecorations: vscode.DecorationOptions[] = [];

    processMatches(editor.document, text, hexColorsPattern, hexDecorations);
    processMatches(editor.document, text, rgbxColorsPattern, rgbxDecorations);

    editor.setDecorations(hexColorDecorationType, hexDecorations);
    editor.setDecorations(rgbxColorDecorationType, rgbxDecorations);

    return vscode.Disposable.from(...disposables);
  }

  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    timeout = setTimeout(() => {
      updateDecorations();
    }, DECORATION_UPDATE_DELAY);
  }

  if (editor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    newEditor => {
      editor = newEditor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    disposables
  );

  vscode.workspace.onDidChangeTextDocument(
    event => {
      if (editor && event.document === editor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    disposables
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

function decorationFactory(
  input: string,
  startPos: vscode.Position,
  endPos: vscode.Position
): vscode.DecorationOptions {
  return {
    range: new vscode.Range(startPos, endPos),
    hoverMessage: `Color ${input}`,
    renderOptions: {
      before: {
        backgroundColor: input
      }
    }
  };
}

function processMatches(
  document: vscode.TextDocument,
  text: string,
  pattern: RegExp,
  accumulator: vscode.DecorationOptions[]
) {
  let match;
  while ((match = pattern.exec(text))) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);

    accumulator.push(decorationFactory(match[0], startPos, endPos));
    accumulator.slice(0, MAX_DECORATIONS_PER_TYPE);
  }
}
