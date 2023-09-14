// Adapted from https://github.com/silevis/reactgrid-website/blob/update/docs/src/samples/cellTemplates/horizontalChevronCellTemplate/HorizontalChevronCellTemplate.tsx

import * as React from 'react';
import {
  CellTemplate, Cell, Compatible, Uncertain, UncertainCompatible, Id, getCellProperty
  // isNavigationKey, isAlphaNumericKey, 
} from "@silevis/reactgrid";

export interface HorizontalChevronCell extends Cell {
  type: 'horizontalChevron';
  text: string;
  isExpanded?: boolean;
  hasChildren?: boolean;
  indent?: number;
  columnId?: Id; // helper field
  parentId?: Id;
}

export class HorizontalChevronCellTemplate implements CellTemplate<HorizontalChevronCell> {

  getCompatibleCell(uncertainCell: Uncertain<HorizontalChevronCell>): Compatible<HorizontalChevronCell> {
    const text = getCellProperty(uncertainCell, 'text', 'string');
    let isExpanded = false;
    try {
      isExpanded = getCellProperty(uncertainCell, 'isExpanded', 'boolean');
    } catch {
      isExpanded = true;
    }
    let hasChildren = false;
    try {
      hasChildren = getCellProperty(uncertainCell, 'hasChildren', 'boolean');
    } catch {
      hasChildren = false;
    }
    const value = parseFloat(text);
    return { ...uncertainCell, text, value, isExpanded, hasChildren };
  }

  update(cell: Compatible<HorizontalChevronCell>, cellToMerge: UncertainCompatible<HorizontalChevronCell>): Compatible<HorizontalChevronCell> {
    return this.getCompatibleCell({ ...cell, isExpanded: cellToMerge.isExpanded, text: cellToMerge.text })
  }

  isFocusable = () => false;

  // handleKeyDown(cell: Compatible<HorizontalChevronCell>, keyCode: number, ctrl: boolean, shift: boolean, alt: boolean): { cell: Compatible<HorizontalChevronCell>, enableEditMode: boolean } {
  //   // let enableEditMode = keyCode === keyCodes.POINTER || keyCode === keyCodes.ENTER;
  //   const cellCopy = { ...cell };
  //   // const char = getCharFromKeyCode(keyCode, shift);
  //   // if (keyCode === keyCodes.SPACE && cellCopy.isExpanded !== undefined && !shift) {
  //   //     cellCopy.isExpanded = !cellCopy.isExpanded;
  //   // } else if (!ctrl && !alt && isAlphaNumericKey(keyCode) && !(shift && keyCode === keyCodes.SPACE)) {
  //   //     cellCopy.text = !shift ? char.toLowerCase() : char;
  //   //     enableEditMode = true;
  //   // }
  //   return { cell: cellCopy, enableEditMode: false }; // FORCED DISABLED EDIT MODE
  // }

  // getClassName(cell: Compatible<HorizontalChevronCell>, _isInEditMode: boolean) {
  getClassName(cell: Compatible<HorizontalChevronCell>) {
    const isExpanded = cell.hasChildren ? cell.isExpanded ? 'expanded' : 'collapsed' : '';
    const className = cell.className || '';
    return `${isExpanded} ${className}`;
  }

  // render(cell: Compatible<HorizontalChevronCell>, isInEditMode: boolean, onCellChanged: (cell: Compatible<HorizontalChevronCell>, commit: boolean) => void): React.ReactNode {
  render(cell: Compatible<HorizontalChevronCell>, _isInEditMode: boolean, onCellChanged: (cell: Compatible<HorizontalChevronCell>, commit: boolean) => void): React.ReactNode {
    return (
      <>
        <div
          style={{
            marginLeft: `${(cell.indent || 0) }rem`,
          }}
        />
        {cell.hasChildren ?
          <div
            className='chevron'
            onPointerDown={e => {
              e.stopPropagation();
              onCellChanged(this.getCompatibleCell({ ...cell, isExpanded: !cell.isExpanded }), true)
            }}
          >
            <span className='icon'>❯</span>
          </div>
          :
          <div className='no-child' />
        }
        {cell.text}
      </>
    );
  }

}

