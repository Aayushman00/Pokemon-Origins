// frontend/src/pages/Game/battle/MoveMenu.jsx
import React from 'react';
import { TYPE_COLORS } from '../../../utils/typeColors';

/**
 * Move-select UI, split across two DOM slots by BattleSim.jsx's existing
 * dialog-box/menu-box layout: part="grid" is the 2x2 move buttons (dialog
 * box side), part="info" is the PP/type/description panel (menu box
 * side). Lifted from BattleSim.jsx's inline JSX -- same props/behavior,
 * arrow-key navigation is unchanged (still driven by BattleSim.jsx's
 * existing keydown effect and menuCursor state).
 */
const MoveMenu = ({
  part,
  grid,
  menuCursor,
  hoveredMove,
  mustStruggle,
  onSelectMove,
  onHoverMove,
  onLeaveHover,
  onFocusMove,
  onBlurMove,
}) => {
  if (part === 'grid') {
    if (mustStruggle) {
      return (
        <div className="gba-move-grid">
          <button
            className="gba-move-btn gba-move-btn--struggle"
            onClick={() => onSelectMove({ move_id: -1, name: 'Struggle', move_type: 'Normal' })}
          >
            STRUGGLE
          </button>
        </div>
      );
    }
    return (
      <div className="gba-move-grid">
        {grid.map((move, index) =>
          move ? (
            <button
              key={move.move_id}
              className={`gba-move-btn ${menuCursor === index ? 'selected' : ''}`}
              onClick={() => onSelectMove(move, index)}
              onMouseEnter={() => onHoverMove(move, index)}
              onMouseLeave={onLeaveHover}
              onFocus={() => onFocusMove(move)}
              onBlur={onBlurMove}
              disabled={typeof move.current_pp === 'number' && move.current_pp <= 0}
            >
              <span className="gba-cursor-arrow">{menuCursor === index ? '▶' : ''}</span>
              <span className="gba-move-btn-name">{move.name}</span>
              {typeof move.current_pp === 'number' && (
                <span className="gba-move-btn-pp">
                  {move.current_pp}/{move.max_pp}
                </span>
              )}
            </button>
          ) : (
            <button key={index} className="gba-move-btn blank" disabled></button>
          )
        )}
      </div>
    );
  }

  // part === 'info'
  const shown = hoveredMove || grid[menuCursor];
  return (
    <div className="gba-move-info">
      {shown ? (
        <>
          <p><strong>{shown.name}</strong></p>
          <p>
            Type:{' '}
            {(shown.type || shown.move_type) && (
              <span
                className="move-type"
                style={{
                  background:
                    TYPE_COLORS[String(shown.type || shown.move_type).toLowerCase()] || '#a8a77a',
                }}
              >
                {shown.type || shown.move_type}
              </span>
            )}
          </p>
          <p>
            PP: {typeof shown.current_pp === 'number' ? `${shown.current_pp}/${shown.max_pp}` : '—'}
          </p>
          <p>Description: {shown.description ? shown.description : 'No description available.'}</p>
        </>
      ) : (
        <p>Hover over a move for details</p>
      )}
    </div>
  );
};

export default MoveMenu;
