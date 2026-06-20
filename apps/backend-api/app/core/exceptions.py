from fastapi import HTTPException, status

class EcoTraceException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class UserAlreadyExistsException(EcoTraceException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

class InvalidCredentialsException(EcoTraceException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials. Please check email/password."
        )

class EntityNotFoundException(EcoTraceException):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity_name} with identifier '{entity_id}' could not be located."
        )
