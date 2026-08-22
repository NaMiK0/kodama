from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.decks.enums import Language
from app.modules.library import schemas, service
from app.modules.library.models import Folder

router = APIRouter(prefix="/folders", tags=["library"])

@router.post("", response_model=schemas.FolderRead, status_code=status.HTTP_201_CREATED)
def create_folder(
    data: schemas.FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Folder:
    try:
        return service.create_folder(db, current_user.id, data)
    except service.FolderNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Родительская папка не найдена")
    except service.FolderLanguageMismatchError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Язык папки должен совпадать с языком родительской папки",
        )

@router.get("", response_model=list[schemas.FolderRead])
def list_folders(
    language: Language,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Folder]:
    return service.list_folders(db, current_user.id, language)

@router.patch("/{folder_id}", response_model=schemas.FolderRead)
def update_folder(
    folder_id: int,
    data: schemas.FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Folder:
    try:
        return service.update_folder(db, current_user.id, folder_id, data)
    except service.FolderNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Папка не найдена")
    except service.FolderLanguageMismatchError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Язык папки должен совпадать с языком родительской папки",
        )

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        service.delete_folder(db, current_user.id, folder_id)
    except service.FolderNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Папка не найдена")
