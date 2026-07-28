import { useState, type FormEvent } from "react";

import type { StudyLanguage } from "@/shared/lib/LanguageProvider";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

import type { CardCreatePayload } from "../api";
import { useAddCards } from "../hooks";
import {
  CardEntryRow,
  emptyCardEntryRow,
  type CardEntryRowValue,
} from "./CardEntryRow";

type Props = {
  open: boolean;
  onClose: () => void;
  deckId: number;
  language: StudyLanguage;
};

export function AddCardsModal({ open, onClose, deckId, language }: Props) {
  const [rows, setRows] = useState<CardEntryRowValue[]>([emptyCardEntryRow()]);
  const [addedCount, setAddedCount] = useState(0);

  const addCards = useAddCards(deckId);

  function handleClose() {
    setRows([emptyCardEntryRow()]);
    setAddedCount(0);
    onClose();
  }

  function updateRow(key: string, patch: Partial<CardEntryRowValue>) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, ...patch, error: undefined } : row,
      ),
    );
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Локальная валидация: строки без обязательных полей не летят на бэкенд,
    // сразу получают ошибку под собой, как и провалившиеся запросы.
    const payloads: CardCreatePayload[] = [];
    const payloadKeys: string[] = [];
    const validated = rows.map((row) => {
      const word = row.word.trim();
      const translation = row.translation.trim();
      const reference = row.reference.trim();

      if (!word || !translation || (language === "ja" && !reference)) {
        return {
          ...row,
          error:
            language === "ja" && !reference
              ? "Укажите слово, перевод и чтение"
              : "Укажите слово и перевод",
        };
      }

      payloadKeys.push(row.key);
      payloads.push({
        word,
        translation,
        ...(language === "ja" ? { reference } : {}),
        ...(row.exampleSentence.trim()
          ? { example_sentence: row.exampleSentence.trim() }
          : {}),
      });
      return row;
    });

    if (payloads.length === 0) {
      setRows(validated);
      return;
    }

    const results = await addCards.mutateAsync(payloads);
    const errorByKey = new Map<string, string>();
    results.forEach((result, index) => {
      if (!result.ok) errorByKey.set(payloadKeys[index]!, result.message);
    });

    // Оставляем строки с локальной ошибкой валидации и те, что бэкенд
    // не принял; успешно созданные убираем из формы.
    const remaining = validated.filter(
      (row) => row.error || errorByKey.has(row.key),
    );

    if (remaining.length === 0) {
      handleClose();
      return;
    }

    setAddedCount(payloads.length - errorByKey.size);
    setRows(
      remaining.map((row) => {
        const apiError = errorByKey.get(row.key);
        return apiError ? { ...row, error: apiError } : row;
      }),
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Добавить карточки"
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {rows.map((row, index) => (
            <CardEntryRow
              key={row.key}
              row={row}
              language={language}
              onChange={(patch) => updateRow(row.key, patch)}
              onRemove={() => removeRow(row.key)}
              canRemove={rows.length > 1}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyCardEntryRow()])}
          className="self-start rounded-md px-2 py-1 text-sm text-accent-strong transition-colors duration-150 hover:bg-accent-soft"
        >
          Добавить слово
        </button>

        {addedCount > 0 && (
          <p className="text-sm text-accent-strong">Добавлено: {addedCount}</p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={addCards.isPending}>
            Создать карточки
          </Button>
        </div>
      </form>
    </Modal>
  );
}
