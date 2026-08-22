from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.modules.decks.enums import Language
from app.modules.decks.models import Deck
from app.modules.library import schemas
from app.modules.library.models import Folder

class FolderNotFoundError(Exception):
    """Папка не найдена или принадлежит другому пользователю."""

class FolderLanguageMismatchError(Exception):
    """Язык папки не совпадает с языком родителя/колоды."""

def _get_owned_folder(db: Session, user_id: int, folder_id: int) -> Folder:
    folder = db.scalar(select(Folder).where(Folder.id == folder_id, Folder.user_id == user_id))
    if folder is None:
        raise FolderNotFoundError(folder_id)
    return folder

def get_owned_folder_for_language(db: Session, user_id: int, folder_id: int, language: Language) -> Folder:
    """Используется decks/service.py при назначении deck.folder_id — папка
    должна принадлежать тому же пользователю и языку, что и колода."""
    folder = _get_owned_folder(db, user_id, folder_id)
    if folder.language != language:
        raise FolderLanguageMismatchError(folder_id)
    return folder

def create_folder(db: Session, user_id: int, data: schemas.FolderCreate) -> Folder:
    parent: Folder | None = None
    if data.parent_folder_id is not None:
        parent = get_owned_folder_for_language(db, user_id, data.parent_folder_id, data.language)

    folder = Folder(
        user_id=user_id,
        language=data.language,
        name=data.name,
        parent_folder_id=parent.id if parent is not None else None,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

def list_folders(db: Session, user_id: int, language: Language) -> list[Folder]:
    stmt = select(Folder).where(Folder.user_id == user_id, Folder.language == language)
    return list(db.scalars(stmt).all())

def get_folder(db: Session, user_id: int, folder_id: int) -> Folder:
    return _get_owned_folder(db, user_id, folder_id)

def update_folder(db: Session, user_id: int, folder_id: int, data: schemas.FolderUpdate) -> Folder:
    folder = _get_owned_folder(db, user_id, folder_id)

    fields_set = data.model_fields_set  # различаем «не передано» и «явный null»

    if "name" in fields_set and data.name is not None:
        folder.name = data.name

    if "parent_folder_id" in fields_set:
        if data.parent_folder_id is None:
            folder.parent_folder_id = None
        else:
            if data.parent_folder_id == folder.id:
                raise FolderLanguageMismatchError(folder_id)
            new_parent = get_owned_folder_for_language(
                db, user_id, data.parent_folder_id, folder.language
            )
            folder.parent_folder_id = new_parent.id

    db.commit()
    db.refresh(folder)
    return folder

def delete_folder(db: Session, user_id: int, folder_id: int) -> None:
    """Удаляет папку, "поднимая" её прямых детей (подпапки и колоды) на
    уровень выше — к родителю удаляемой папки (или в корень, если удаляемая
    папка сама была корневой). Содержимое НЕ удаляется каскадом."""
    folder = _get_owned_folder(db, user_id, folder_id)
    grandparent_id = folder.parent_folder_id

    db.execute(
        update(Folder)
        .where(Folder.parent_folder_id == folder.id)
        .values(parent_folder_id=grandparent_id)
    )
    db.execute(
        update(Deck)
        .where(Deck.folder_id == folder.id)
        .values(folder_id=grandparent_id)
    )
    db.delete(folder)
    db.commit()
