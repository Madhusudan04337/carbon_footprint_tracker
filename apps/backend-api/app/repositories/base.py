from typing import Generic, TypeVar, Type, List, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        # Filter out soft-deleted items by default
        return db.query(self.model).filter(
            self.model.id == id,
            self.model.deleted_at == None
        ).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return db.query(self.model).filter(
            self.model.deleted_at == None
        ).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: Any) -> ModelType:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def update(self, db: Session, *, db_obj: ModelType, obj_in: Any) -> ModelType:
        # Standard update logic applying changes
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.__dict__
            
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: Any) -> Optional[ModelType]:
        # Perform Soft Delete instead of hard database purge
        obj = db.query(self.model).get(id)
        if obj and hasattr(obj, 'deleted_at'):
            obj.deleted_at = datetime.utcnow()
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj
