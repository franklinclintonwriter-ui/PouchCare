import { useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/utils/cn';

export interface KanbanColumn<T> {
  id: string;
  title: string;
  count: number;
  color?: string;
  subtitle?: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => ReactNode;
  renderOverlay?: (item: T) => ReactNode;
  onDragEnd: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  getItemId: (item: T) => string;
  className?: string;
}

function KanbanBoard<T>({
  columns,
  renderCard,
  renderOverlay,
  onDragEnd,
  getItemId,
  className,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    for (const col of columns) {
      const item = col.items.find((i) => getItemId(i) === activeId);
      if (item) {
        setActiveItem(item);
        break;
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let fromColumn = '';
    let toColumn = '';

    for (const col of columns) {
      if (col.items.find((i) => getItemId(i) === activeId)) fromColumn = col.id;
      if (col.id === overId || col.items.find((i) => getItemId(i) === overId)) toColumn = col.id;
    }

    if (fromColumn && toColumn && fromColumn !== toColumn) {
      onDragEnd(activeId, fromColumn, toColumn);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('flex gap-4 overflow-x-auto pb-4 scrollbar-thin', className)}>
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-50/80 dark:bg-gray-800/40"
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                {column.color && (
                  <span className={cn('h-2 w-2 rounded-full', column.color)} />
                )}
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {column.title}
                </h3>
                <span className="rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-700/60 dark:text-gray-400">
                  {column.count}
                </span>
              </div>
              {column.subtitle && (
                <span className="text-[10px] font-medium text-gray-400">{column.subtitle}</span>
              )}
            </div>

            {/* Column items */}
            <SortableContext
              id={column.id}
              items={column.items.map(getItemId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex-1 space-y-2 px-2 pb-2 min-h-[100px]">
                {column.items.map((item) => (
                  <div key={getItemId(item)}>{renderCard(item)}</div>
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeItem && (renderOverlay ? renderOverlay(activeItem) : renderCard(activeItem))}
      </DragOverlay>
    </DndContext>
  );
}

export { KanbanBoard };
