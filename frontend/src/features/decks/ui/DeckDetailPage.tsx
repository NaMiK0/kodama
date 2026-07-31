import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import type { Card } from '@/features/cards/api'
import { AddCardsModal } from '@/features/cards/ui/AddCardsModal'
import { CardRow } from '@/features/cards/ui/CardRow'
import { EditCardModal } from '@/features/cards/ui/EditCardModal'
import { useCards, useDeleteCard } from '@/features/cards/hooks'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'

import { useDeck, useDeleteDeck } from '../hooks'

export function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const id = Number(deckId)
  const navigate = useNavigate()

  const { data: deck, isPending: deckPending } = useDeck(id)
  const { data: cards, isPending: cardsPending } = useCards(id)
  const [modalOpen, setModalOpen] = useState(false)

  const deleteCard = useDeleteCard(id)
  const [cardToDelete, setCardToDelete] = useState<{ id: number; word: string }>()
  const [cardToEdit, setCardToEdit] = useState<Card>()

  const deleteDeck = useDeleteDeck()
  const [deckDeleteOpen, setDeckDeleteOpen] = useState(false)

  if (deckPending || !deck) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-ink-muted">Загрузка…</p>
      </div>
    )
  }

  async function handleConfirmDeleteCard() {
    if (!cardToDelete) return
    await deleteCard.mutateAsync(cardToDelete.id)
    setCardToDelete(undefined)
  }

  async function handleConfirmDeleteDeck() {
    await deleteDeck.mutateAsync(id)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/" className="mb-2 inline-block text-sm text-ink-muted hover:text-ink">
        ← Мои колоды
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-ink">{deck.topic}</h1>
          <span className="text-sm text-ink-muted">
            {deck.language.toUpperCase()} · {deck.level}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger-soft" onClick={() => setDeckDeleteOpen(true)}>
            Удалить колоду
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/decks/${id}/triage`)}>
            Разобрать колоду
          </Button>
          <Button onClick={() => setModalOpen(true)}>Добавить карточки</Button>
        </div>
      </div>

      {cardsPending ? (
        <p className="text-ink-muted">Загрузка…</p>
      ) : cards && cards.length > 0 ? (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              onEdit={() => setCardToEdit(card)}
              onDelete={() => setCardToDelete({ id: card.id, word: card.word })}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
          <p className="text-ink-muted">В этой колоде пока нет карточек</p>
          <Button onClick={() => setModalOpen(true)}>Добавить первую карточку</Button>
        </div>
      )}

      <AddCardsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        deckId={id}
        language={deck.language}
      />

      <EditCardModal
        card={cardToEdit}
        onClose={() => setCardToEdit(undefined)}
        deckId={id}
        language={deck.language}
      />

      <ConfirmModal
        open={cardToDelete !== undefined}
        onClose={() => setCardToDelete(undefined)}
        onConfirm={handleConfirmDeleteCard}
        title="Удалить карточку?"
        description={`«${cardToDelete?.word}» будет удалена без возможности восстановления.`}
        loading={deleteCard.isPending}
      />

      <ConfirmModal
        open={deckDeleteOpen}
        onClose={() => setDeckDeleteOpen(false)}
        onConfirm={handleConfirmDeleteDeck}
        title="Удалить колоду?"
        description={`«${deck.topic}» и все её карточки (${deck.card_count}) будут удалены без возможности восстановления.`}
        loading={deleteDeck.isPending}
      />
    </div>
  )
}
