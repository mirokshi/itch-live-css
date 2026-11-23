// CodeMirror 6 over a CSS or HTML text. The text lives in the parent's state (value/onChange); the
// validator's problems show as marks at their line and column (lint: { text, problems }, applied
// only while the editor still holds the text they were found in). viewRef gets the EditorView, so
// the parent can move view.dom into the "Ampliar" dialog and back. readOnly: to show code (idea pages).

import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { lintGutter, setDiagnostics } from '@codemirror/lint';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

// PostCSS positions (1-based line and column, end exclusive) → document offsets, clamped to the text
function diagnostics(doc, problems) {
  const at = (line, column) => {
    const l = doc.line(Math.min(Math.max(line, 1), doc.lines));
    return Math.min(l.from + Math.max(column, 1) - 1, l.to);
  };
  return problems.filter((p) => p.line).map((p) => {
    const from = at(p.line, p.column);
    return {
      from,
      to: p.endLine ? Math.max(from, at(p.endLine, p.endColumn)) : from,
      severity: p.level === 'error' ? 'error' : 'warning',
      message: `${p.rule}${p.title ? ` · ${p.title}` : ''}: ${p.message}`,
    };
  });
}

export function CodeEditor({ lang, label, value, onChange = () => {}, lint, viewRef, readOnly = false }) {
  const host = useRef(null);
  const changed = useRef(onChange);
  changed.current = onChange;
  // the label follows the page type and the language, so it can be swapped without a new editor
  const labelled = useRef(new Compartment());
  const named = (text) => EditorView.contentAttributes.of({ 'aria-label': text });

  useEffect(() => {
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          lang === 'css' ? css() : html(),
          EditorView.lineWrapping,
          labelled.current.of(named(label)),
          lintGutter(),
          EditorState.readOnly.of(readOnly),
          EditorView.updateListener.of((u) => u.docChanged && changed.current(u.state.doc.toString())),
        ],
      }),
    });
    viewRef.current = view;
    return () => view.destroy();
  }, []);

  useEffect(() => {
    viewRef.current.dispatch({ effects: labelled.current.reconfigure(named(label)) });
  }, [label]);

  // a change from outside (a saved config, "Dar formato") replaces the text
  useEffect(() => {
    const view = viewRef.current;
    if (view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!lint) view.dispatch(setDiagnostics(view.state, []));
    else if (view.state.doc.toString() === lint.text) view.dispatch(setDiagnostics(view.state, diagnostics(view.state.doc, lint.problems)));
  }, [lint]);

  return <div className="cm-host" ref={host} />;
}
