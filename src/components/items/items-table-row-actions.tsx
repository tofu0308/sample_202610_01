/**
 * 一覧行の操作ボタン（編集／保存／キャンセル／削除）。
 * キャンセル分の幅を常に確保し、編集開始で表幅が伸びないようにする。
 */

import {
  itemDangerButtonClass,
  itemEditButtonClass,
  itemPrimaryButtonClass,
  itemSecondaryButtonClass,
} from "@/components/items/item-action-styles";

type ItemsTableRowActionsProps = {
  editing: boolean;
  pending: boolean;
  disabled: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function ItemsTableRowActions({
  editing,
  pending,
  disabled,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ItemsTableRowActionsProps) {
  return (
    <div className="flex flex-nowrap items-center gap-1">
      {editing ? (
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className={itemPrimaryButtonClass.row}
        >
          {pending ? "保存中…" : "保存"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          disabled={disabled}
          className={itemEditButtonClass.row}
        >
          編集
        </button>
      )}
      {editing ? (
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={disabled}
          className={itemSecondaryButtonClass.row}
        >
          キャンセル
        </button>
      ) : (
        <span className="invisible" aria-hidden="true">
          <button
            type="button"
            tabIndex={-1}
            disabled
            className={itemSecondaryButtonClass.row}
          >
            キャンセル
          </button>
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className={itemDangerButtonClass.row}
      >
        {pending && !editing ? "削除中…" : "削除"}
      </button>
    </div>
  );
}
